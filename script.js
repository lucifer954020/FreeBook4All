const API_URL = "https://script.google.com/macros/s/AKfycbzy9qqIXCKYhC3HB5zJQ0SI_vSTyrUyp7oODVLayFRMYoi66dVSNtHZhOEvi6Lss-3Q/exec";

let allFiles = [];

fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ action: "get_data" })
})
  .then((res) => res.json())
  .then((data) => {
    allFiles = data.slice(1).filter(row => row[7] === "Approved");
    updateStats(allFiles);
    renderList(allFiles);
  })
  .catch((err) => {
    document.getElementById("fileList").innerHTML = `<p class="text-red-600">❌ Failed to load files.</p>`;
    console.error("Fetch error:", err);
  });

function renderList(files) {
  const list = document.getElementById("fileList");
  list.innerHTML = "";

  files.forEach(row => {
    const [timestamp, type, name, size, link, senderName, senderEmail] = row;
    const card = document.createElement("div");
    card.className = "bg-white shadow p-4 rounded";
    card.innerHTML = `
      <h3 class="text-lg font-semibold">${name}</h3>
      <p>Type: ${type}</p>
      <p>Size: ${size || "N/A"} MB</p>
      <p>Uploaded by: ${senderName} (${senderEmail})</p>
      <p>Date: ${new Date(timestamp).toLocaleDateString()}</p>
      <a href="${link}" class="text-blue-600 underline mt-2 inline-block" target="_blank">📥 View / Download</a>
    `;
    list.appendChild(card);
  });
}

function updateStats(files) {
  let pdfCount = 0, linkCount = 0;
  files.forEach(row => {
    if (row[1] === "PDF") pdfCount++;
    if (row[1] === "LINK") linkCount++;
  });

  document.getElementById("totalPDFs").textContent = pdfCount;
  document.getElementById("totalLinks").textContent = linkCount;

  const visits = localStorage.getItem("visits") || 0;
  const updated = parseInt(visits) + 1;
  localStorage.setItem("visits", updated);
  document.getElementById("totalVisitors").textContent = updated;
}

// Search
document.getElementById("searchBar").addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  const filtered = allFiles.filter(row =>
    row[2].toLowerCase().includes(value) || row[5].toLowerCase().includes(value)
  );
  renderList(filtered);
});

// Filters
document.getElementById("filterName").addEventListener("change", (e) => {
  const value = e.target.value;
  const sorted = [...allFiles].sort((a, b) =>
    value === "az" ? a[2].localeCompare(b[2]) : b[2].localeCompare(a[2])
  );
  renderList(value ? sorted : allFiles);
});

document.getElementById("filterSize").addEventListener("change", (e) => {
  const value = e.target.value;
  const sorted = [...allFiles].sort((a, b) => {
    const aSize = parseFloat(a[3] || 0);
    const bSize = parseFloat(b[3] || 0);
    return value === "big" ? bSize - aSize : aSize - bSize;
  });
  renderList(value ? sorted : allFiles);
});

document.getElementById("filterDate").addEventListener("change", (e) => {
  const value = e.target.value;
  const sorted = [...allFiles].sort((a, b) => {
    const aDate = new Date(a[0]);
    const bDate = new Date(b[0]);
    return value === "new" ? bDate - aDate : aDate - bDate;
  });
  renderList(value ? sorted : allFiles);
});
