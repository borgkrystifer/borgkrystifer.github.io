// GLOBAL VARIABLES
let tabButtons, tabContents, activateTab;

// ======================================
// ALLIANCE DATA & COMMAND TAB MANAGEMENT
// ======================================

// global store for alliance roster data
let allianceRosterData = {
  players: [],
  lastUpdated: null
};

// fetch alliance data from worker
async function fetchAllianceRoster() {
  try {
    const response = await fetch('https://throbbing-night-83f1.gf9mkqbtwv.workers.dev/');
    if (!response.ok) throw new Error('Failed to fetch roster');
    
    const data = await response.json();
    allianceRosterData.players = data.players || [];
    allianceRosterData.lastUpdated = new Date();
    
    console.log('Alliance roster updated:', allianceRosterData.players.length, 'players');
    return true;
  } catch (error) {
    console.error('Error fetching alliance roster:', error);
    return false;
  }
}

// update Command tab with live roster data
function updateCommandTab() {
  // Column names from your API
  const nameColumn = 'Name';
  const rankColumn = 'Rank';
  
  // filter players by their rank from the API
  const admirals = allianceRosterData.players.filter(p => 
    p[rankColumn] === 'Admiral'
  );
  const commodores = allianceRosterData.players.filter(p => 
    p[rankColumn] === 'Commodore'
  );
  const premiers = allianceRosterData.players.filter(p => 
    p[rankColumn] === 'Premier'
  );
  
  // extract names and join with " | "
  const admiralNames = admirals.map(p => p[nameColumn]).join(' | ') || 'TBD';
  const commodoreNames = commodores.map(p => p[nameColumn]).join(' | ') || 'TBD';
  const premierNames = premiers.map(p => p[nameColumn]).join(' | ') || 'TBD';
  
  // update DOM
  const admiralElement = document.getElementById('command-admiral');
  if (admiralElement) admiralElement.textContent = admiralNames;
  
  const commodoresElement = document.getElementById('command-commodores');
  if (commodoresElement) commodoresElement.textContent = commodoreNames;
  
  const premiersElement = document.getElementById('command-premiers');
  if (premiersElement) premiersElement.textContent = premierNames;
  
  console.log('Command tab updated:', { admiralNames, commodoreNames, premierNames });
}

// ============================
// END ALLIANCE DATA MANAGEMENT
// ============================

// prevent scroll on hash navigation
window.addEventListener('hashchange', function (e) {
    e.preventDefault();
    window.scrollTo(0, 0);
}, true);

if (window.location.hash) {
    window.scrollTo(0, 0);
}

// tab switching functionality - runs on page load
document.addEventListener('DOMContentLoaded', function () {
    tabButtons = document.querySelectorAll('.tab-button');
    tabContents = document.querySelectorAll('.tab-content');

    activateTab = function (tabName) {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        const activeContent = document.getElementById(tabName);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    };

    // handles tab clicks
    tabButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');

            // only update url hash if not welcome tab
            if (tabName === 'welcome') {
                history.replaceState(null, null, window.location.pathname);
            } else {
                window.location.hash = tabName;
            }

            activateTab(tabName);
        });
    });

    // esc key to close modal
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeTipsModal();
        }
    });

    // on first load, activate the correct tab
    const firstTabName = window.location.hash.slice(1);
    if (firstTabName && firstTabName !== 'welcome') {
        activateTab(firstTabName);
    } else {
        activateTab('welcome');
    }

    // fetch alliance roster and update command tab on page load
    fetchAllianceRoster().then(() => updateCommandTab());
});

// handle browser back/forward and direct hash links
window.addEventListener('hashchange', function () {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const tabName = window.location.hash.slice(1);
    if (tabName && activateTab) {
        activateTab(tabName);
    }

    setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, 10);
});

// on page load, check if there's a hash and activate that tab
window.addEventListener('load', function () {
    const tabName = window.location.hash.slice(1);

    // reset scroll
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // activate tab only if it's not 'welcome'
    if (tabName && tabName !== 'welcome' && activateTab) {
        activateTab(tabName);
    } else if (activateTab) {
        activateTab('welcome');
    }

    // extra scroll reset
    setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, 10);
});

// tips modal funcs
function openTipsModal(title, box1Data, box2Data, box3Data, box4Data) {
    document.getElementById('modal-image').src = box1Data.image;
    document.getElementById('modal-title').textContent = title;
    
    document.getElementById('box1-title').textContent = box1Data.title;
    document.getElementById('box1-text').textContent = box1Data.text;
    
    document.getElementById('box2-title').textContent = box2Data.title;
    document.getElementById('box2-text').textContent = box2Data.text;
    
    document.getElementById('box3-title').textContent = box3Data.title;
    const list = document.getElementById('box3-list');
    list.innerHTML = box3Data.items.map(item => `<li>${item}</li>`).join('');
    
    document.getElementById('box4-title').textContent = box4Data.title;
    document.getElementById('box4-text').textContent = box4Data.text;
    
    document.getElementById('tips-modal').classList.add('active');
}

function closeTipsModal() {
    document.getElementById('tips-modal').classList.remove('active');
}

// lightbox functionality for images
function openLightbox(element) {
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-image');
    const src = element.querySelector('img').src;
    modal.style.display = 'block';
    modalImg.src = src;
}

function openLightboxImg(img) {
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-image');
    modal.style.display = 'block';
    modalImg.src = img.src;
}

function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    modal.style.display = 'none';
}

// close lightbox when clicking outside the image
window.addEventListener('click', function(event) {
    const modal = document.getElementById('lightbox-modal');
    if (event.target === modal) {
        closeLightbox();
    }
});

// terminology modal functionality for touch devices
function initTerminologyModal() {
    const modal = document.getElementById('termModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDefinition = document.getElementById('modalDefinition');
    const closeBtn = document.querySelector('.modal-close');

    if (modal && modalTitle && modalDefinition && closeBtn) {
        // use event delegation so it works even if terms are added later
        document.addEventListener('click', function(e) {
            if (e.target.closest('.term-tooltip')) {
                const term = e.target.closest('.term-tooltip');
                e.preventDefault();
                e.stopPropagation();
                
                const abbrev = Array.from(term.childNodes)
                    .filter(node => node.nodeType === 3)
                    .map(node => node.textContent.trim())
                    .join('')
                    .trim();
                const definition = term.querySelector('.tooltip-text').textContent.trim();
                
                modalTitle.textContent = abbrev;
                modalDefinition.textContent = definition;
                modal.classList.add('active');
            }
        });

        closeBtn.addEventListener('click', function() {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// initialize after DOM is ready
document.addEventListener('DOMContentLoaded', initTerminologyModal);

// also initialize on load in case elements are created late
window.addEventListener('load', initTerminologyModal);