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
  const showingOutfits = view === "outfits";
  closetToolbar.hidden = !showingCloset;
  categoryNav.hidden = !showingCloset;
  closetGrid.hidden = !showingCloset;
  closetEmpty.hidden = !showingCloset || items.length !== 0;
  wishlistSection.hidden = !showingWishlist;
  measurementsSection.hidden = view !== "measurements";
  outfitsSection.hidden = !showingOutfits;
  if (showingWishlist) renderWishes();
  if (showingOutfits) renderOutfits();
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

function loadOutfits() {
  try { return JSON.parse(localStorage.getItem(OUTFITS_STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveOutfits() {
  try {
    localStorage.setItem(OUTFITS_STORAGE_KEY, JSON.stringify(outfits));
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
      <img src="${item.photo}" alt="">
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
  outfitPhotoInput.required = !outfit;
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
  if (!photo) { alert("Please add a photo of this look first."); return; }
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
  const edit = event.target.closest("[data-outfit-edit]");
  const remove = event.target.closest("[data-outfit-delete]");
  if (edit) {
    const outfit = outfits.find(entry => String(entry.id) === String(edit.dataset.outfitEdit));
    if (outfit) openOutfitDialog(outfit);
    return;
  }
  if (remove) {
    const outfit = outfits.find(entry => String(entry.id) === String(remove.dataset.outfitDelete));
    if (!outfit || !confirm('Delete "' + outfit.name + '" from your Outfit Diary?')) return;
    outfits = outfits.filter(entry => String(entry.id) !== String(outfit.id));
    saveOutfits();
    renderOutfits();
  }
});

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


// Full local backup: includes closet photos and every current section's saved data.
const BACKUP_KEYS = [
  STORAGE_KEY,
  WISH_STORAGE_KEY,
  MEASUREMENTS_STORAGE_KEY,
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
