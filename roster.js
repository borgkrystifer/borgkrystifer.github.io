// this uses shared allianceRosterData from main.js to prevent
// multiple calls to the cloudflare worker

const ALLIANCE_WORKER_URL = "https://throbbing-night-83f1.gf9mkqbtwv.workers.dev";

const visibleColumns = {};
let currentSort = { column: null, ascending: true };
let allPlayers = [];

const TOURNAMENT_COLUMNS = ["bracket", "score", "tasks", "activeTask", "position"];

TOURNAMENT_COLUMNS.forEach(col => {
  visibleColumns[col] = false;
});

function normalizeNameForComparison(name) {
  if (!name) return '';
  
  return name
    .trim()                          // remove whitespace
    .toLowerCase()                   // lowercase
    .normalize('NFD')                // decompose accented chars (é → e + ´)
    .replace(/[\u0300-\u036f]/g, '') // remove diacritical marks
    .replace(/[^\w]/g, '')           // remove non-alphanumeric
    .replace(/\d+$/g, '');           // remove trailing numbers
}

function getNormalizedPlayerName(player) {
  const name = player.Name || player.name || player.Player || player["Player"] || player["PLAYER"] || "";
  return normalizeNameForComparison(name);
}

function getNormalizedLeaverName(leaver) {
  const name = leaver.name || leaver.Name || leaver.Player || leaver["Player"] || leaver["PLAYER"] || "";
  return normalizeNameForComparison(name);
}

let leaversData = [];
let allTimeLeaversData = [];

async function getAllianceData() {
  if (
    window.allianceRosterData &&
    window.allianceRosterData.players &&
    window.allianceRosterData.players.length > 0
  ) {
    console.log("Using shared allianceRosterData from main.js");
    
    if (window.allianceRosterData.leavers && window.allianceRosterData.leavers.length > 0) {
      leaversData = window.allianceRosterData.leavers;
      console.log(`Current session leavers:`, leaversData.map(l => l.Name || l.name || l.Player));
      showLeaverAlert(window.allianceRosterData.leavers);
    }
    
    if (window.allianceRosterData.all_time_leavers && window.allianceRosterData.all_time_leavers.length > 0) {
      allTimeLeaversData = window.allianceRosterData.all_time_leavers;
      console.log(`All-time leavers (last 90 days):`, allTimeLeaversData.map(l => l.name));
    }
    
    return window.allianceRosterData;
  }

  console.log("allianceRosterData not available, fetching independently...");
  try {
    const res = await fetch(ALLIANCE_WORKER_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = await res.json();

    if (data.leavers && data.leavers.length > 0) {
      leaversData = data.leavers;
      console.log(`${data.leavers.length} current session leavers detected:`, data.leavers.map(p => p.Name || p.name || p.Player));
      showLeaverAlert(data.leavers);
    }

    if (data.all_time_leavers && data.all_time_leavers.length > 0) {
      allTimeLeaversData = data.all_time_leavers;
      console.log(`All-time leavers found:`, allTimeLeaversData.map(l => l.name));
    }

    return data;
  } catch (err) {
    console.error("Error fetching alliance:", err);
    return { players: [], tournaments: [] };
  }
}

function showLeaverAlert(leavers) {
  const names = leavers.map(p => p.name || p.Name || p.Player).join(', ');
  console.log(`🚨 ${leavers.length} left or changed names: ${names}`);

  const alert = document.createElement('div');
  alert.style.cssText = `
position: fixed; top: 10px; right: 10px;
background: #ff4444; color: white; padding: 15px;
border-radius: 8px; z-index: 9999; font-weight: bold;
box-shadow: 0 4px 12px rgba(0,0,0,0.3);
max-width: 400px;
word-wrap: break-word;
display: flex;
justify-content: space-between;
align-items: flex-start;
gap: 10px;
  `;
  
  const alertText = document.createElement('div');
  alertText.textContent = `🚨 ${leavers.length} member(s) left or changed names: ${names}`;
  alertText.style.flex = "1";
  alert.appendChild(alertText);
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
background: none;
border: none;
color: white;
font-size: 20px;
cursor: pointer;
padding: 0;
margin: 0;
min-width: 20px;
font-weight: bold;
  `;
  closeBtn.onclick = () => alert.remove();
  alert.appendChild(closeBtn);
  
  document.body.appendChild(alert);
}

async function loadAndRenderRoster() {
  try {
    const data = await getAllianceData();
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
            return [
              t.Name.trim(),
              {
                bracket: t.Bracket || "",
                score: t.Score || "",
                tasks: t.Tasks || "",
                activeTask: t["Active Task"] || "",
                position: t.Position || ""
              }
            ];
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
    console.error("Error loading alliance ", err);
  }
}

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
        visibleColumns[column] = !TOURNAMENT_COLUMNS.includes(column);
      }
    });
  }

  if (allTimeLeaversData && allTimeLeaversData.length > 0) {
  const leaverPanel = document.createElement("div");
  leaverPanel.style.cssText = `
    background: rgba(255, 68, 68, 0.15);
    border: 2px solid #ff4444;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    color: #ff4444;
    font-weight: bold;
    font-family: 'Orbitron', sans-serif;
  `;

  // Header row with title + collapse button
  const headerRow = document.createElement("div");
  headerRow.style.display = "flex";
  headerRow.style.alignItems = "center";
  headerRow.style.justifyContent = "space-between";
  headerRow.style.gap = "10px";
  headerRow.style.marginBottom = "10px";

  const leaverTitle = document.createElement("h3");
  leaverTitle.textContent = `⚠️ Recent Name Changes/Departures (Last 90 Days): ${allTimeLeaversData.length}`;
  leaverTitle.style.margin = "0";
  leaverTitle.style.color = "#ff4444";

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "Hide";
  toggleBtn.style.cssText = `
    background: transparent;
    border: 1px solid #ff4444;
    color: #ff4444;
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    font-size: 12px;
    font-family: 'Orbitron', sans-serif;
    text-transform: uppercase;
  `;

  headerRow.appendChild(leaverTitle);
  headerRow.appendChild(toggleBtn);
  leaverPanel.appendChild(headerRow);

  const leaverList = document.createElement("div");
  leaverList.style.fontSize = "14px";
  leaverList.style.lineHeight = "1.6";
  leaverList.style.color = "#ffcccc";

  const MAX_VISIBLE_LEAVERS = 15;

  allTimeLeaversData.slice(0, MAX_VISIBLE_LEAVERS).forEach(leaver => {
    const entry = document.createElement("div");
    const timestamp = new Date(leaver.timestamp).toLocaleDateString();
    entry.textContent = `• ${leaver.name} (${leaver.rank}, Lvl ${leaver.level}) - Left or Changed Name: ${timestamp}`;
    leaverList.appendChild(entry);
  });

  if (allTimeLeaversData.length > MAX_VISIBLE_LEAVERS) {
    const remaining = allTimeLeaversData.slice(MAX_VISIBLE_LEAVERS);

    const more = document.createElement("div");
    more.textContent = `... and ${remaining.length} more (click to expand)`;
    more.style.fontStyle = "italic";
    more.style.marginTop = "10px";
    more.style.cursor = "pointer";
    more.title = "Click to show all";
    // leaverList.appendChild(more);
    more.addEventListener("click", () => {
      remaining.forEach(leaver => {
        const entry = document.createElement("div");
        const timestamp = new Date(leaver.timestamp).toLocaleDateString();
        entry.textContent =  `• ${leaver.name} (${leaver.rank}, Lvl ${leaver.level}) - Left or Changed Name: ${timestamp}`;
        leaverList.appendChild(entry);
      });
      more.remove();
    });

    leaverList.appendChild(more);
  }

  // Collapse / expand behavior
  let collapsed = true;
  leaverList.style.display = "none";
  toggleBtn.textContent = "Show";
  
  toggleBtn.addEventListener("click", () => {
    collapsed = !collapsed;
    leaverList.style.display = collapsed ? "none" : "";
    toggleBtn.textContent = collapsed ? "Show" : "Hide";
  });

  leaverPanel.appendChild(leaverList);
  container.appendChild(leaverPanel);
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
  tournCheckbox.checked = false;
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
    const normalizedPlayerName = getNormalizedPlayerName(player);
    
    const isCurrentLeaver = leaversData.some(leaver => {
      const normalizedLeaverName = getNormalizedLeaverName(leaver);
      return normalizedPlayerName === normalizedLeaverName;
    });

    const isAllTimeLeaver = allTimeLeaversData.some(leaver => {
      const normalizedLeaverName = normalizeNameForComparison(leaver.name);
      return normalizedPlayerName === normalizedLeaverName;
    });

    if (isCurrentLeaver || isAllTimeLeaver) {
      row.classList.add('leaver-row');
      console.log(`Highlighting ${normalizedPlayerName} as leaver`);
    }

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

function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return new Date(0);
  try {
    return new Date(dateStr);
  } catch {
    return new Date(0);
  }
}

function isDateColumn(column) {
  return column.toLowerCase().includes('date') || column.toLowerCase().includes('joined');
}

function parseFormattedNumber(value) {
  if (typeof value !== "string") return parseFloat(value) || 0;
  const trimmed = value.trim();
  
  const withoutCommas = trimmed.replace(/,/g, '');
  
  const match = withoutCommas.match(/^([\d.]+)\s*([KMBT]?)$/i);
  if (!match) {
    const plainNum = parseFloat(withoutCommas);
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

    if (isDateColumn(column)) {
      const aDate = parseDate(aVal);
      const bDate = parseDate(bVal);
      return currentSort.ascending ? aDate - bDate : bDate - aDate;
    }

    const aNum = parseFormattedNumber(aVal);
    const bNum = parseFormattedNumber(bVal);

    const aIsNumeric = /^[\d,]+(?:\.\d+)?\s*[KMBT]?$/i.test(String(aVal).trim());
    const bIsNumeric = /^[\d,]+(?:\.\d+)?\s*[KMBT]?$/i.test(String(bVal).trim());

    if (aIsNumeric && bIsNumeric) {
      return currentSort.ascending ? aNum - bNum : bNum - aNum;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return currentSort.ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
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
  loadAndRenderRoster();
});