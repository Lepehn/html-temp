const platforms = ["epic", "nintendo", "playstation", "steam", "xbox"];
const statuses = ["Completed", "Not Started", "In Progress", "On Hold"];

// Wait for DOM load
document.addEventListener("DOMContentLoaded", () => {
  // Add event listeners to all add forms
  document.querySelectorAll(".add-form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const platform = form.dataset.platform;
      const titleInput = form.querySelector('input[type="text"]');
      const statusSelect = form.querySelector('select');
      const title = titleInput.value.trim();
      const status = statusSelect.value;

      if (!title) {
        alert("Please enter a game title.");
        return;
      }

      addGame(title, platform, status);
      form.reset();
    });
  });

  // Add event listeners to platform tab buttons for switching content
  document.querySelectorAll(".tab-buttons2 .tab-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      // Show selected platform content, hide others
      platforms.forEach(p => {
        const el = document.getElementById(p);
        if (el) el.classList.toggle("active", p === target);
      });

      // Set active tab style
      document.querySelectorAll(".tab-buttons2 .tab-button").forEach(b => {
        b.classList.toggle("active", b === btn);
      });
    });
  });

  // Add event listeners for sidebar tab buttons (ratings, stats)
  document.querySelectorAll(".tab-buttons .tab-button[data-target]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      document.querySelectorAll(".content").forEach(c => {
        if (c.id === target) {
          c.classList.add("active");
        } else if (platforms.includes(c.id)) {
          c.classList.remove("active");
        } else {
          c.classList.remove("active");
        }
      });

      document.querySelectorAll(".tab-buttons .tab-button").forEach(b => {
        b.classList.toggle("active", b === btn);
      });
    });
  });

  // Import file input event listener
  document.getElementById("import-file").addEventListener("change", importChecklist);

  loadChecklist();
  renderChart();
});

function addGame(title, platform, status, rating = "", year = "") {
  const ul = document.getElementById(`${platform}-games`);
  if (!ul) return;

  const li = document.createElement("li");

  // Checkbox for completed
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = status === "Completed";
  checkbox.addEventListener("change", () => {
    tag.textContent = checkbox.checked ? "Completed" : "Not Started";
    tag.className = "tag " + getStatusClass(tag.textContent);
    updateProgress(platform);
    saveChecklist();
    renderChart();
  });

  // Status tag
  const tag = document.createElement("span");
  tag.className = "tag " + getStatusClass(status);
  tag.textContent = status;

  // Game title text
  const span = document.createElement("span");
  span.textContent = title;
  span.style.marginLeft = "10px";

  // Rating input
  const ratingInput = document.createElement("input");
  ratingInput.type = "number";
  ratingInput.className = "rating-input";
  ratingInput.min = 1;
  ratingInput.max = 10;
  ratingInput.value = rating;
  ratingInput.placeholder = "Rating";
  ratingInput.style.marginLeft = "10px";
  ratingInput.addEventListener("input", () => {
    saveChecklist();
  });

  // Year select (optional)
  const yearSelect = document.createElement("select");
  yearSelect.className = "year-input";
  yearSelect.style.marginLeft = "10px";
  yearSelect.innerHTML = `<option value="">--</option>` +
    Array.from({ length: 30 }, (_, i) => 2010 + i)
      .map(y => `<option value="${y}" ${y == year ? "selected" : ""}>${y}</option>`)
      .join("");
  yearSelect.addEventListener("change", () => {
    saveChecklist();
  });

  // Remove button
  const remove = document.createElement("button");
  remove.textContent = "✕";
  remove.className = "remove-button";
  remove.style.marginLeft = "10px";
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

function getStatusClass(status) {
  switch (status) {
    case "Completed": return "tagCompleted";
    case "Not Started": return "tagNotStarted";
    case "In Progress": return "tagInProgress";
    case "On Hold": return "tagOnHold";
    default: return "";
  }
}

function updateProgress(platform) {
  const items = document.querySelectorAll(`#${platform}-games li`);
  const total = items.length;
  const completed = [...items].filter(item => item.querySelector("input[type='checkbox']").checked).length;
  const progressEl = document.getElementById(`${platform}-progress`);
  if (progressEl) {
    progressEl.textContent = `Completed ${completed} / ${total}`;
  }
}

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
    if (!ul) return;
    ul.innerHTML = "";
    (data[platform] || []).forEach(game => {
      addGame(game.title, platform, game.status, game.rating, game.year);
    });
  });
}

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
        if (!ul) return;
        ul.innerHTML = "";
        (data[platform] || []).forEach(game => addGame(game.title, platform, game.status, game.rating, game.year));
      });
    } catch {
      alert("Failed to parse file.");
    }
  };
  reader.readAsText(file);
}

// Chart rendering (assuming you include Chart.js in your HTML)
function renderChart() {
  const counts = { Completed: 0, "Not Started": 0, "In Progress": 0, "On Hold": 0 };

  platforms.forEach(platform => {
    const items = document.querySelectorAll(`#${platform}-games li`);
    items.forEach(item => {
      const status = item.querySelector(".tag").textContent;
      counts[status] = (counts[status] || 0) + 1;
    });
  });

  const ctx = document.getElementById("statusChart")?.getContext("2d");
  if (!ctx) return;

  if (window.statusChart) window.statusChart.destroy();

  window.statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ["#4ADE80", "#949494", "#0EA5E9", "#84CC16"]
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
