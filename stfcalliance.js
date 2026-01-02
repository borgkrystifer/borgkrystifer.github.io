const ALLIANCE_WORKER_URL = "https://throbbing-night-83f1.gf9mkqbtwv.workers.dev";

const visibleColumns = {};
let currentSort = { column: null, ascending: true };
let allPlayers = [];

const TOURNAMENT_COLUMNS = ["bracket", "score", "tasks", "activeTask", "position"];

async function fetchAllianceData() {
  try {
    const res = await fetch(ALLIANCE_WORKER_URL);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Fetched ", data);

    if (!data.players || data.players.length === 0) {
      console.error("No players found");
      return;
    }

    allPlayers = data.players;

    if (Array.isArray(data.tournaments) && data.tournaments.length > 0) {
      const tournByName = new Map(
        data.tournaments
          .filter(t => t.Name && t.Name.trim() !== "No items.")
          .map(t => {
            return [t.Name.trim(), {
              bracket: t.Bracket || "",
              score: t.Score || "",
              tasks: t.Tasks || "",
              activeTask: t["Active Task"] || "",
              position: t.Position || ""
            }];
          })
      );

      allPlayers = allPlayers.map(p => {
        const playerName = p.Name || p.name || p.Player || p["Player"] || p["PLAYER"] || "";
        const t = tournByName.get(playerName.trim());
        return t ? { ...p, ...t } : p;
      });

      console.log(`Merged ${tournByName.size} tournament entries onto players`);
    }

    renderRoster(allPlayers);
    console.log(`Successfully loaded ${allPlayers.length} players`);
  } catch (err) {
    console.error("Error fetching alliance ", err);
  }
}

renderRoster(allPlayers);
console.log(`Successfully loaded ${allPlayers.length} players`);


function renderRoster(players) {
  const container = document.getElementById("roster-inner");
  if (!container) {
    console.error("Roster container not found in DOM");
    return;
  }

  container.innerHTML = "";

  if (players.length > 0) {
    Object.keys(players[0]).forEach(column => {
      if (!(column in visibleColumns)) {
        visibleColumns[column] = true;
      }
    });
  }

  const toggleDiv = document.createElement("div");
  toggleDiv.className = "column-toggles";
  toggleDiv.style.marginBottom = "15px";
  toggleDiv.style.display = "flex";
  toggleDiv.style.flexWrap = "wrap";
  toggleDiv.style.gap = "10px";

  const tournLabel = document.createElement("label");
  tournLabel.style.display = "flex";
  tournLabel.style.alignItems = "center";
  tournLabel.style.gap = "5px";
  tournLabel.style.cursor = "pointer";

  const tournCheckbox = document.createElement("input");
  tournCheckbox.type = "checkbox";
  tournCheckbox.checked = true;
  tournCheckbox.style.cursor = "pointer";

  tournCheckbox.addEventListener("change", (e) => {
    const checked = e.target.checked;
    TOURNAMENT_COLUMNS.forEach(col => {
      if (col in visibleColumns) {
        visibleColumns[col] = checked;
        toggleColumn(col, checked);
      }
    });
  });

  tournLabel.appendChild(tournCheckbox);
  tournLabel.appendChild(document.createTextNode("Tournament columns"));
  toggleDiv.appendChild(tournLabel);

  if (players.length > 0) {
    Object.keys(players[0]).forEach(column => {
      if (TOURNAMENT_COLUMNS.includes(column)) return;
      
      const label = document.createElement("label");
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.gap = "5px";
      label.style.cursor = "pointer";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = visibleColumns[column];
      checkbox.dataset.column = column;
      checkbox.style.cursor = "pointer";

      checkbox.addEventListener("change", (e) => {
        visibleColumns[column] = e.target.checked;
        toggleColumn(column, e.target.checked);
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(column));
      toggleDiv.appendChild(label);
    });
  }

  container.appendChild(toggleDiv);

  const table = document.createElement("table");
  table.id = "roster";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  if (players.length > 0) {
    const headerNames = {
      bracket: "Bracket",
      score: "Score",
      tasks: "Tasks",
      activeTask: "Active Task",
      position: "Position"
    };
    
    Object.keys(players[0]).forEach(key => {
      const th = document.createElement("th");
      th.textContent = headerNames[key] || key;
      th.dataset.column = key;
      th.style.cursor = "pointer";
      th.style.userSelect = "none";
      th.title = "Click to sort";
      th.addEventListener("click", () => {
        sortTable(key);
      });
      headerRow.appendChild(th);
    });
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  players.forEach(player => {
    const row = document.createElement("tr");
    Object.keys(players[0]).forEach(key => {
  const td = document.createElement("td");
  td.dataset.column = key;
  
  if (["score"].includes(key) && player[key]) {
    const scoreBar = document.createElement("div");
    scoreBar.className = "tournament-score-bar";
    scoreBar.style.width = Math.min(parseFormattedNumber(player[key]) / 1e9 * 20, 100) + "px";
    td.appendChild(scoreBar);
  }
  td.appendChild(document.createTextNode(player[key]));
  
  row.appendChild(td);
});

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  Object.keys(visibleColumns).forEach(col => {
    toggleColumn(col, visibleColumns[col]);
  });
}

function parseFormattedNumber(value) {
  if (typeof value !== "string") return parseFloat(value) || 0;

  const trimmed = value.trim();
  const match = trimmed.match(/^([\d.]+)\s*([KMBT]?)$/i);

  if (!match) {
    const plainNum = parseFloat(trimmed);
    return isNaN(plainNum) ? 0 : plainNum;
  }

  let num = parseFloat(match[1]);
  if (isNaN(num)) return 0;

  const suffix = match[2] ? match[2].toUpperCase() : "";

  if (suffix === "K") num *= 1_000;
  else if (suffix === "M") num *= 1_000_000;
  else if (suffix === "B") num *= 1_000_000_000;
  else if (suffix === "T") num *= 1_000_000_000_000;

  return num;
}

function sortTable(column) {
  if (currentSort.column === column) {
    currentSort.ascending = !currentSort.ascending;
  } else {
    currentSort.column = column;
    currentSort.ascending = true;
  }

  allPlayers.sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];

    const aNum = parseFormattedNumber(aVal);
    const bNum = parseFormattedNumber(bVal);

    if (aNum !== 0 || bNum !== 0) {
      return currentSort.ascending ? aNum - bNum : bNum - aNum;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return currentSort.ascending
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return 0;
  });

  renderRoster(allPlayers);
}

function toggleColumn(column, isVisible) {
  const table = document.getElementById("roster");
  if (!table) return;

  const headers = table.querySelectorAll(`th[data-column="${column}"]`);
  const cells = table.querySelectorAll(`td[data-column="${column}"]`);

  headers.forEach(th => {
    th.style.display = isVisible ? "" : "none";
  });

  cells.forEach(td => {
    td.style.display = isVisible ? "" : "none";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAllianceData();
  setInterval(fetchAllianceData, 5 * 60 * 1000);
});