      document.querySelectorAll(".tab-button").forEach((button) => {
        button.addEventListener("click", () => {
          const target = button.dataset.target;
          if (!target) return;

          document.querySelectorAll(".tab-button").forEach((btn) => btn.classList.remove("active"));
          button.classList.add("active");

          document.querySelectorAll(".content").forEach((c) => c.classList.remove("active"));
          document.getElementById(target).classList.add("active");
          
          if (target === "stats") updateChart();
        });
      });

      function updateProgress(platform) {
        const list = document.getElementById(`${platform}-games`);
        const items = list.querySelectorAll("li");
        const completed = list.querySelectorAll(".tagCompleted").length;
        const progress = document.getElementById(`${platform}-progress`);
        progress.textContent = `Completed ${completed} / ${items.length}`;
      }

      function saveToLocalStorage() {
        const data = {};
        platforms.forEach((platform) => {
          const items = document.querySelectorAll(`#${platform}-games li`);
          data[platform] = Array.from(items).map((item) => {
            const tag = item.querySelector(".tag");
            const yearSelect = item.querySelector('select.year-input');
            const monthSelect = item.querySelector('select.month-input');
            const rating = item.getAttribute("data-rating") || "";
            const status = tag?.value || "OnHold";

            return {
              title: item.querySelector("span").textContent,
              status,
              year: yearSelect?.value || "",
              month: monthSelect?.value || "",
              rating
            };
          });
        });
        data.prefix = "gameBacklog";
        localStorage.setItem("gameBacklog", JSON.stringify(data));
      }

      function loadFromLocalStorage() {
        const stored = localStorage.getItem("gameBacklog");
        if (!stored) return;

        try {
          const data = JSON.parse(stored);
          platforms.forEach((platform) => {
            const list = document.getElementById(`${platform}-games`);
            list.innerHTML = "";
            const sortedGames = (data[platform] || []).sort((a, b) => a.title.localeCompare(b.title));
            sortedGames.forEach((game) => {
              const li = createGameItem(platform, game.title, game.status, game.year, game.month, game.rating);
              list.appendChild(li);
            });
            updateProgress(platform);
            updateChart();
          });
        } catch {
          console.error("Failed to load game backlog from localStorage");
        }
      }

      function createGameItem(platform, title, status, year = "", month = "", rating = "") {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = title;

        const tag = document.createElement("select");
        tag.classList.add("tag", `tag${status.replace(/\s/g, '')}`);
        ["NotStarted", "InProgress", "OnHold", "Completed"].forEach(opt => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt.replace(/([A-Z])/g, ' $1').trim();
          if (opt === status.replace(/\s/g, '')) option.selected = true;
          tag.appendChild(option);
        });

        const yearSelect = document.createElement("select");
        yearSelect.classList.add("year-input");
        yearSelect.style.marginLeft = "10px";
        yearSelect.style.display = (status === "Completed") ? "inline-block" : "none";
        
        const monthSelect = document.createElement("select");
        monthSelect.classList.add("month-input");
        monthSelect.style.marginLeft = "10px";
        monthSelect.style.display = (status === "Completed") ? "inline-block" : "none";

        const monthOptions = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        monthOptions.forEach((m, i) => {
          const option = document.createElement("option");
          option.value = i === 0 ? "" : m;
          option.textContent = i === 0 ? "Month" : m;
          if (m === month) option.selected = true;
          monthSelect.appendChild(option);
        });

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Year";
        yearSelect.appendChild(defaultOption);

        // Add year options from 2025 to 1970
        for (let y = 2025; y >= 1970; y--) {
          const option = document.createElement("option");
          option.value = y;
          option.textContent = y;
          if (String(y) === year) option.selected = true;
          yearSelect.appendChild(option);
        }

        tag.addEventListener("change", () => {
          tag.className = "tag";
          tag.classList.add(`tag${tag.value}`);
          yearSelect.style.display = (tag.value === "Completed") ? "inline-block" : "none";
          updateProgress(platform);
          updateChart();
          saveToLocalStorage();
      	});

        yearSelect.addEventListener("change", () => {
          saveToLocalStorage();
        });
        
        monthSelect.addEventListener("change", () => {
          saveToLocalStorage();
        });

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.className = "remove-button";
        removeBtn.addEventListener("click", () => {
          li.remove();
          updateProgress(platform);
          updateChart();
          saveToLocalStorage();
        });

        li.appendChild(span);
        li.appendChild(tag);
        li.appendChild(yearSelect);
        li.appendChild(monthSelect);
        li.appendChild(removeBtn);
        li.setAttribute("data-rating", rating || "");
        return li;
      }

      document.querySelectorAll(".add-form").forEach((form) => {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          const platform = form.dataset.platform;
          const titleInput = form.querySelector("input");
          const statusSelect = form.querySelector("select");
          const gameList = document.getElementById(`${platform}-games`);

          const title = titleInput.value.trim();
          const status = statusSelect.value;
          if (!title) return;

          const li = createGameItem(platform, title, status);

          const existingItems = Array.from(gameList.querySelectorAll("li"));
          existingItems.push(li);
          existingItems.sort((a, b) => {
            const aText = a.querySelector("span").textContent.toLowerCase();
            const bText = b.querySelector("span").textContent.toLowerCase();
            return aText.localeCompare(bText);
          });

          gameList.innerHTML = "";
          existingItems.forEach(item => gameList.appendChild(item));

          titleInput.value = "";
          updateProgress(platform);
          updateChart();
          saveToLocalStorage();
        });
      });

      const platforms = ["epic", "nintendo", "playstation", "steam", "xbox"];
      const statuses = ["All", "Completed", "NotStarted", "InProgress", "OnHold"];
      
      const statusLabels = {
        All: "All",
        Completed: "Completed",
        NotStarted: "Not Started",
        InProgress: "In Progress",
        OnHold: "On Hold"
      };

      platforms.forEach((platform) => {
        const filterContainer = document.createElement("div");
        filterContainer.id = `${platform}-filters`;
        filterContainer.className = "tab-buttons2";
        const container = document.getElementById(`${platform}-games`).parentElement;
        container.insertBefore(filterContainer, container.firstChild);

        statuses.forEach((status) => {
          const btn = document.createElement("div");
          btn.className = "tab-button";
          btn.textContent = statusLabels[status];
  		  btn.dataset.status = status;
          btn.addEventListener("click", () => filterGamesByStatus(platform, status));
          filterContainer.appendChild(btn);
        });
      });

      function filterGamesByStatus(platform, status) {
        const list = document.getElementById(`${platform}-games`);
        const items = list.querySelectorAll("li");

        items.forEach((item) => {
          const tag = item.querySelector(".tag");
          const value = tag?.value || "";
          const currentStatus = value;
          item.style.display = (status === "All" || currentStatus === status) ? "" : "none";
        });

        document.querySelectorAll(`#${platform}-filters .tab-button`).forEach((btn) => {
          btn.classList.remove("active");
          if (btn.textContent === status) btn.classList.add("active");
        });
      }
      
      let statusChart;

      function updateChart() {
        const statusCounts = {
          "Completed": 0,
          "NotStarted": 0,
          "InProgress": 0,
          "OnHold": 0
        };

        platforms.forEach((platform) => {
          const list = document.querySelectorAll(`#${platform}-games .tag`);
          list.forEach((tag) => {
            const status = tag.value;
            if (statusCounts[status] !== undefined) {
              statusCounts[status]++;
            }
          });
        });

        const totalGames = Object.values(statusCounts).reduce((a, b) => a + b, 0);
        document.getElementById("totalGames").innerHTML = `Total Games: <span style="color: #aaa">${totalGames}</span>`
        
        const percentCompleted = totalGames ? ((statusCounts.Completed / totalGames) * 100).toFixed(1) : 0;
		document.getElementById("totalGames").innerHTML += `<br>Completed: <span style="color: #aaa">${percentCompleted}%</span>`;

        const statusLabels = {
          Completed: "Completed",
          NotStarted: "Not Started",
          InProgress: "In Progress",
          OnHold: "On Hold"
        };

        const breakdownHTML = Object.entries(statusCounts).map(([key, count]) => {
          const percent = totalGames ? ((count / totalGames) * 100).toFixed(1) : 0;
          return `<div>${statusLabels[key]}: ${count} <span style="color: #aaa">(${percent}%)</span></div>`;
        }).join("");

        document.getElementById("statusBreakdown").innerHTML = breakdownHTML;

        const data = {
          labels: ["Completed", "Not Started", "In Progress", "On Hold"],
          datasets: [{
            label: "Game Statuses",
            data: [
              statusCounts.Completed,
              statusCounts.NotStarted,
              statusCounts.InProgress,
              statusCounts.OnHold
            ],
            backgroundColor: ["#4ADE80", "#949494", "#0EA5E9", "#84CC16"],
            borderColor: "#121212",
            borderWidth: 2,
          }]
        };
        
        let platformHTML = "";

        platforms.forEach(platform => {
          const list = document.querySelectorAll(`#${platform}-games li`);
          const total = list.length;
          const completed = Array.from(list).filter(li => {
            const tag = li.querySelector(".tag");
            return tag && tag.value === "Completed";
          }).length;

          const percent = total ? ((completed / total) * 100).toFixed(1) : "0.0";
          const name = platform.charAt(0).toUpperCase() + platform.slice(1);
          platformHTML += `<div>${name}: ${completed} / ${total} <span style="color: #aaa">(${percent}%)</span></div>`;
        });

        document.getElementById("platformBreakdown").innerHTML = platformHTML;     

        // Destroy old chart if it exists
        if (statusChart) {
          statusChart.destroy();
          statusChart = null;
        }

        const ctx = document.getElementById("statusChart").getContext("2d");
        statusChart = new Chart(ctx, {
          type: "doughnut",
          data,
          options: {
            responsive: true,
            plugins: {
              legend: {
                labels: {
                  color: "#ccc"
                }
              }
            }
          }
        });
        
        updateRatingsTab();
        updateCompletedByYear();
      }
      
      function updateCompletedByYear() {
        const container = document.getElementById("completed-by-year");
        container.innerHTML = "<h3>Completed Games by Year</h3>";

        const gamesByYearMonth = {};
        const yearCounts = {};

        // Gather all completed games into year/month and count per year
        platforms.forEach(platform => {
          const listItems = document.querySelectorAll(`#${platform}-games li`);
          listItems.forEach(li => {
            const tag = li.querySelector(".tag");
            if (tag?.value !== "Completed") return;

            const selects = li.querySelectorAll("select");
            const yearSelect = selects[1];
            const monthSelect = selects[2];

            const year = yearSelect?.value || "Unknown";
            const month = monthSelect?.value || "Unknown";
            const title = li.querySelector("span")?.textContent || "Untitled";

            if (!gamesByYearMonth[year]) gamesByYearMonth[year] = {};
            if (!gamesByYearMonth[year][month]) gamesByYearMonth[year][month] = [];
            gamesByYearMonth[year][month].push(title);

            // Count total completed per year
            yearCounts[year] = (yearCounts[year] || 0) + 1;
          });
        });

        // Compute total completed overall
        const totalCompleted = Object.values(yearCounts).reduce((a, b) => a + b, 0);

        const years = Object.keys(gamesByYearMonth).sort((a, b) => b - a); // newest first

        years.forEach(year => {
          const totalThisYear = yearCounts[year];
          const percentOfAll = totalCompleted ? ((totalThisYear / totalCompleted) * 100).toFixed(1) : "0.0";

          const yearSection = document.createElement("div");
          yearSection.classList.add("year-section");

          const toggle = document.createElement("button");
          toggle.className = "year-toggle";
          toggle.innerHTML = `▶ ${year}: ${totalThisYear} <span style="color:#aaa">(${percentOfAll}%)</span>`;
          toggle.style.background = "none";
          toggle.style.border = "none";
          toggle.style.color = "#ccc";
          toggle.style.cursor = "pointer";
          toggle.style.fontSize = "16px";
          toggle.style.marginTop = "10px";

          const content = document.createElement("div");
          content.style.display = "none";
          content.style.marginLeft = "20px";

          const months = Object.keys(gamesByYearMonth[year]).sort((a, b) => {
            const order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return order.indexOf(a) - order.indexOf(b);
          });

          months.forEach(month => {
            const monthGames = gamesByYearMonth[year][month];
            const count = monthGames.length;
            const percent = totalThisYear ? ((count / totalThisYear) * 100).toFixed(1) : "0.0";

            const monthDiv = document.createElement("div");
            monthDiv.innerHTML = `<strong>${month}</strong> <span style="color:#aaa">(${count} - ${percent}%)</span>`;
            monthDiv.style.marginTop = "10px";
 
            monthGames.forEach(game => {
              const gameItem = document.createElement("div");
              gameItem.textContent = game;
              gameItem.style.marginLeft = "10px";
              monthDiv.appendChild(gameItem);
            });

            content.appendChild(monthDiv);
          });

          toggle.addEventListener("click", () => {
            const isVisible = content.style.display === "block";
            content.style.display = isVisible ? "none" : "block";
            toggle.innerHTML = `▶ ${year}: ${totalThisYear} <span style="color:#aaa">(${percentOfAll}%)</span>`;
          });

          yearSection.appendChild(toggle);
          yearSection.appendChild(content);
          container.appendChild(yearSection);
        });
      }
      
      function updateRatingsTab() {
        const container = document.getElementById("ratings-list");
        container.innerHTML = "";

        const completedGames = [];

        platforms.forEach(platform => {
          const list = document.querySelectorAll(`#${platform}-games li`);
          list.forEach(li => {
            const tag = li.querySelector(".tag");
            const year = li.querySelector('select:nth-of-type(1)')?.value || "";
            const month = li.querySelector('select:nth-of-type(2)')?.value || "";
            const title = li.querySelector("span").textContent;
            const currentRating = li.getAttribute("data-rating") || "";

            if (tag?.value === "Completed") {
              completedGames.push({
                platform,
                li,
                title,
                year,
                month,
                rating: currentRating,
                ratingNum: Number(currentRating) || 0,
              });
            }
          });
        });

        completedGames.sort((a, b) => b.ratingNum - a.ratingNum);

        completedGames.forEach(game => {
          const div = document.createElement("div");
          div.style.marginBottom = "10px";

          // Use flexbox for horizontal alignment
          div.style.display = "flex";
          div.style.alignItems = "center";
          div.style.justifyContent = "space-between"; // spread title and rating apart

          // Left side: title + year/month
          const titleSpan = document.createElement("span");
          titleSpan.style.flexGrow = "1"; // take available space
          titleSpan.innerHTML = `<strong>${game.title}</strong> <span style="color:#aaa; margin-left:8px;">${game.month ? game.month + " " : ""}${game.year}</span>`;

          // Right side: rating dropdown
          const ratingSelect = document.createElement("select");
          ratingSelect.className = "year-input";
          ratingSelect.style.marginLeft = "10px";
          ratingSelect.style.flexShrink = "0"; // don’t shrink

          const noRatingOpt = document.createElement("option");
          noRatingOpt.value = "";
          noRatingOpt.textContent = "Rating";
          ratingSelect.appendChild(noRatingOpt);

          for (let i = 1; i <= 10; i++) {
            const opt = document.createElement("option");
            opt.value = i.toString();
            opt.textContent = i.toString();
            if (game.rating === i.toString()) opt.selected = true;
            ratingSelect.appendChild(opt);
          }

          ratingSelect.addEventListener("change", () => {
            game.li.setAttribute("data-rating", ratingSelect.value);
            saveToLocalStorage();
            updateRatingsTab();
          });

          div.appendChild(titleSpan);
          div.appendChild(ratingSelect);
          container.appendChild(div);
        });
      }

      function exportChecklist() {
        const data = { 
          prefix: "gameBacklog" // Add this line
        };

        platforms.forEach((platform) => {
          const items = document.querySelectorAll(`#${platform}-games li`);
          data[platform] = Array.from(items).map((item) => {
            const tag = item.querySelector(".tag");
            const yearSelect = item.querySelector('select.year-input');
            const monthSelect = item.querySelector('select.month-input');
            const status = tag?.value || "OnHold";

            return {
              title: item.querySelector("span").textContent,
              status,
              year: yearSelect?.value || "",
              month: monthSelect?.value || "",
              rating: item.getAttribute("data-rating") || ""
            };
          });
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "game-backlog.json";
        a.click();
        URL.revokeObjectURL(url);
      }

      function importChecklist() {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "application/json";
        fileInput.style.display = "none";

        fileInput.addEventListener("change", (event) => {
          const file = event.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = JSON.parse(e.target.result);

              if (data.prefix !== "gameBacklog") {
                alert(`This checklist file is not for this backlog (found prefix: "${data.prefix || 'none'}"). Import aborted.`);
                return;
              }

              platforms.forEach((platform) => {
                const list = document.getElementById(`${platform}-games`);
                list.innerHTML = "";
                const sortedGames = (data[platform] || []).sort((a, b) => a.title.localeCompare(b.title));
                sortedGames.forEach((game) => {
                  const li = createGameItem(platform, game.title, game.status, game.year, game.month, game.rating);
                  li.setAttribute("data-rating", game.rating || "");
                  list.appendChild(li);
                });
                updateProgress(platform);
                updateChart();
              });

              saveToLocalStorage();
              alert("Game backlog imported successfully.");
            } catch {
              alert("Invalid file format.");
            }
          };

          reader.readAsText(file);
        });

        document.body.appendChild(fileInput);
        fileInput.click();
      }
      
      function toggleTheme() {
        const body = document.body;
        const toggleButton = document.querySelector(".tab-button[onclick='toggleTheme()']");

        body.classList.toggle("light-mode");
        const isLight = body.classList.contains("light-mode");

        localStorage.setItem("theme", isLight ? "light" : "dark");
        toggleButton.textContent = isLight ? "🌞 Light / Dark Mode" : "🌙 Light / Dark Mode";
      }

	const modal = document.getElementById("profile-modal");
	const openBtn = document.getElementById("open-profile-modal");
	const closeBtn = document.getElementById("close-profile-modal");
	
	const nameInput = document.getElementById("modal-name");
	const usernameInput = document.getElementById("modal-username");
	const bgUpload = document.getElementById("modal-bg-upload");
	
	const saveBtn = document.getElementById("modal-save");
	
	const nameDisplay = document.getElementById("profile-name");
	const usernameDisplay = document.getElementById("profile-username");
	const profileBg = document.querySelector(".profile-bg");
	
	// Open modal and prefill with current values
	openBtn.addEventListener("click", () => {
	  modal.style.display = "block";
	  nameInput.value = nameDisplay.textContent;
	  usernameInput.value = usernameDisplay.textContent;
	});
	
	// Close modal
	closeBtn.addEventListener("click", () => {
	  modal.style.display = "none";
	});
	
	// Save changes
	saveBtn.addEventListener("click", () => {
	  const newName = nameInput.value.trim();
	  const newUsername = usernameInput.value.trim();
	  const file = bgUpload.files[0];
	
	  if (newName) {
	    nameDisplay.textContent = newName;
	    localStorage.setItem("profileName", newName);
	  }
	
	  if (newUsername) {
	    usernameDisplay.textContent = newUsername;
	    localStorage.setItem("profileUsername", newUsername);
	  }
	
	  if (file) {
	    const reader = new FileReader();
	    reader.onload = function (e) {
	      const dataURL = e.target.result;
	      profileBg.style.backgroundImage = `url('${dataURL}')`;
	      localStorage.setItem("profileBg", dataURL);
	    };
	    reader.readAsDataURL(file);
	  }
	
	  modal.style.display = "none";
	});
	
	// Load saved data on startup
	window.addEventListener("DOMContentLoaded", () => {
	  const savedName = localStorage.getItem("profileName");
	  const savedUsername = localStorage.getItem("profileUsername");
	  const savedBg = localStorage.getItem("profileBg");
	
	  if (savedName && nameDisplay) nameDisplay.textContent = savedName;
	  if (savedUsername && usernameDisplay) usernameDisplay.textContent = savedUsername;
	  if (savedBg && profileBg) profileBg.style.backgroundImage = `url('${savedBg}')`;
	});
      
      window.addEventListener("DOMContentLoaded", loadFromLocalStorage);
