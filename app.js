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
const measurementsForm = document.getElementById("measurementsForm");
const MEASUREMENTS_STORAGE_KEY = "halimas-closet-measurements-v1";
const measurementFields = ["measureHeight","measureWeight","measureBust","measureWaist","measureHips","measureInseam","sizeTops","sizeBottoms","sizeDresses","sizeOuterwear","sizeBra","sizeShoes","sizeRings","sizeBracelet","sizeNecklace","sizeBelt","sizeHat","measureNotes"];
const WISH_STORAGE_KEY = "halimas-closet-wishlist-v1";
let wishes = loadWishes();
let activeView = "closet";
let editingItemId = null;
let editingPhoto = "";

function loadWishes() {
  try { return JSON.parse(localStorage.getItem(WISH_STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveWishes() {
  try {
    localStorage.setItem(WISH_STORAGE_KEY, JSON.stringify(wishes));
    return true;
  } catch {
    alert("Your browser storage is full. Try removing a few saved wishes.");
    return false;
  }
}
function renderWishes() {
  wishlistGrid.innerHTML = wishes.map(wish => `
    <article class="wish-card">
      <div class="wish-card-top"><span>♡ A LITTLE WISH</span><button class="wish-delete" data-wish-delete="${wish.id}" aria-label="Remove ${escapeHTML(wish.name)}">×</button></div>
      <h3>${escapeHTML(wish.name)}</h3>
      <p class="wish-brand">${escapeHTML(wish.brand || wish.category || "On my radar")}</p>
      ${wish.price ? `<p class="wish-price">${escapeHTML(wish.price)}</p>` : ""}
      ${wish.notes ? `<p class="wish-notes">${escapeHTML(wish.notes)}</p>` : ""}
      <div class="wish-actions">
        ${wish.link ? `<a href="${escapeHTML(wish.link)}" target="_blank" rel="noopener noreferrer">View item ↗</a>` : "<span></span>"}
        <button type="button" data-wish-got="${wish.id}">I got it! ✧</button>
      </div>
    </article>`).join("");
  wishlistEmpty.hidden = wishes.length > 0;
}
function setView(view) {
  activeView = view;
  document.querySelectorAll(".archive-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === view));
  const showingCloset = view === "closet";
  const showingWishlist = view === "wishlist";
  closetToolbar.hidden = !showingCloset;
  categoryNav.hidden = !showingCloset;
  closetGrid.hidden = !showingCloset;
  closetEmpty.hidden = !showingCloset || items.length !== 0;
  wishlistSection.hidden = !showingWishlist;
  measurementsSection.hidden = view !== "measurements";
  if (showingWishlist) renderWishes();
}
let items = loadItems();
let activeCategory = "All";
let searchTerm = "";

function loadItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    alert("Your browser storage is full. Try using a smaller image.");
    return false;
  }
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
        <img src="${item.photo}" alt="${escapeHTML(item.name)}">
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
  form.reset();
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
  document.getElementById("nameInput").value = item.name || "";
  document.getElementById("brandInput").value = item.brand || "";
  document.getElementById("categoryInput").value = item.category || "";
  document.getElementById("colorInput").value = item.color || "";
  document.getElementById("sizeInput").value = item.size || "";
  document.getElementById("notesInput").value = item.notes || "";
  photoInput.value = "";
  photoPreview.src = item.photo;
  photoPreview.hidden = false;
  photoLabel.textContent = "Current photo (choose to replace)";
  document.querySelector(".upload-icon").hidden = true;
  document.querySelector(".photo-drop small").hidden = true;
  document.querySelector("#itemForm .dialog-heading h2").textContent = "Edit a piece";
  document.querySelector("#itemForm .save-button").textContent = "Save changes";
  dialog.showModal();
}
function openWishDialog() { wishDialog.showModal(); }

function loadMeasurements() {
  try { return JSON.parse(localStorage.getItem(MEASUREMENTS_STORAGE_KEY) || "{}"); }
  catch { return {}; }
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
  const profile = {};
  measurementFields.forEach(id => { profile[id] = document.getElementById(id).value.trim(); });
  try {
    localStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(profile));
    const status = document.getElementById("measurementsSaved");
    status.textContent = "Your sizing profile is saved ♡";
  } catch {
    alert("Your browser storage is full. Please try again.");
  }
});
populateMeasurements();

document.querySelectorAll(".archive-tab").forEach(tab => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});
document.getElementById("openWishTop").addEventListener("click", openWishDialog);
document.getElementById("openWishEmpty").addEventListener("click", openWishDialog);
document.getElementById("closeWishDialog").addEventListener("click", () => wishDialog.close());
wishForm.addEventListener("submit", event => {
  event.preventDefault();
  const link = document.getElementById("wishLink").value.trim();
  if (link) {
    try {
      const parsed = new URL(link);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid URL");
    } catch {
      alert("Please enter a valid web link, beginning with https://");
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
    notes: document.getElementById("wishNotes").value.trim()
  };
  wishes.unshift(wish);
  if (saveWishes()) {
    wishForm.reset();
    wishDialog.close();
    setView("wishlist");
  } else { wishes.shift(); }
});
wishlistGrid.addEventListener("click", event => {
  const removeButton = event.target.closest("[data-wish-delete]");
  const gotButton = event.target.closest("[data-wish-got]");
  const id = removeButton?.dataset.wishDelete || gotButton?.dataset.wishGot;
  if (!id) return;
  const wish = wishes.find(entry => entry.id === id);
  if (!wish) return;
  const message = gotButton
    ? `Move "${wish.name}" off your wish list? You can add it to your closet separately.`
    : `Remove "${wish.name}" from your wish list?`;
  if (!confirm(message)) return;
  wishes = wishes.filter(entry => entry.id !== id);
  saveWishes();
  renderWishes();
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
photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { alert("Please choose an image file."); return; }
  const reader = new FileReader();
  reader.onload = () => {
    photoPreview.src = reader.result;
    photoPreview.hidden = false;
    photoLabel.textContent = file.name;
    document.querySelector(".upload-icon").hidden = true;
    document.querySelector(".photo-drop small").hidden = true;
  };
  reader.readAsDataURL(file);
});
form.addEventListener("submit", event => {
  event.preventDefault();
  const photo = photoInput.files[0] ? photoPreview.src : (editingItemId ? editingPhoto : "");
  if (!photo) { alert("Please add a photo first."); return; }
  const item = {
    id: editingItemId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    photo,
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


renderWishes();
