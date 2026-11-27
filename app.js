const STORAGE_KEY = "halimas-closet-items-v1";
const grid = document.getElementById("closetGrid");
const emptyState = document.getElementById("emptyState");
const dialog = document.getElementById("itemDialog");
const form = document.getElementById("itemForm");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const photoLabel = document.getElementById("photoLabel");
const wishDialog = document.getElementById("wishDialog");
const wishForm = document.getElementById("wishForm");
const wishlistGrid = document.getElementById("wishlistGrid");
const wishlistEmpty = document.getElementById("wishlistEmpty");
const wishlistSection = document.getElementById("wishlistSection");
const closetToolbar = document.getElementById("closetToolbar");
const categoryNav = document.getElementById("categoryNav");
const closetGrid = document.getElementById("closetGrid");
const closetEmpty = document.getElementById("emptyState");
const measurementsSection = document.getElementById("measurementsSection");
const outfitsSection = document.getElementById("outfitsSection");
const outfitsGrid = document.getElementById("outfitsGrid");
const outfitsEmpty = document.getElementById("outfitsEmpty");
const WORN_KEY="halimas-closet-worn-photos-v1";
function loadWornLooks(){try{return JSON.parse(localStorage.getItem(WORN_KEY)||"[]")}catch{return []}}
const legacyWornLooks=loadWornLooks();
const outfitDialog = document.getElementById("outfitDialog");
const outfitForm = document.getElementById("outfitForm");
const outfitPhotoInput=document.getElementById("outfitPhotoInput");
const outfitPhotoPreview=document.getElementById("outfitPhotoPreview");
let editingOutfitPhoto="";
const OUTFITS_STORAGE_KEY = "halimas-closet-outfits-v1";
let outfits = loadOutfits();
let editingOutfitId = null;
const measurementsForm = document.getElementById("measurementsForm");
const MEASUREMENTS_STORAGE_KEY = "halimas-closet-measurements-v1";
const FRAGRANCES_STORAGE_KEY = "halimas-closet-fragrances-v1";
const fragranceSection = document.getElementById("fragranceSection");
const fragranceGrid = document.getElementById("fragranceGrid");
const fragranceEmpty = document.getElementById("fragranceEmpty");
const fragranceDialog = document.getElementById("fragranceDialog");
const fragranceForm = document.getElementById("fragranceForm");
let fragrances = loadFragrances();
let editingFragranceId = null;
const measurementFields = ["measureHeight","measureWeight","measureBust","measureWaist","measureHips","measureInseam","sizeTops","sizeBottoms","sizeDresses","sizeOuterwear","sizeBra","sizeShoes","sizeRings","sizeBracelet","sizeNecklace","sizeBelt","sizeHat","measureNotes"];
const WISH_STORAGE_KEY = "halimas-closet-wishlist-v1";
let wishes = loadWishes();
let wishPhoto = "";
let wishPhotoProcessingPromise = Promise.resolve();
let activeView = "closet";
let editingItemId = null;
let editingPhoto = "";
let editingOriginalPhoto = "";
let photoProcessingPromise = Promise.resolve();

function loadWishes() {
  try { return JSON.parse(localStorage.getItem(WISH_STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveWishes() {
  try {
    localStorage.setItem(WISH_STORAGE_KEY, JSON.stringify(wishes));
    updateStorageIndicator();
    queueCloudSync("wishlist_items");
    return true;
  } catch {
    alert("Your browser storage is full. Try removing a few saved wishes.");
    return false;
  }
}
function renderWishes() {
  wishlistGrid.innerHTML = wishes.map(wish => `
    <article class="wish-card"${wish.link ? ` data-wish-url="${escapeHTML(wish.link)}" role="link" tabindex="0" aria-label="Open ${escapeHTML(wish.name)} product page in a new tab"` : ""}>
      <div class="wish-card-top"><span>♡ A LITTLE WISH</span><button class="wish-delete" data-wish-delete="${escapeHTML(wish.id)}" aria-label="Remove ${escapeHTML(wish.name)}">×</button></div>
      ${wish.photo ? `<div class="wish-photo-link"><img class="wish-card-photo" src="${escapeHTML(wish.photo)}" alt="${escapeHTML(wish.name)}"></div>` : ""}
      <h3>${escapeHTML(wish.name)}</h3>
      <p class="wish-brand">${escapeHTML(wish.brand || wish.category || "On my radar")}</p>
      ${wish.price ? `<p class="wish-price">${escapeHTML(wish.price)}</p>` : ""}
      ${wish.notes ? `<p class="wish-notes">${escapeHTML(wish.notes)}</p>` : ""}
      <div class="wish-actions">
        <button type="button" data-wish-got="${escapeHTML(wish.id)}">I got it! ✧</button>
      </div>
    </article>`;`).join("");
  wishlistEmpty.hidden = wishes.length > 0;
}
function setView(view) {
  activeView = view;
  document.querySelectorAll(".archive-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === view));
  const showingCloset = view === "closet";
  const showingWishlist = view === "wishlist";
  const showingOutfits = view === "outfits";
  const showingFragrances = view === "fragrances";
  closetToolbar.hidden = !showingCloset;
  categoryNav.hidden = !showingCloset;
  closetGrid.hidden = !showingCloset;
  closetEmpty.hidden = !showingCloset || items.length !== 0;
  wishlistSection.hidden = !showingWishlist;
  measurementsSection.hidden = view !== "measurements";
  outfitsSection.hidden = !showingOutfits;
  fragranceSection.hidden = !showingFragrances;
  if (showingWishlist) renderWishes();
  if (showingOutfits) renderOutfits();
  if (showingFragrances) renderFragrances();
}
let items = loadItems();
function migrateLookbookIntoOutfits() {
  const knownIds = new Set(outfits.map(entry => String(entry.id)));
  const imported = legacyWornLooks.filter(look => !knownIds.has(String(look.id))).map(look => ({
    id: look.id, photo: look.photo, name: look.name, date: look.date || "",
    occasion: look.occasion || "", notes: look.notes || "", itemIds: look.itemIds || []
  }));
  if (imported.length) {
    outfits = [...imported, ...outfits];
    saveOutfits();
  }
}
migrateLookbookIntoOutfits();
let activeCategory = "All";
let searchTerm = "";

function loadItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateStorageIndicator();
    queueCloudSync("closet_items");
    return true;
  } catch (error) {
    alert("Your browser storage is full. Try using a smaller image.");
    return false;
  }
}
function updateStorageIndicator() {
  const usageLabel = document.getElementById("storageUsage");
  const detailLabel = document.getElementById("storageDetail");
  const bar = document.getElementById("storageBar");
  if (!usageLabel || !detailLabel || !bar) return;

  const approximateLimit = 5 * 1024 * 1024;
  let used = 0;
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key && key.startsWith("halimas-closet-")) {
        used += new Blob([key, localStorage.getItem(key) || ""]).size;
      }
    }
  } catch {
    usageLabel.textContent = "Unavailable";
    detailLabel.textContent = "Could not read your saved closet data.";
    bar.style.width = "0%";
    return;
  }

  const formatMB = bytes => (bytes / (1024 * 1024)).toFixed(2) + " MB";
  const percent = Math.min(100, used / approximateLimit * 100);
  usageLabel.textContent = formatMB(used) + " used";
  detailLabel.textContent = "Approx. " + formatMB(approximateLimit - Math.min(used, approximateLimit)) + " remaining of a typical 5 MB browser storage limit. Photos count too.";
  bar.style.width = percent.toFixed(1) + "%";
  const meter = document.getElementById("storageMeter");
  meter.classList.toggle("storage-warning", percent >= 80);
  meter.classList.toggle("storage-critical", percent >= 95);
}


function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
function render() {
  const filtered = items.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const haystack = [item.name,item.brand,item.category,item.color,item.notes].join(" ").toLowerCase();
    return matchesCategory && haystack.includes(searchTerm);
  });
  document.getElementById("itemCount").textContent = items.length;
  grid.innerHTML = filtered.map(item => `
    <article class="item-card">
      <div class="item-photo">
        ${item.photo ? `<img src="${item.photo}" alt="${escapeHTML(item.name)}">` : `<div class="item-photo-placeholder" aria-label="Photo not added yet">♡<span>ADD PHOTO LATER</span></div>`}
        <button type="button" class="delete-button" data-delete="${escapeHTML(item.id)}" aria-label="Delete ${escapeHTML(item.name)}">×</button>
      </div>
      <div class="item-meta">
        <p class="item-brand">${escapeHTML(item.brand || item.category)}</p>
        <h3 class="item-name">${escapeHTML(item.name)}</h3>
        <p class="item-detail">${[item.color,item.size].filter(Boolean).map(escapeHTML).join(" · ")}</p>
        <button type="button" class="edit-button" data-edit="${escapeHTML(item.id)}">Edit piece ✎</button>
      </div>
    </article>`).join("");
  emptyState.style.display = items.length === 0 ? "block" : "none";
  if (items.length > 0 && filtered.length === 0) {
    grid.innerHTML = '<p class="no-results">No pieces match your search.</p>';
  }
}
function resetItemForm() {
  editingItemId = null;
  editingPhoto = "";
  editingOriginalPhoto = "";
  photoProcessingPromise = Promise.resolve();
  form.reset();
  document.getElementById("photoAutoRemove").checked = true;
  document.getElementById("photoProcessingStatus").hidden = true;
  document.getElementById("photoProcessingStatus").textContent = "";
  photoPreview.hidden = true;
  photoPreview.removeAttribute("src");
  photoLabel.textContent = "Add a photograph";
  document.querySelector(".upload-icon").hidden = false;
  document.querySelector(".photo-drop small").hidden = false;
  document.querySelector("#itemForm .dialog-heading h2").textContent = "Add a piece";
  document.querySelector("#itemForm .save-button").textContent = "Save to my closet";
}
function openDialog() {
  resetItemForm();
  dialog.showModal();
}
function openEditDialog(item) {
  editingItemId = item.id;
  editingPhoto = item.photo;
  editingOriginalPhoto = item.originalPhoto || item.photo || "";
  document.getElementById("photoAutoRemove").checked = item.photoIsCutout === true;
  document.getElementById("photoProcessingStatus").hidden = true;
  document.getElementById("photoProcessingStatus").textContent = "";
  document.getElementById("nameInput").value = item.name || "";
  document.getElementById("brandInput").value = item.brand || "";
  document.getElementById("categoryInput").value = item.category || "";
  document.getElementById("colorInput").value = item.color || "";
  document.getElementById("sizeInput").value = item.size || "";
  document.getElementById("notesInput").value = item.notes || "";
  photoInput.value = "";
  photoPreview.src = item.photo || "";
  photoPreview.hidden = !item.photo;
  photoLabel.textContent = item.photo ? "Current photo (choose to replace)" : "Add a photograph";
  document.querySelector(".upload-icon").hidden = !!item.photo;
  document.querySelector(".photo-drop small").hidden = !!item.photo;
  document.querySelector("#itemForm .dialog-heading h2").textContent = "Edit a piece";
  document.querySelector("#itemForm .save-button").textContent = "Save changes";
  dialog.showModal();
}
function resetWishPhoto() {
  wishPhoto = "";
  wishPhotoProcessingPromise = Promise.resolve();
  const input = document.getElementById("wishPhotoInput");
  const preview = document.getElementById("wishPhotoPreview");
  input.value = "";
  preview.hidden = true;
  preview.removeAttribute("src");
  document.getElementById("wishPhotoLabel").textContent = "Add a photo of your wish";
  document.getElementById("wishUploadIcon").hidden = false;
  document.querySelector(".wish-photo-drop small").hidden = false;
  const status = document.getElementById("wishPhotoStatus");
  status.hidden = true;
  status.textContent = "";
}
function openWishDialog() {
  resetWishPhoto();
  wishDialog.showModal();
}
async function processWishPhoto(file) {
  const optimized = await optimizeClosetImage(file, 1000, "image/jpeg", 0.72);
  wishPhoto = await readBlobAsDataURL(optimized);
  const preview = document.getElementById("wishPhotoPreview");
  preview.src = wishPhoto;
  preview.hidden = false;
  document.getElementById("wishPhotoStatus").hidden = true;
}
document.getElementById("wishPhotoInput").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    resetWishPhoto();
    return;
  }
  document.getElementById("wishPhotoLabel").textContent = file.name;
  document.getElementById("wishUploadIcon").hidden = true;
  document.querySelector(".wish-photo-drop small").hidden = true;
  const status = document.getElementById("wishPhotoStatus");
  status.textContent = "Optimizing your photo…";
  status.hidden = false;
  wishPhotoProcessingPromise = processWishPhoto(file).catch(error => {
    console.error("Could not prepare wishlist photo:", error);
    status.textContent = "Could not prepare this photo. Please try another image.";
    status.hidden = false;
    wishPhoto = "";
  });
});

function loadOutfits() {
  try { return JSON.parse(localStorage.getItem(OUTFITS_STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveOutfits() {
  try {
    localStorage.setItem(OUTFITS_STORAGE_KEY, JSON.stringify(outfits));
    updateStorageIndicator();
    queueCloudSync("outfits");
    return true;
  } catch {
    alert("Your browser storage is full. Try removing an outfit or using smaller item photos.");
    return false;
  }
}
function renderOutfits() {
  outfitsGrid.innerHTML = outfits.map(outfit => {
    const pieces = (outfit.itemIds || []).map(id => items.find(item => String(item.id) === String(id))).filter(Boolean);
    return `
      <article class="outfit-card">
        ${outfit.photo ? `<img class="outfit-main-photo" src="${outfit.photo}" alt="${escapeHTML(outfit.name)}">` : ""}
        <div class="outfit-card-body">
          <div class="outfit-card-top"><span>♡ OUTFIT DIARY</span><span>${escapeHTML(outfit.date || outfit.occasion || "A look to remember")}</span></div>
          <h3>${escapeHTML(outfit.name)}</h3>
          ${outfit.occasion ? `<p class="outfit-occasion">${escapeHTML(outfit.occasion)}</p>` : ""}
          ${pieces.length ? `<p class="outfit-wearing-tags">Wearing: ${pieces.map(piece => escapeHTML(piece.name)).join(" · ")}</p>` : ""}
          ${pieces.length ? `<div class="outfit-piece-strip">${pieces.map(piece => `<div class="outfit-piece"><img src="${piece.photo}" alt="${escapeHTML(piece.name)}"><span>${escapeHTML(piece.name)}</span></div>`).join("")}</div>` : ""}
          ${outfit.notes ? `<p class="outfit-notes">${escapeHTML(outfit.notes)}</p>` : ""}
          <div class="outfit-actions">
            <button type="button" data-outfit-edit="${escapeHTML(outfit.id)}">Edit outfit ✎</button>
            <button type="button" data-outfit-delete="${escapeHTML(outfit.id)}">Delete</button>
          </div>
        </div>
      </article>`;
  }).join("");
  outfitsEmpty.hidden = outfits.length > 0;
}
function renderOutfitChoices(selectedIds = []) {
  const selected = selectedIds.map(String);
  const choices = document.getElementById("outfitItemChoices");
  if (!items.length) {
    choices.innerHTML = '<p class="outfit-no-items">Your closet is empty for now. Add a few pieces to My Closet first, then come back to style an outfit.</p>';
    document.getElementById("outfitSelectedCount").textContent = "0 selected";
    return;
  }
  choices.innerHTML = items.map(item => `
    <label class="outfit-choice">
      <input type="checkbox" name="outfitItems" value="${escapeHTML(item.id)}" ${selected.includes(String(item.id)) ? "checked" : ""}>
      ${item.photo ? `<img src="${item.photo}" alt="">` : `<span class="outfit-choice-placeholder">♡</span>`}
      <span><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.brand || item.category || "")}</small></span>
    </label>`).join("");
  updateOutfitSelectedCount();
}
function filterOutfitChoices(query) {
  const term = query.trim().toLowerCase();
  let visibleCount = 0;
  document.querySelectorAll("#outfitItemChoices .outfit-choice").forEach(choice => {
    const matches = choice.textContent.toLowerCase().includes(term);
    choice.hidden = !matches;
    if (matches) visibleCount++;
  });
  const noResults = document.getElementById("outfitSearchNoResults");
  noResults.hidden = !term || visibleCount > 0 || !items.length;
}
function updateOutfitSelectedCount() {
  const count = document.querySelectorAll('input[name="outfitItems"]:checked').length;
  document.getElementById("outfitSelectedCount").textContent = count + (count === 1 ? " selected" : " selected");
}
function openOutfitDialog(outfit = null) {
  editingOutfitId = outfit ? outfit.id : null;
  editingOutfitPhoto = outfit?.photo || "";
  outfitForm.reset();
  outfitPhotoInput.required = false;
  outfitPhotoPreview.hidden = !outfit?.photo;
  if (outfit?.photo) outfitPhotoPreview.src = outfit.photo;
  else outfitPhotoPreview.removeAttribute("src");
  document.getElementById("outfitPhotoLabel").textContent = outfit?.photo ? "Current photo (choose to replace)" : "Add a photo of you wearing this look";
  document.getElementById("outfitUploadIcon").hidden = !!outfit?.photo;
  document.querySelector(".outfit-photo-drop small").hidden = !!outfit?.photo;
  document.getElementById("outfitName").value = outfit?.name || "";
  document.getElementById("outfitOccasion").value = outfit?.occasion || "";
  document.getElementById("outfitDate").value = outfit?.date || "";
  document.getElementById("outfitNotes").value = outfit?.notes || "";
  document.getElementById("outfitDialogTitle").textContent = outfit ? "Edit an outfit" : "Create an outfit";
  outfitForm.querySelector(".save-button").textContent = outfit ? "Save outfit changes ♡" : "Save this outfit ♡";
  renderOutfitChoices(outfit?.itemIds || []);
  document.getElementById("outfitPieceSearch").value = "";
  filterOutfitChoices("");
  outfitDialog.showModal();
}


function loadMeasurements() {
  try { return JSON.parse(localStorage.getItem(MEASUREMENTS_STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function loadFragrances() {
  try { return JSON.parse(localStorage.getItem(FRAGRANCES_STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveFragrances() {
  try {
    localStorage.setItem(FRAGRANCES_STORAGE_KEY, JSON.stringify(fragrances));
    updateStorageIndicator();
    const profile = loadMeasurements();
    profile.fragranceLibrary = fragrances;
    localStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(profile));
    if (signedInUser && cloudReady) Promise.all([syncMeasurements(profile), syncPublicFragrances()]).then(() => setCloudStatus("Your fragrance library is saved and public ♡")).catch(error => setCloudStatus("Saved on this device, but cloud sync needs attention: " + error.message));
    return true;
  } catch (error) {
    alert("Your browser storage is full. Try removing a few fragrance entries.");
    return false;
  }
}
function renderFragrances() {
  const term = (document.getElementById("fragranceSearch")?.value || "").trim().toLowerCase();
  const filter = document.getElementById("fragranceFilter")?.value || "All";
  const filtered = fragrances.filter(item => (filter === "All" || item.status === filter) && [item.name,item.brand,item.family,item.occasion,item.notes].join(" ").toLowerCase().includes(term));
  fragranceGrid.innerHTML = filtered.map(item => `
    <article class="fragrance-card">
      <div class="fragrance-card-top"><span>✧ SCENT FILE</span><span class="fragrance-status">${escapeHTML(item.status === "Wishlist" ? "WISH LIST" : "IN MY COLLECTION")}</span></div>
      <div class="fragrance-bottle" aria-hidden="true">✧</div>
      <p class="item-brand">${escapeHTML(item.brand || "FRAGRANCE")}</p>
      <h3>${escapeHTML(item.name)}</h3>
      <p class="fragrance-family">${escapeHTML(item.family || "Scent family not set")}</p>
      ${item.occasion ? `<p class="item-detail">Best for: ${escapeHTML(item.occasion)}</p>` : ""}
      ${item.notes ? `<p class="fragrance-notes">${escapeHTML(item.notes)}</p>` : ""}
      <div class="fragrance-actions"><button type="button" data-fragrance-edit="${escapeHTML(item.id)}">Edit ✎</button><button type="button" data-fragrance-delete="${escapeHTML(item.id)}">Delete ×</button></div>
    </article>`).join("");
  fragranceEmpty.hidden = fragrances.length > 0;
  fragranceEmpty.querySelector("h2").textContent = term || filter !== "All" ? "No scents found." : "Your scent story starts here.";
  fragranceEmpty.querySelector("p").textContent = term || filter !== "All" ? "Try another search or filter." : "Add the fragrances you wear, love, or have been wanting to try.";
  document.getElementById("openFragranceEmpty").hidden = fragrances.length > 0 || !!term || filter !== "All";
}
function openFragranceDialog(item = null) {
  editingFragranceId = item?.id || null;
  fragranceForm.reset();
  document.getElementById("fragranceDialogTitle").textContent = item ? "Edit a fragrance" : "Add a fragrance";
  document.getElementById("fragranceName").value = item?.name || "";
  document.getElementById("fragranceBrand").value = item?.brand || "";
  document.getElementById("fragranceStatus").value = item?.status || "Owned";
  document.getElementById("fragranceFamily").value = item?.family || "";
  document.getElementById("fragranceOccasion").value = item?.occasion || "";
  document.getElementById("fragranceNotes").value = item?.notes || "";
  document.getElementById("saveFragranceButton").textContent = item ? "Save changes ✧" : "Save fragrance ✧";
  fragranceDialog.showModal();
}
function populateMeasurements() {
  const saved = loadMeasurements();
  measurementFields.forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = saved[id] || "";
  });
}
measurementsForm.addEventListener("submit", event => {
  event.preventDefault();
  const profile = loadMeasurements();
  measurementFields.forEach(id => { profile[id] = document.getElementById(id).value.trim(); });
  profile.fragranceLibrary = fragrances;
  try {
    localStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(profile));
    const status = document.getElementById("measurementsSaved");
    status.textContent = "Your sizing profile is saved on this device ♡";
    if (signedInUser && cloudReady) {
      syncMeasurements(profile).then(() => { status.textContent = "Your private sizing profile is saved and synced ♡"; })
        .catch(error => { status.textContent = "Saved on this device, but cloud sync needs attention: " + error.message; });
    }
  } catch {
    alert("Your browser storage is full. Please try again.");
  }
});
populateMeasurements();


document.getElementById("openFragranceAdd").addEventListener("click", () => openFragranceDialog());
document.getElementById("openFragranceEmpty").addEventListener("click", () => openFragranceDialog());
document.getElementById("closeFragranceDialog").addEventListener("click", () => fragranceDialog.close());
document.getElementById("fragranceSearch").addEventListener("input", renderFragrances);
document.getElementById("fragranceFilter").addEventListener("change", renderFragrances);
fragranceForm.addEventListener("submit", event => {
  event.preventDefault();
  const item = { id: editingFragranceId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), name: document.getElementById("fragranceName").value.trim(), brand: document.getElementById("fragranceBrand").value.trim(), status: document.getElementById("fragranceStatus").value, family: document.getElementById("fragranceFamily").value, occasion: document.getElementById("fragranceOccasion").value, notes: document.getElementById("fragranceNotes").value.trim() };
  const previous = [...fragrances];
  if (editingFragranceId) fragrances = fragrances.map(entry => entry.id === editingFragranceId ? item : entry);
  else fragrances.unshift(item);
  if (saveFragrances()) { fragranceDialog.close(); setView("fragrances"); } else fragrances = previous;
});
fragranceGrid.addEventListener("click", event => {
  const edit = event.target.closest("[data-fragrance-edit]");
  const remove = event.target.closest("[data-fragrance-delete]");
  if (edit) { const item = fragrances.find(entry => entry.id === edit.dataset.fragranceEdit); if (item) openFragranceDialog(item); return; }
  if (remove) { const item = fragrances.find(entry => entry.id === remove.dataset.fragranceDelete); if (!item) return; if (!confirm("Delete " + item.name + " from your fragrance library?")) return; const previous = [...fragrances]; fragrances = fragrances.filter(entry => entry.id !== item.id); if (!saveFragrances()) fragrances = previous; renderFragrances(); }
});


document.getElementById("openOutfitTop").addEventListener("click", () => openOutfitDialog());
document.getElementById("openOutfitEmpty").addEventListener("click", () => openOutfitDialog());
document.getElementById("closeOutfitDialog").addEventListener("click", () => outfitDialog.close());
document.getElementById("outfitItemChoices").addEventListener("change", updateOutfitSelectedCount);
outfitPhotoInput.addEventListener("change", () => {
  const file = outfitPhotoInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { alert("Please choose an image file."); outfitPhotoInput.value = ""; return; }
  const reader = new FileReader();
  reader.onload = () => {
    outfitPhotoPreview.src = reader.result;
    outfitPhotoPreview.hidden = false;
    document.getElementById("outfitPhotoLabel").textContent = file.name;
    document.getElementById("outfitUploadIcon").hidden = true;
    document.querySelector(".outfit-photo-drop small").hidden = true;
  };
  reader.readAsDataURL(file);
});
document.getElementById("outfitPieceSearch").addEventListener("input", event => filterOutfitChoices(event.target.value));
outfitForm.addEventListener("submit", event => {
  event.preventDefault();
  const photo = outfitPhotoInput.files[0] ? outfitPhotoPreview.src : editingOutfitPhoto;
  const itemIds = Array.from(document.querySelectorAll('input[name="outfitItems"]:checked')).map(input => input.value);
  const outfit = {
    id: editingOutfitId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    photo,
    name: document.getElementById("outfitName").value.trim(),
    occasion: document.getElementById("outfitOccasion").value,
    date: document.getElementById("outfitDate").value,
    notes: document.getElementById("outfitNotes").value.trim(),
    itemIds
  };
  const previous = [...outfits];
  if (editingOutfitId) outfits = outfits.map(entry => String(entry.id) === String(editingOutfitId) ? outfit : entry);
  else outfits.unshift(outfit);
  if (saveOutfits()) {
    outfitDialog.close();
    setView("outfits");
  } else outfits = previous;
});
outfitsGrid.addEventListener("click", event => {
  const target = event.target instanceof Element ? event.target : event.target.parentElement;
  const edit = target && target.closest("[data-outfit-edit]");
  const remove = target && target.closest("[data-outfit-delete]");
  if (edit) {
    const outfit = outfits.find(entry => String(entry.id) === String(edit.dataset.outfitEdit));
    if (outfit) openOutfitDialog(outfit);
    return;
  }
  if (remove) {
    const outfit = outfits.find(entry => String(entry.id) === String(remove.dataset.outfitDelete));
    if (!outfit) return;

    // Use an in-button, two-tap confirmation instead of the browser confirm()
    // dialog, which can be unreliable on some mobile browsers.
    if (remove.dataset.confirmDelete !== "true") {
      remove.dataset.confirmDelete = "true";
      remove.textContent = "Tap again to delete";
      remove.setAttribute("aria-label", "Tap again to confirm deleting " + outfit.name);
      remove.classList.add("delete-confirming");
      return;
    }

    const previousOutfits = [...outfits];
    outfits = outfits.filter(entry => String(entry.id) !== String(outfit.id));
    if (saveOutfits()) {
      renderOutfits();
    } else {
      outfits = previousOutfits;
      renderOutfits();
    }
  }
});

document.querySelectorAll(".archive-tab").forEach(tab => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});
document.getElementById("openWishTop").addEventListener("click", openWishDialog);
document.getElementById("openWishEmpty").addEventListener("click", openWishDialog);
document.getElementById("closeWishDialog").addEventListener("click", () => wishDialog.close());
wishForm.addEventListener("submit", async event => {
  event.preventDefault();
  const saveButton = wishForm.querySelector(".save-button");
  const originalButtonText = saveButton.textContent;
  saveButton.disabled = true;
  saveButton.textContent = "Preparing your wish…";
  await wishPhotoProcessingPromise;
  const link = document.getElementById("wishLink").value.trim();
  if (link) {
    try {
      const parsed = new URL(link);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid URL");
    } catch {
      alert("Please enter a valid web link, beginning with https://");
      saveButton.disabled = false;
      saveButton.textContent = originalButtonText;
      return;
    }
  }
  const wish = {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    name: document.getElementById("wishName").value.trim(),
    brand: document.getElementById("wishBrand").value.trim(),
    category: document.getElementById("wishCategory").value,
    price: document.getElementById("wishPrice").value.trim(),
    link,
    notes: document.getElementById("wishNotes").value.trim(),
    photo: wishPhoto
  };
  wishes.unshift(wish);
  if (saveWishes()) {
    wishForm.reset();
    resetWishPhoto();
    wishDialog.close();
    setView("wishlist");
  } else { wishes.shift(); }
  saveButton.disabled = false;
  saveButton.textContent = originalButtonText;
});
wishlistGrid.addEventListener("click", event => {
  const removeButton = event.target.closest("[data-wish-delete]");
  const gotButton = event.target.closest("[data-wish-got]");
  const id = removeButton?.dataset.wishDelete || gotButton?.dataset.wishGot;
  if (!id) return;
  const wish = wishes.find(entry => entry.id === id);
  if (!wish) return;
  if (gotButton) {
    const newItem = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
      photo: wish.photo || "",
      name: wish.name,
      brand: wish.brand || "",
      category: wish.category || "Other",
      color: "",
      size: "",
      notes: [wish.notes, wish.price ? `Wishlist price: ${wish.price}` : "", wish.link ? `Product link: ${wish.link}` : ""].filter(Boolean).join("\n")
    };
    const previousItems = [...items];
    const previousWishes = [...wishes];
    items.unshift(newItem);
    if (!saveItems()) {
      items = previousItems;
      return;
    }
    wishes = wishes.filter(entry => entry.id !== id);
    if (!saveWishes()) {
      items = previousItems;
      wishes = previousWishes;
      saveItems();
      return;
    }
    render();
updateStorageIndicator();
    renderWishes();
    setView("closet");
    return;
  }
  if (!confirm(`Remove "${wish.name}" from your wish list?`)) return;
  wishes = wishes.filter(entry => entry.id !== id);
  if (!saveWishes()) wishes.push(wish);
  renderWishes();
});
wishlistGrid.addEventListener("click", event => {
  const card = event.target.closest(".wish-card[data-wish-url]");
  if (!card || event.target.closest("button, a, input, select, textarea, label")) return;
  window.open(card.dataset.wishUrl, "_blank", "noopener,noreferrer");
});
wishlistGrid.addEventListener("keydown", event => {
  const card = event.target.closest(".wish-card[data-wish-url]");
  if (!card || (event.key !== "Enter" && event.key !== " ")) return;
  if (event.target !== card) return;
  event.preventDefault();
  window.open(card.dataset.wishUrl, "_blank", "noopener,noreferrer");
});
document.getElementById("openAddTop").addEventListener("click", openDialog);
document.getElementById("openAddEmpty").addEventListener("click", openDialog);
document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
document.getElementById("categoryNav").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  document.querySelectorAll(".category-chip").forEach(chip => chip.classList.toggle("active", chip === button));
  render();
});
document.getElementById("searchInput").addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  render();
});
function readBlobAsDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read this photo."));
    reader.readAsDataURL(blob);
  });
}

async function optimizeClosetImage(blob, maxSide, type, quality) {
  if (typeof createImageBitmap !== "function") return blob;
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise(resolve => canvas.toBlob(result => resolve(result || blob), type, quality));
  } catch (error) {
    console.warn("Using the original image size:", error);
    return blob;
  }
}

async function processClosetPhoto(file) {
  const status = document.getElementById("photoProcessingStatus");
  const optimizedOriginal = await optimizeClosetImage(file, 1400, "image/jpeg", 0.82);
  editingOriginalPhoto = await readBlobAsDataURL(optimizedOriginal);
  photoPreview.src = editingOriginalPhoto;
  photoPreview.hidden = false;
  if (status) status.hidden = true;
}

function queueSelectedPhotoProcessing() {
  const file = photoInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    photoInput.value = "";
    return;
  }
  photoLabel.textContent = file.name;
  document.querySelector(".upload-icon").hidden = true;
  document.querySelector(".photo-drop small").hidden = true;
  photoProcessingPromise = processClosetPhoto(file);
}

photoInput.addEventListener("change", queueSelectedPhotoProcessing);
document.getElementById("photoAutoRemove").addEventListener("change", () => {
  if (photoInput.files[0]) queueSelectedPhotoProcessing();
});
form.addEventListener("submit", async event => {
  event.preventDefault();
  const saveButton = form.querySelector(".save-button");
  saveButton.disabled = true;
  const originalButtonText = saveButton.textContent;
  saveButton.textContent = "Preparing photo…";
  try {
    await photoProcessingPromise;
  } catch (error) {
    console.error(error);
  }
  const photo = photoInput.files[0] ? photoPreview.src : (editingItemId ? editingPhoto : "");
  const existingItem = editingItemId ? items.find(existing => String(existing.id) === String(editingItemId)) : null;
  const originalPhoto = photoInput.files[0] ? editingOriginalPhoto : (existingItem?.originalPhoto || "");
  const photoIsCutout = photoInput.files[0] ? document.getElementById("photoAutoRemove").checked : (existingItem?.photoIsCutout === true);
  // Wishlist transfers may be saved without a photo; one can be added later.
  const item = {
    id: editingItemId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    photo,
    originalPhoto,
    photoIsCutout,
    name: document.getElementById("nameInput").value.trim(),
    brand: document.getElementById("brandInput").value.trim(),
    category: document.getElementById("categoryInput").value,
    color: document.getElementById("colorInput").value.trim(),
    size: document.getElementById("sizeInput").value.trim(),
    notes: document.getElementById("notesInput").value.trim()
  };
  const previousItems = [...items];
  if (editingItemId) { items = items.map(existing => existing.id === editingItemId ? item : existing); }
  else { items.unshift(item); }
  if (saveItems()) {
    resetItemForm();
    dialog.close();
    activeCategory = "All";
    document.querySelectorAll(".category-chip").forEach(chip => chip.classList.toggle("active", chip.dataset.category === "All"));
    render();
  } else { items = previousItems; }
  saveButton.disabled = false;
  saveButton.textContent = originalButtonText;
});
grid.addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    const itemToEdit = items.find(entry => String(entry.id) === String(editButton.dataset.edit));
    if (itemToEdit) openEditDialog(itemToEdit);
    return;
  }
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  const item = items.find(entry => String(entry.id) === String(button.dataset.delete));
  if (!item || !confirm("Remove \"" + item.name + "\" from your closet?")) return;
  items = items.filter(entry => entry.id !== item.id);
  saveItems();
  render();
});
render();
updateStorageIndicator();

renderWishes();


// Full local backup: includes closet photos and every current section's saved data.
const BACKUP_KEYS = [
  STORAGE_KEY,
  WISH_STORAGE_KEY,
  MEASUREMENTS_STORAGE_KEY,
  FRAGRANCES_STORAGE_KEY,
  OUTFITS_STORAGE_KEY,
  WORN_KEY
];
const backupStatus = document.getElementById("backupStatus");
document.getElementById("exportBackup").addEventListener("click", () => {
  try {
    const savedData = {};
    BACKUP_KEYS.forEach(key => {
      savedData[key] = localStorage.getItem(key);
    });
    const backup = {
      app: "Halima's Closet",
      formatVersion: 1,
      createdAt: new Date().toISOString(),
      storage: savedData
    };
    const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "halimas-closet-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    backupStatus.textContent = "Your backup download has started. Keep that file somewhere safe ♡";
  } catch (error) {
    backupStatus.textContent = "I couldn't create the backup. Please try again.";
    console.error(error);
  }
});
document.getElementById("importBackupButton").addEventListener("click", () => {
  document.getElementById("importBackupFile").click();
});
document.getElementById("importBackupFile").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    if (backup.app !== "Halima's Closet" || backup.formatVersion !== 1 || !backup.storage || typeof backup.storage !== "object") {
      throw new Error("This doesn't look like a Halima's Closet backup.");
    }
    const allowed = BACKUP_KEYS.filter(key => Object.prototype.hasOwnProperty.call(backup.storage, key));
    if (!allowed.length) throw new Error("No closet data was found in this backup.");
    allowed.forEach(key => {
      const value = backup.storage[key];
      if (value !== null) JSON.parse(value);
    });
    if (!confirm("Restoring this backup will replace the saved closet data in this browser. Download a fresh backup first if you want to keep the current version. Continue?")) return;
    allowed.forEach(key => {
      const value = backup.storage[key];
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    });
    backupStatus.textContent = "Backup restored. Refreshing your closet…";
    setTimeout(() => window.location.reload(), 500);
  } catch (error) {
    alert(error.message || "I couldn't read that backup file.");
    backupStatus.textContent = "The backup wasn't restored. Your existing data is unchanged.";
  } finally {
    event.target.value = "";
  }
});


// HALIMAS SUPABASE AUTH + CLOUD SYNC
// The publishable key is intended for browser use. Database RLS policies enforce access.
const HALIMA_SUPABASE_URL = "https://naatoomldeagsjzpzbmu.supabase.co";
const HALIMA_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tTdgopDPFvrEv8E_qdt_2Q_NKu93Dqi";
const authClient = window.supabase.createClient(HALIMA_SUPABASE_URL, HALIMA_SUPABASE_PUBLISHABLE_KEY);
const authPanel = document.getElementById("authPanel");
const openAuthDialogButton = document.getElementById("openAuthDialog");
const closeAuthDialogButton = document.getElementById("closeAuthDialog");
openAuthDialogButton.addEventListener("click", () => { if (!authPanel.open) authPanel.showModal(); });
closeAuthDialogButton.addEventListener("click", () => authPanel.close());
const authForm = document.getElementById("authForm");
const authStatus = document.getElementById("authStatus");
const authSubmit = document.getElementById("authSubmit");
const authSignUp = document.getElementById("authSignUp");
const authSignOut = document.getElementById("authSignOut");
const authForgotPassword = document.getElementById("authForgotPassword");
const resetPasswordForm = document.getElementById("resetPasswordForm");
let signedInUser = null;
let cloudReady = false;
let cloudInitPromise = null;
let cloudSyncQueue = Promise.resolve();
let cloudInitializing = false;

function applyOwnerView(user) {
  signedInUser = user || null;
  document.body.classList.toggle("is-owner", !!signedInUser);
  authSubmit.hidden = !!signedInUser;
  authSignUp.hidden = !!signedInUser;
  authSignOut.hidden = !signedInUser;
  authForgotPassword.hidden = !!signedInUser;
  document.getElementById("authHeading").textContent = signedInUser ? "Your closet is unlocked ♡" : "Sign in to manage your closet";
  document.getElementById("authMessage").textContent = signedInUser
    ? "Signed in as " + signedInUser.email + ". Your wardrobe will sync across devices."
    : "You can browse the shared archive. Sign in with your email to manage your pieces and outfits.";
  document.querySelector('[data-view="measurements"]').hidden = !signedInUser;
  document.querySelector('[data-view="fragrances"]').hidden = false;
  if (!signedInUser && activeView === "measurements") setView("closet");
}

function setCloudStatus(message) {
  if (authStatus) authStatus.textContent = message;
}

function saveLocalCollection(key, records) {
  try { localStorage.setItem(key, JSON.stringify(records)); } catch (error) {
    console.warn("Could not cache cloud data locally:", error);
  }
}

function mergeRecords(cloudRecords, localRecords) {
  const merged = new Map();
  (localRecords || []).forEach(record => merged.set(String(record.id), record));
  (cloudRecords || []).forEach(record => merged.set(String(record.id), record));
  return Array.from(merged.values());
}

async function uploadPhotoIfNeeded(photo, collection, recordId) {
  if (!photo || typeof photo !== "string" || !photo.startsWith("data:")) return photo || "";
  const response = await fetch(photo);
  const blob = await response.blob();
  const extension = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "");
  const safeId = String(recordId || crypto.randomUUID()).replace(/[^a-z0-9_-]/gi, "_");
  const path = signedInUser.id + "/" + collection + "/" + safeId + "." + (extension || "jpg");
  const { error } = await authClient.storage.from("wardrobe-photos").upload(path, blob, {
    upsert: true,
    contentType: blob.type || "image/jpeg"
  });
  if (error) throw error;
  const { data } = authClient.storage.from("wardrobe-photos").getPublicUrl(path);
  return data.publicUrl;
}

async function prepareCloudRecord(record, collection) {
  const copy = { ...record };
  if (copy.photo && String(copy.photo).startsWith("data:")) {
    copy.photo = await uploadPhotoIfNeeded(copy.photo, collection, copy.id);
  }
  if (copy.originalPhoto && String(copy.originalPhoto).startsWith("data:")) {
    copy.originalPhoto = await uploadPhotoIfNeeded(copy.originalPhoto, collection, String(copy.id) + "-original");
  }
  return copy;
}

async function syncCollection(table, records, collection) {
  if (!signedInUser) return;
  const userId = signedInUser.id;
  const prepared = [];
  for (const record of records) {
    prepared.push({
      user_id: userId,
      legacy_id: String(record.id),
      data: await prepareCloudRecord(record, collection),
      is_public: true
    });
  }
  if (prepared.length) {
    const { error } = await authClient.from(table).upsert(prepared, { onConflict: "user_id,legacy_id" });
    if (error) throw error;
  }
  const { data: existing, error: readError } = await authClient.from(table)
    .select("legacy_id").eq("user_id", userId);
  if (readError) throw readError;
  const keep = new Set(prepared.map(row => row.legacy_id));
  for (const row of (existing || [])) {
    if (!keep.has(String(row.legacy_id))) {
      const { error } = await authClient.from(table).delete()
        .eq("user_id", userId).eq("legacy_id", row.legacy_id);
      if (error) throw error;
    }
  }
}

async function syncPublicFragrances() {
  if (!signedInUser) return;
  const { error } = await authClient.from("measurements").upsert({
    user_id: signedInUser.id,
    legacy_id: "fragrance-library",
    data: { items: fragrances },
    is_public: true
  }, { onConflict: "user_id,legacy_id" });
  if (error) throw error;
}

async function syncMeasurements(profile) {
  if (!signedInUser) return;
  const { error } = await authClient.from("measurements").upsert({
    user_id: signedInUser.id,
    legacy_id: "profile",
    data: profile,
    is_public: false
  }, { onConflict: "user_id,legacy_id" });
  if (error) throw error;
}

function queueCloudSync(collection) {
  if (!signedInUser || !cloudReady || cloudInitializing) return;
  cloudSyncQueue = cloudSyncQueue.then(async () => {
    setCloudStatus("Saving your changes to your private cloud…");
    if (collection === "closet_items") await syncCollection("closet_items", items, "closet");
    if (collection === "wishlist_items") await syncCollection("wishlist_items", wishes, "wishlist");
    if (collection === "outfits") await syncCollection("outfits", outfits, "outfits");
    setCloudStatus("Your changes are saved and synced ♡");
  }).catch(error => {
    console.error("Halima's Closet cloud sync failed:", error);
    setCloudStatus("Your changes are saved on this device, but cloud sync needs attention: " + error.message);
  });
}

async function loadPublicArchive() {
  try {
    const [closetResult, wishResult, outfitResult, fragranceResult] = await Promise.all([
      authClient.from("closet_items").select("data").eq("is_public", true),
      authClient.from("wishlist_items").select("data").eq("is_public", true),
      authClient.from("outfits").select("data").eq("is_public", true),
      authClient.from("measurements").select("data").eq("legacy_id", "fragrance-library").eq("is_public", true)
    ]);
    for (const result of [closetResult, wishResult, outfitResult, fragranceResult]) {
      if (result.error) throw result.error;
    }
    items = (closetResult.data || []).map(row => row.data).filter(Boolean);
    wishes = (wishResult.data || []).map(row => row.data).filter(Boolean);
    outfits = (outfitResult.data || []).map(row => row.data).filter(Boolean);
    if (fragranceResult.data?.length) {
      fragrances = fragranceResult.data.flatMap(row => Array.isArray(row.data?.items) ? row.data.items : []);
      saveLocalCollection(FRAGRANCES_STORAGE_KEY, fragrances);
    }
    saveLocalCollection(STORAGE_KEY, items);
    saveLocalCollection(WISH_STORAGE_KEY, wishes);
    saveLocalCollection(OUTFITS_STORAGE_KEY, outfits);
    render();
    renderWishes();
    renderOutfits();
    renderFragrances();
    if (activeView === "outfits" || activeView === "fragrances") setView(activeView);
  } catch (error) {
    console.error("Could not load the public closet archive:", error);
  }
}

async function initializeCloudData(user) {
  if (!user) {
    cloudReady = false;
    await loadPublicArchive();
    return;
  }
  if (cloudInitPromise) return cloudInitPromise;
  cloudInitPromise = (async () => {
    cloudInitializing = true;
    cloudReady = false;
    setCloudStatus("Connecting your closet to the cloud…");
    try {
      const [closetResult, wishResult, outfitResult, measureResult, fragranceResult] = await Promise.all([
        authClient.from("closet_items").select("legacy_id,data").eq("user_id", user.id),
        authClient.from("wishlist_items").select("legacy_id,data").eq("user_id", user.id),
        authClient.from("outfits").select("legacy_id,data").eq("user_id", user.id),
        authClient.from("measurements").select("data").eq("user_id", user.id).eq("legacy_id", "profile").maybeSingle(),
        authClient.from("measurements").select("data").eq("legacy_id", "fragrance-library").eq("is_public", true)
      ]);
      for (const result of [closetResult, wishResult, outfitResult, measureResult, fragranceResult]) {
        if (result.error) throw result.error;
      }
      const cloudItems = (closetResult.data || []).map(row => row.data).filter(Boolean);
      const cloudWishes = (wishResult.data || []).map(row => row.data).filter(Boolean);
      const cloudOutfits = (outfitResult.data || []).map(row => row.data).filter(Boolean);
      const hasCloudArchive = cloudItems.length + cloudWishes.length + cloudOutfits.length > 0;
      if (hasCloudArchive) {
        items = mergeRecords(cloudItems, items);
        wishes = mergeRecords(cloudWishes, wishes);
        outfits = mergeRecords(cloudOutfits, outfits);
      }
      saveLocalCollection(STORAGE_KEY, items);
      saveLocalCollection(WISH_STORAGE_KEY, wishes);
      saveLocalCollection(OUTFITS_STORAGE_KEY, outfits);
      if (measureResult.data?.data) {
        localStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(measureResult.data.data));
        fragrances = Array.isArray(measureResult.data.data.fragranceLibrary) ? measureResult.data.data.fragranceLibrary : fragrances;
        populateMeasurements();
      }
      if (fragranceResult.data?.length) {
        fragrances = fragranceResult.data.flatMap(row => Array.isArray(row.data?.items) ? row.data.items : []);
      }
      saveLocalCollection(FRAGRANCES_STORAGE_KEY, fragrances);
      // First login migrates the existing browser data. Later logins merge local and cloud records.
      await syncCollection("closet_items", items, "closet");
      await syncCollection("wishlist_items", wishes, "wishlist");
      await syncCollection("outfits", outfits, "outfits");
      await syncPublicFragrances();
      const profile = loadMeasurements();
      profile.fragranceLibrary = fragrances;
      if (Object.values(profile).some(value => Array.isArray(value) ? value.length > 0 : String(value || "").trim())) {
        await syncMeasurements(profile);
      }
      cloudReady = true;
      setCloudStatus("Your closet is backed up and synced ♡");
      render();
      renderWishes();
      renderOutfits();
      renderFragrances();
    } catch (error) {
      console.error("Halima's Closet cloud setup failed:", error);
      setCloudStatus("Cloud connection needs attention: " + error.message + ". Your original browser data is still saved.");
    } finally {
      cloudInitializing = false;
      cloudInitPromise = null;
    }
  })();
  return cloudInitPromise;
}

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  setCloudStatus("Signing in…");
  const { data, error } = await authClient.auth.signInWithPassword({
    email: document.getElementById("authEmail").value.trim(),
    password: document.getElementById("authPassword").value
  });
  if (error) { setCloudStatus(error.message); return; }
  applyOwnerView(data.user);
  await initializeCloudData(data.user);
});
authSignUp.addEventListener("click", async () => {
  setCloudStatus("Creating your account…");
  const { data, error } = await authClient.auth.signUp({
    email: document.getElementById("authEmail").value.trim(),
    password: document.getElementById("authPassword").value,
    options: { emailRedirectTo: "https://silverstormz.github.io/Halimas-closet/" }
  });
  if (error) { setCloudStatus(error.message); return; }
  setCloudStatus(data.session
    ? "Your account is ready. Connecting your closet…"
    : "Check your inbox for the confirmation email, then return here to sign in.");
  if (data.user && data.session) {
    applyOwnerView(data.user);
    await initializeCloudData(data.user);
  }
});
authForgotPassword.addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  if (!email) {
    setCloudStatus("Enter your account email address first, then click Forgot password? again.");
    document.getElementById("authEmail").focus();
    return;
  }
  setCloudStatus("Sending a password reset link…");
  const { error } = await authClient.auth.resetPasswordForEmail(email, {
    redirectTo: "https://silverstormz.github.io/Halimas-closet/"
  });
  if (error) {
    setCloudStatus("I couldn't send the reset email: " + error.message);
    return;
  }
  setCloudStatus("Password reset email sent. Open the link in your inbox on this device, then choose a new password here.");
});
resetPasswordForm.addEventListener("submit", async event => {
  event.preventDefault();
  const password = document.getElementById("newPassword").value;
  if (password.length < 8) {
    setCloudStatus("Please use at least 8 characters for your new password.");
    return;
  }
  setCloudStatus("Updating your password…");
  const { error } = await authClient.auth.updateUser({ password });
  if (error) {
    setCloudStatus("I couldn't update the password: " + error.message);
    return;
  }
  resetPasswordForm.hidden = true;
  authForm.hidden = false;
  document.getElementById("newPassword").value = "";
  setCloudStatus("Your password has been updated ♡ You can now sign in with it.");
});
authSignOut.addEventListener("click", async () => {
  setCloudStatus("Signing out…");
  const { error } = await authClient.auth.signOut();
  if (error) { setCloudStatus(error.message); return; }
  applyOwnerView(null);
  setCloudStatus("You've signed out. The public archive remains available.");
  await loadPublicArchive();
});
authClient.auth.getSession().then(async ({ data, error }) => {
  if (error) setCloudStatus(error.message);
  const user = data?.session?.user || null;
  applyOwnerView(user);
  await initializeCloudData(user);
});
authClient.auth.onAuthStateChange((_event, session) => {
  if (_event === "PASSWORD_RECOVERY") {
    resetPasswordForm.hidden = false;
    authForm.hidden = true;
    setCloudStatus("Choose a new password below to recover your account.");
    if (!authPanel.open) authPanel.showModal();
  }
  const user = session?.user || null;
  applyOwnerView(user);
  if (user && !cloudReady && !cloudInitPromise) initializeCloudData(user);
  if (!user) {
    cloudReady = false;
    loadPublicArchive();
  }
});
