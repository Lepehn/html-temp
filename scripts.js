// ================================
// Initialization
// ================================
const platforms = ["PC", "PlayStation", "Xbox", "Switch"];
const statuses = ["Completed", "Not Started", "In Progress", "On Hold"];
const platformTabs = document.getElementById("platform-tabs");
const mainContent = document.getElementById("main-content");

document.addEventListener("DOMContentLoaded", () => {
  platforms.forEach(createPlatformSection);
  loadChecklist();
  renderChart();
});

// ================================
// UI Builders
// ================================
function createPlatformSection(platform) {
  // Create tab button
  const button = document.createElement("button");
  button.textContent = platform;
  button.addEventListener("click", () => showPlatform(platform));
  platformTabs.appendChild(button);

  // Create section
  const section = document.createElement("section");
  section.id = `${platform}-section`;

  const heading = document.createElement("h2");
  heading.textContent = platform;

  const progress = document.createElement("div");
  progress.className = "progress";
  progress.id = `${platform}-progress`;

  const list = document.createElement("ul");
  list.id = `${platform}-games`;

  const filter = document.createElement("select");
  filter.innerHTML = `<option value="All">All</option>` +
    statuses.map(s => `<option value="${s}">${s}</option>`).join("");
  filter.addEventListener("change", () => filterGames(platform, filter.value));

  section.appendChild(heading);
  section.appendChild(progress);
  section.appendChild(filter);
  section.appendChild(list);
  mainContent.appendChild(section);
}

// ================================
// Game Management
// ================================
function addGame(title, platform, status, rating = "", year = "") {
  const ul = document.getElementById(`${platform}-games`);
  const li = document.createElement("li");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = status === "Completed";
  checkbox.addEventListener("change", () => {
    tag.textContent = checkbox.checked ? "Completed" : "Not Started";
    updateProgress(platform);
    saveChecklist();
    renderChart();
  });

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = status;

  const ratingInput = document.createElement("input");
  ratingInput.type = "number";
  ratingInput.className = "rating-input";
  ratingInput.min = 1;
  ratingInput.max = 10;
  ratingInput.value = rating;
  ratingInput.placeholder = "Rating";
  ratingInput.addEventListener("input", saveChecklist);

  const yearSelect = document.createElement("select");
  yearSelect.className = "year-input";
  yearSelect.innerHTML = `<option value="">--</option>` +
    Array.from({ length: 30 }, (_, i) => 2010 + i)
      .map(y => `<option value="${y}" ${y == year ? "selected" : ""}>${y}</option>`)
      .join("");
  yearSelect.addEventListener("change", saveChecklist);

  const span = document.createElement("span");
  span.textContent = title;

  const remove = document.createElement("button");
  remove.textContent = "✕";
  remove.addEventListener("click", () => {
    li.remove();
    updateProgress(platform);
    saveChecklist();
    renderChart();
  });

  li.append(checkbox, tag, span, ratingInput, yearSelect, remove);
  ul.appendChild(li);
  updateProgress(platform);
  saveChecklist();
  renderChart();
}

function filterGames(platform, status) {
  const items = document.querySelectorAll(`#${platform}-games li`);
  items.forEach(item => {
    const tag = item.querySelector(".tag");
    item.style.display = status === "All" || tag.textContent === status ? "" : "none";
  });
}

function updateProgress(platform) {
  const items = document.querySelectorAll(`#${platform}-games li`);
  const total = items.length;
  const completed = [...items].filter(item => item.querySelector("input").checked).length;
  document.getElementById(`${platform}-progress`).textContent = `Completed ${completed} / ${total}`;
}

// ================================
// Platform Navigation
// ================================
function showPlatform(platform) {
  platforms.forEach(p => {
    document.getElementById(`${p}-section`).style.display = p === platform ? "" : "none";
  });
}

// ================================
// Import/Export
// ================================
function exportChecklist() {
  const data = { prefix: "gameBacklog" };
  platforms.forEach(platform => {
    const items = document.querySelectorAll(`#${platform}-games li`);
    data[platform] = [...items].map(item => ({
      title: item.querySelector("span:nth-of-type(2)").textContent,
      status: item.querySelector(".tag").textContent,
      rating: item.querySelector(".rating-input").value,
      year: item.querySelector(".year-input").value
    }));
  });

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "game_backlog.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importChecklist(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.prefix !== "gameBacklog") {
        alert("Invalid file format.");
        return;
      }

      platforms.forEach(platform => {
        const ul = document.getElementById(`${platform}-games`);
        ul.innerHTML = "";
        (data[platform] || []).forEach(game =>
          addGame(game.title, platform, game.status, game.rating, game.year)
        );
      });
    } catch {
      alert("Failed to parse file.");
    }
  };
  reader.readAsText(file);
}

// ================================
// Local Storage
// ================================
function saveChecklist() {
  const data = { prefix: "gameBacklog" };
  platforms.forEach(platform => {
    const items = document.querySelectorAll(`#${platform}-games li`);
    data[platform] = [...items].map(item => ({
      title: item.querySelector("span:nth-of-type(2)").textContent,
      status: item.querySelector(".tag").textContent,
      rating: item.querySelector(".rating-input").value,
      year: item.querySelector(".year-input").value
    }));
  });
  localStorage.setItem("gameBacklog", JSON.stringify(data));
}

function loadChecklist() {
  const data = JSON.parse(localStorage.getItem("gameBacklog"));
  if (!data || data.prefix !== "gameBacklog") return;
  platforms.forEach(platform => {
    const ul = document.getElementById(`${platform}-games`);
    ul.innerHTML = "";
    (data[platform] || []).forEach(game =>
      addGame(game.title, platform, game.status, game.rating, game.year)
    );
  });
}

// ================================
// Chart.js Donut Chart
// ================================
function renderChart() {
  const counts = { Completed: 0, "Not Started": 0, "In Progress": 0, "On Hold": 0 };

  platforms.forEach(platform => {
    const items = document.querySelectorAll(`#${platform}-games li`);
    items.forEach(item => {
      const status = item.querySelector(".tag").textContent;
      counts[status]++;
    });
  });

  const ctx = document.getElementById("chart").getContext("2d");
  if (window.statusChart) window.statusChart.destroy();

  window.statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ["#a3be8c", "#bf616a", "#ebcb8b", "#88c0d0"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Game Status Overview" }
      }
    }
  });
}

// ================================
// Event Listeners
// ================================
document.getElementById("import-file").addEventListener("change", importChecklist);

document.getElementById("add-game-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("game-title").value.trim();
  const platform = document.getElementById("game-platform").value;
  const status = document.getElementById("game-status").value;
  const rating = document.getElementById("game-rating").value;
  const year = document.getElementById("game-year").value;

  if (!title || !platform || !status) return alert("Please fill out all required fields.");

  addGame(title, platform, status, rating, year);
  e.target.reset();
});
