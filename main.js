let tabButtons, tabContents, activateTab;

let allianceRosterData = {
  players: [],
  lastUpdated: null
};

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

function updateCommandTab() {
  const nameColumn = 'Name';
  const rankColumn = 'Rank';
  
  const admirals = allianceRosterData.players.filter(p => 
    p[rankColumn] === 'Admiral'
  );
  const commodores = allianceRosterData.players.filter(p => 
    p[rankColumn] === 'Commodore'
  );
  const premiers = allianceRosterData.players.filter(p => 
    p[rankColumn] === 'Premier'
  );

  const admiralNames = admirals.map(p => p[nameColumn]).join(' | ') || 'TBD';
  const commodoreNames = commodores.map(p => p[nameColumn]).join(' | ') || 'TBD';
  const premierNames = premiers.map(p => p[nameColumn]).join(' | ') || 'TBD';
  

  const admiralElement = document.getElementById('command-admiral');
  if (admiralElement) admiralElement.textContent = admiralNames;
  
  const commodoresElement = document.getElementById('command-commodores');
  if (commodoresElement) commodoresElement.textContent = commodoreNames;
  
  const premiersElement = document.getElementById('command-premiers');
  if (premiersElement) premiersElement.textContent = premierNames;
  
  console.log('Command tab updated:', { admiralNames, commodoreNames, premierNames });
}

window.addEventListener('hashchange', function (e) {
    e.preventDefault();
    window.scrollTo(0, 0);
}, true);

if (window.location.hash) {
    window.scrollTo(0, 0);
}

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

    tabButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');

            if (tabName === 'welcome') {
                history.replaceState(null, null, window.location.pathname);
            } else {
                window.location.hash = tabName;
            }

            activateTab(tabName);
        });
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeTipsModal();
        }
    });

    const firstTabName = window.location.hash.slice(1);
    if (firstTabName && firstTabName !== 'welcome') {
        activateTab(firstTabName);
    } else {
        activateTab('welcome');
    }

    fetchAllianceRoster().then(() => updateCommandTab());
});

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

window.addEventListener('load', function () {
    const tabName = window.location.hash.slice(1);

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (tabName && tabName !== 'welcome' && activateTab) {
        activateTab(tabName);
    } else if (activateTab) {
        activateTab('welcome');
    }

    setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, 10);
});

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

window.addEventListener('click', function(event) {
    const modal = document.getElementById('lightbox-modal');
    if (event.target === modal) {
        closeLightbox();
    }
});

function initTerminologyModal() {
    const modal = document.getElementById('termModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDefinition = document.getElementById('modalDefinition');
    const closeBtn = document.querySelector('.modal-close');

    if (modal && modalTitle && modalDefinition && closeBtn) {
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

document.addEventListener('DOMContentLoaded', initTerminologyModal);

window.addEventListener('load', initTerminologyModal);

function initHeadingAnchors() {
    const headings = document.querySelectorAll('.tab-content h1, .tab-content h2, .tab-content h3, .tab-content h4, .tab-content .heading-number');

    headings.forEach(h => {
        if (!h.id) return;

        const icon = document.createElement('a');
        icon.className = 'heading-link';
        icon.innerHTML = '🔗';
        icon.href = 'javascript:void(0)';
        icon.style.marginRight = '8px';
        icon.style.opacity = '0.4';
        icon.style.textDecoration = 'none';
        icon.style.cursor = 'pointer';
        icon.style.fontSize = '0.9em';

        icon.addEventListener('click', function (e) {
            e.preventDefault();
            const tabContent = h.closest('.tab-content');
            if (!tabContent || !tabContent.id) return;

            const tabId = tabContent.id;
            const headingId = h.id;
            const fullUrl = window.location.origin + window.location.pathname + '#' + tabId + '/' + headingId;

            navigator.clipboard.writeText(fullUrl).then(() => {
                const originalText = icon.innerHTML;
                icon.innerHTML = '✓';
                icon.style.opacity = '1';
                setTimeout(() => {
                    icon.innerHTML = originalText;
                    icon.style.opacity = '0.4';
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Could not copy link to clipboard');
            });
        });

        icon.addEventListener('mouseenter', () => icon.style.opacity = '1');
        icon.addEventListener('mouseleave', () => icon.style.opacity = '0.4');

        h.insertBefore(icon, h.firstChild);
    });
}

function parseCompoundHash() {
    const raw = window.location.hash.slice(1);
    if (!raw) return { tab: null, heading: null };

    const parts = raw.split('/');
    return {
        tab: parts[0] || null,
        heading: parts[1] || null
    };
}

function scrollToHeading(tabId, headingId) {
    const tabContent = document.getElementById(tabId);
    if (!tabContent) return;
    const target = tabContent.querySelector('#' + CSS.escape(headingId));
    if (!target) return;

    setTimeout(() => {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        window.scrollTo(0, 0);
    }, 50);
}

const originalActivateTab = activateTab;
activateTab = function (tabName) {
    originalActivateTab(tabName);

    const { tab, heading } = parseCompoundHash();
    if (tab === tabName && heading) {
        scrollToHeading(tabName, heading);
    }
};

window.addEventListener('load', function () {
    const { tab, heading } = parseCompoundHash();
    
    if (tab) {
        activateTab(tab);
        if (heading) {
            scrollToHeading(tab, heading);
        }
    }

    initHeadingAnchors();
});

const originalHashchange = window.addEventListener.toString();
window.addEventListener('hashchange', function () {
    const { tab, heading } = parseCompoundHash();
    if (tab && activateTab) {
        activateTab(tab);
        if (heading) {
            scrollToHeading(tab, heading);
        }
    }
});