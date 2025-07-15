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

    let fileActionLabel = "📥 View / Download";
    if (type === "HTML") fileActionLabel = "🌐 View Page";
    if (type === "LINK") fileActionLabel = "🔗 Visit Link";

    card.innerHTML = `
      <h3 class="text-lg font-semibold">${name}</h3>
      <p>Type: ${type}</p>
      <p>Size: ${size || "N/A"} MB</p>
      <p>Uploaded by: ${senderName} (${senderEmail})</p>
      <p>Date: ${new Date(timestamp).toLocaleDateString()}</p>
      <a href="${link}" class="text-blue-600 underline mt-2 inline-block" target="_blank">${fileActionLabel}</a>
    `;

    const template = document.getElementById("rating-template");
    const ratingBlock = template.content.cloneNode(true);
    const select = ratingBlock.querySelector(".rating-select");
    const textarea = ratingBlock.querySelector(".comment-input");
    const button = ratingBlock.querySelector(".submit-rating");
    const status = ratingBlock.querySelector(".rating-status");

    button.onclick = async () => {
      const rating = select.value;
      const comment = textarea.value.trim();
      const sender = prompt("Enter your name:");
      if (!sender) return alert("Name is required.");
      const body = new URLSearchParams({
        action: "rate_comment",
        fileName: name,
        fileType: type,
        rating,
        comment,
        senderName: sender
      });
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body
        });
        const txt = await res.text();
        status.textContent = txt;
        status.className = "text-green-600 mt-1";
      } catch (err) {
        status.textContent = "❌ Failed to submit.";
        status.className = "text-red-600 mt-1";
      }
    };

    card.appendChild(ratingBlock);
    list.appendChild(card);
  });
}

function updateStats(files) {
  let pdfCount = 0, linkCount = 0, htmlCount = 0;
  files.forEach(row => {
    if (row[1] === "PDF") pdfCount++;
    if (row[1] === "LINK") linkCount++;
    if (row[1] === "HTML") htmlCount++;
  });

  document.getElementById("totalPDFs").textContent = pdfCount;
  document.getElementById("totalLinks").textContent = linkCount;
  const htmlElem = document.getElementById("totalHTMLs");
  if (htmlElem) htmlElem.textContent = htmlCount;

  const visits = localStorage.getItem("visits") || 0;
  const updated = parseInt(visits) + 1;
  localStorage.setItem("visits", updated);
  document.getElementById("totalVisitors").textContent = updated;
}

document.getElementById("searchBar").addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  const filtered = allFiles.filter(row =>
    row[2].toLowerCase().includes(value) || row[5].toLowerCase().includes(value)
  );
  renderList(filtered);
});

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

const typeFilter = document.getElementById("filterType");
if (typeFilter) {
  typeFilter.addEventListener("change", (e) => {
    const value = e.target.value;
    const filtered = value ? allFiles.filter(row => row[1] === value) : allFiles;
    renderList(filtered);
  });
}
