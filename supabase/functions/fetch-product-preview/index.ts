import { createClient } from "npm:@supabase/supabase-js@2";
// Supabase Edge Function: fetch-product-preview
// Requires the normal Supabase JWT verification (do not disable verify_jwt).
// Reads product metadata only; it does not download or store the retailer's image.
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://silverstormz.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  return p[0] === 0 || p[0] === 10 || p[0] === 127 ||
    (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
    p[0] >= 224;
}
function isPrivateIPv6(ip: string): boolean {
  const value = ip.toLowerCase();
  return value === "::1" || value === "::" || value.startsWith("fc") ||
    value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") ||
    value.startsWith("fea") || value.startsWith("feb") || value.startsWith("::ffff:127.") ||
    value.startsWith("::ffff:10.") || value.startsWith("::ffff:192.168.");
}
async function validatePublicHost(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only web links are supported.");
  if (url.username || url.password) throw new Error("This link is not supported.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error("This website address is not supported.");
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    if (isPrivateIPv4(host)) throw new Error("This website address is not supported.");
    return;
  }
  if (host.includes(":")) {
    if (isPrivateIPv6(host)) throw new Error("This website address is not supported.");
    return;
  }
  const addresses = await Promise.all([
    Deno.resolveDns(host, "A").catch(() => [] as string[]),
    Deno.resolveDns(host, "AAAA").catch(() => [] as string[]),
  ]);
  const resolved = addresses.flat();
  if (!resolved.length || resolved.some(ip => ip.includes(":") ? isPrivateIPv6(ip) : isPrivateIPv4(ip))) {
    throw new Error("This website address could not be verified as public.");
  }
}
function decodeEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).trim();
}
function metaContent(html: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp('<meta[^>]+(?:property|name)\\s*=\\s*["\\']' + escaped + '["\\'][^>]+content\\s*=\\s*["\\']([^"\\']+)["\\']', "i"),
    new RegExp('<meta[^>]+content\\s*=\\s*["\\']([^"\\']+)["\\'][^>]+(?:property|name)\\s*=\\s*["\\']' + escaped + '["\\']', "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return "";
}
function safeImage(value: string, base: URL): string {
  try {
    const image = new URL(value, base);
    if ((image.protocol === "https:" || image.protocol === "http:") && !image.username && !image.password) return image.href;
  } catch { /* ignore invalid image URLs */ }
  return "";
}
function productJsonLd(html: string): Record<string, unknown> | null {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of scripts) {
    const raw = script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      const queue = [...candidates];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== "object") continue;
        const obj = item as Record<string, unknown>;
        if (Array.isArray(obj["@graph"])) queue.push(...obj["@graph"] as unknown[]);
        const type = obj["@type"];
        if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return obj;
      }
    } catch { /* malformed structured data */ }
  }
  return null;
}
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (request.method !== "POST") return respond({ message: "Method not allowed." }, 405);
  try {
    const body = await request.json();
    if (typeof body?.url !== "string" || body.url.length > 2048) return respond({ message: "Please provide a valid product link." }, 400);
    let current = new URL(body.url);
    let response: Response | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      await validatePublicHost(current);
      response = await fetch(current.href, {
        redirect: "manual",
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HalimasCloset/1.0; +https://silverstormz.github.io/Halimas-closet/)", "Accept": "text/html,application/xhtml+xml" },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location || attempt === 3) throw new Error("This product link redirected too many times.");
        current = new URL(location, current);
        continue;
      }
      break;
    }
    if (!response?.ok) throw new Error("This store did not allow its product page to be read.");
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) throw new Error("That link does not appear to be a product webpage.");
    const html = (await response.text()).slice(0, 1_500_000);
    const product = productJsonLd(html);
    const productImage = product?.image;
    const jsonImage = Array.isArray(productImage) ? productImage[0] : typeof productImage === "object" && productImage ? (productImage as Record<string, unknown>).url : productImage;
    const image = safeImage(
      metaContent(html, "og:image") || metaContent(html, "twitter:image") ||
      (typeof jsonImage === "string" ? jsonImage : ""),
      current,
    );
    if (!image) return respond({ message: "No product image was found on this page." }, 404);

    // Copy the retailer image into the user's existing public wardrobe photo bucket
    // so the wishlist does not depend on the retailer keeping the same image URL.
    const imageUrl = new URL(image);
    await validatePublicHost(imageUrl);
    const imageResponse = await fetch(imageUrl.href, {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HalimasCloset/1.0)", "Accept": "image/*" },
    });
    if (!imageResponse.ok) throw new Error("The product image could not be downloaded from this store.");
    const imageType = (imageResponse.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!imageType.startsWith("image/")) throw new Error("The store did not provide a usable product image.");
    const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
    if (!imageBytes.length || imageBytes.length > 6 * 1024 * 1024) throw new Error("The product image is too large to save (6 MB maximum).");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("Cloud photo storage is not configured yet.");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: request.headers.get("Authorization") || "" } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return respond({ message: "Please sign in to save a product photo." }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const extension = imageType.includes("png") ? "png" : imageType.includes("webp") ? "webp" : imageType.includes("gif") ? "gif" : "jpg";
    const photoPath = userData.user.id + "/wishlist/" + crypto.randomUUID() + "." + extension;
    const { error: uploadError } = await adminClient.storage.from("wardrobe-photos").upload(photoPath, imageBytes, {
      contentType: imageType,
      upsert: false,
    });
    if (uploadError) throw new Error("The product image was found, but could not be saved to your cloud photo library.");
    const { data: publicPhoto } = adminClient.storage.from("wardrobe-photos").getPublicUrl(photoPath);

    const offers = product?.offers && typeof product.offers === "object" ? product.offers as Record<string, unknown> : {};
    const title = metaContent(html, "og:title") || (typeof product?.name === "string" ? product.name : "") ||
      (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    const brandValue = product?.brand && typeof product.brand === "object" ? (product.brand as Record<string, unknown>).name : product?.brand;
    const price = offers.price ? String(offers.price) + (offers.priceCurrency ? " " + String(offers.priceCurrency) : "") : "";
    return respond({
      image: publicPhoto.publicUrl,
      title: decodeEntities(String(title || "")).slice(0, 180),
      brand: typeof brandValue === "string" ? brandValue.slice(0, 100) : "",
      price: price.slice(0, 60),
      source: current.hostname,
    });
  } catch (error) {
    return respond({ message: error instanceof Error ? error.message : "Could not retrieve product information." }, 400);
  }
});
