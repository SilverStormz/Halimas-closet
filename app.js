const STORAGE_KEY = "halimas-closet-items-v1";
const grid = document.getElementById("closetGrid");
const emptyState = document.getElementById("emptyState");
const dialog = document.getElementById("itemDialog");
const form = document.getElementById("itemForm");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const photoLabel = document.getElementById("photoLabel");
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
        <button class="delete-button" data-delete="${item.id}" aria-label="Delete ${escapeHTML(item.name)}">×</button>
      </div>
      <div class="item-meta">
        <p class="item-brand">${escapeHTML(item.brand || item.category)}</p>
        <h3 class="item-name">${escapeHTML(item.name)}</h3>
        <p class="item-detail">${[item.color,item.size].filter(Boolean).map(escapeHTML).join(" · ")}</p>
      </div>
    </article>`).join("");
  emptyState.style.display = items.length === 0 ? "block" : "none";
  if (items.length > 0 && filtered.length === 0) {
    grid.innerHTML = '<p class="no-results">No pieces match your search.</p>';
  }
}
function openDialog() { dialog.showModal(); }
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
  if (!photoPreview.src || photoPreview.hidden) { alert("Please add a photo first."); return; }
  const item = {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    photo: photoPreview.src,
    name: document.getElementById("nameInput").value.trim(),
    brand: document.getElementById("brandInput").value.trim(),
    category: document.getElementById("categoryInput").value,
    color: document.getElementById("colorInput").value.trim(),
    size: document.getElementById("sizeInput").value.trim(),
    notes: document.getElementById("notesInput").value.trim()
  };
  items.unshift(item);
  if (saveItems()) {
    form.reset();
    photoPreview.hidden = true;
    photoPreview.removeAttribute("src");
    photoLabel.textContent = "Add a photograph";
    document.querySelector(".upload-icon").hidden = false;
    document.querySelector(".photo-drop small").hidden = false;
    dialog.close();
    activeCategory = "All";
    document.querySelectorAll(".category-chip").forEach(chip => chip.classList.toggle("active", chip.dataset.category === "All"));
    render();
  } else { items.shift(); }
});
grid.addEventListener("click", event => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  const item = items.find(entry => entry.id === button.dataset.delete);
  if (!item || !confirm(`Remove "${item.name}" from your closet?`)) return;
  items = items.filter(entry => entry.id !== item.id);
  saveItems();
  render();
});
render();

