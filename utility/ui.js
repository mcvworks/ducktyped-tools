// ============================================
// QUACKTOOLS — UI & Interaction
// Modals, Filters, Drag & Drop, Theme, Search, Recent Tools
// ============================================

// MODAL FUNCTIONS
// ============================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
});

// Close modal with ESC key
window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            closeModal(modal.id);
        });
    }
});

// ============================================
// UI UTILITY FUNCTIONS
// ============================================

// Toggle all tools visibility
// Single writer for the command-bar count badge. When the user has tools
// hidden via the visibility toggles (or stale saved state from the old
// destructive category filter), a bare count like "25 tools" looks broken —
// show "25 / 57" and explain via tooltip instead.
function setToolCountBadge(visible) {
    const countEl = document.getElementById('visibleToolCount');
    if (!countEl) return;
    const hiddenCount = document.querySelectorAll('.tool-card.hidden').length;
    const total = document.querySelectorAll('.tool-card').length;
    countEl.textContent = hiddenCount > 0 ? visible + ' / ' + total : visible;
    const badge = document.getElementById('toolCountBadge');
    if (badge) {
        badge.title = hiddenCount > 0
            ? hiddenCount + ' tool' + (hiddenCount === 1 ? ' is' : 's are') + ' hidden by your visibility settings — use "show --all" or the tool toggles to restore them'
            : '';
    }
}

// Helper: update the visible tool count badge in the command bar
function updateVisibleToolCount() {
    const cards = document.querySelectorAll('.tool-card');
    let count = 0;
    cards.forEach(card => {
        if (!card.classList.contains('hidden') && !card.classList.contains('search-hidden') && !card.classList.contains('preset-hidden')) {
            count++;
        }
    });
    setToolCountBadge(count);
}

function toggleAllTools() {
    const checkboxes = document.querySelectorAll('[id^="toggle-"]');
    const btn = document.getElementById('toggleAllBtn');
    const cmd = document.getElementById('termCommand');
    const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
    
    checkboxes.forEach(checkbox => {
        const toolId = checkbox.id.replace('toggle-', '');
        const tool = document.getElementById(toolId);
        
        if (anyUnchecked) {
            // Check all - show all tools
            checkbox.checked = true;
            if (tool) tool.classList.remove('hidden');
        } else {
            // Uncheck all - hide all tools
            checkbox.checked = false;
            if (tool) tool.classList.add('hidden');
        }
    });
    
    // Typing animation + update command text
    btn.classList.remove('typing');
    void btn.offsetWidth; // force reflow
    btn.classList.add('typing');
    setTimeout(function() { btn.classList.remove('typing'); }, 350);

    if (anyUnchecked) {
        // We just showed all, so next action is "hide"
        btn.classList.add('tools-visible');
        cmd.textContent = 'hide --all';
    } else {
        // We just hid all, so next action is "show"
        btn.classList.remove('tools-visible');
        cmd.textContent = 'show --all';
    }
    
    saveToolVisibility();
    updateVisibleToolCount();
}

// NOTE (DT-046): the old destructive category/user-type filter system
// (filterByCategory/filterByUserType/toggleFilterMode) was removed; the
// command-bar pill system (filterByCat) is the single filter system now.

// Update toggle all button text
function updateToggleAllButton() {
    const checkboxes = document.querySelectorAll('[id^="toggle-"]');
    const btn = document.getElementById('toggleAllBtn');
    const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
    
    if (btn) {
        const cmd = document.getElementById('termCommand');
        
        if (cmd) {
            if (anyUnchecked) {
                btn.classList.remove('tools-visible');
                cmd.textContent = 'show --all';
            } else {
                btn.classList.add('tools-visible');
                cmd.textContent = 'hide --all';
            }
        }
    }
}

// Toggle individual tool visibility
function toggleToolVisibility(toolId) {
    const tool = document.getElementById(toolId);
    const checkbox = document.getElementById('toggle-' + toolId);
    
    if (tool && checkbox) {
        if (checkbox.checked) {
            tool.classList.remove('hidden');
        } else {
            tool.classList.add('hidden');
        }
        
        updateToggleAllButton();
        saveToolVisibility();
        updateVisibleToolCount();
    }
}

// Save tool visibility to localStorage
function saveToolVisibility() {
    const checkboxes = document.querySelectorAll('[id^="toggle-"]');
    const visibility = {};
    
    checkboxes.forEach(checkbox => {
        const toolId = checkbox.id.replace('toggle-', '');
        visibility[toolId] = checkbox.checked;
    });
    
    localStorage.setItem('toolVisibility', JSON.stringify(visibility));
}

// Load tool visibility from localStorage
function loadToolVisibility() {
    const saved = localStorage.getItem('toolVisibility');
    if (saved) {
        const visibility = JSON.parse(saved);
        Object.keys(visibility).forEach(toolId => {
            const checkbox = document.getElementById('toggle-' + toolId);
            const tool = document.getElementById(toolId);
            
            if (checkbox && tool) {
                checkbox.checked = visibility[toolId];
                if (!visibility[toolId]) {
                    tool.classList.add('hidden');
                }
            }
        });
    }
}

// ============================================
// DRAG AND DROP FUNCTIONALITY (Organize Mode)
// ============================================

let draggedElement = null;
let dropTarget = null;
let organizeMode = false;

function isOrganizeMode() {
    return organizeMode;
}

function initDragAndDrop() {
    const toolCards = document.querySelectorAll('.tool-card');

    toolCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragenter', handleDragEnter);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragleave', handleDragLeave);
    });

    // Default: drag disabled
    setCardsDraggable(false);
}

function setCardsDraggable(enabled) {
    document.querySelectorAll('.tool-card').forEach(card => {
        card.setAttribute('draggable', enabled ? 'true' : 'false');
    });
}

function toggleOrganizeMode(forceState) {
    organizeMode = typeof forceState === 'boolean' ? forceState : !organizeMode;
    localStorage.setItem('dt_organize_mode', organizeMode ? '1' : '0');

    const body = document.body;
    const toggle = document.getElementById('organizeModeToggle');
    const label = document.getElementById('organizeModeLabel');
    const resetBtn = document.getElementById('organizeResetBtn');

    if (organizeMode) {
        body.classList.add('organize-mode');
        if (toggle) toggle.checked = true;
        if (label) label.textContent = 'Organize ON';
        if (resetBtn) resetBtn.style.display = '';
        setCardsDraggable(true);
    } else {
        body.classList.remove('organize-mode');
        if (toggle) toggle.checked = false;
        if (label) label.textContent = 'Organize';
        if (resetBtn) {
            // Only show reset if there is a custom order saved
            resetBtn.style.display = localStorage.getItem('toolOrder') ? '' : 'none';
        }
        setCardsDraggable(false);
        // Clean up any lingering drag classes
        document.querySelectorAll('.tool-card').forEach(card => {
            card.classList.remove('dragging', 'drag-over');
        });
    }

    if (CONFIG.DEBUG) console.log('Organize mode:', organizeMode);
}

function initOrganizeMode() {
    // Organize mode is always OFF on page load (per ticket requirement)
    organizeMode = false;

    const resetBtn = document.getElementById('organizeResetBtn');
    // Show reset button only if a custom order exists
    if (resetBtn) {
        resetBtn.style.display = localStorage.getItem('toolOrder') ? '' : 'none';
    }
}

function handleDragStart(e) {
    if (!organizeMode) { e.preventDefault(); return; }
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.id);
}

function handleDragEnd() {
    this.classList.remove('dragging');

    document.querySelectorAll('.tool-card').forEach(card => {
        card.classList.remove('drag-over');
    });

    draggedElement = null;
    dropTarget = null;
}

function handleDragEnter(e) {
    if (!organizeMode) return;
    if (this !== draggedElement) {
        this.classList.add('drag-over');
        dropTarget = this;
    }
}

function handleDragOver(e) {
    if (!organizeMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragLeave(e) {
    if (e.target === this) {
        this.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    if (!organizeMode) return;
    e.preventDefault();
    e.stopPropagation();

    this.classList.remove('drag-over');

    if (draggedElement && draggedElement !== this) {
        const grid = document.getElementById('toolsGrid');
        const allCards = Array.from(grid.children);
        const draggedIndex = allCards.indexOf(draggedElement);
        const targetIndex = allCards.indexOf(this);

        if (draggedIndex < targetIndex) {
            grid.insertBefore(draggedElement, this.nextSibling);
        } else {
            grid.insertBefore(draggedElement, this);
        }

        saveToolOrder();
        showToast('Card moved', 'success', 1500);

        if (CONFIG.DEBUG) console.log('Tool moved and saved!');
    }

    return false;
}

function saveToolOrder() {
    const grid = document.getElementById('toolsGrid');
    const order = Array.from(grid.children).map(card => card.id);
    localStorage.setItem('toolOrder', JSON.stringify(order));

    // Show reset button since we now have a custom order
    const resetBtn = document.getElementById('organizeResetBtn');
    if (resetBtn) resetBtn.style.display = '';

    if (CONFIG.DEBUG) console.log('Saved order:', order);
}

function loadToolOrder() {
    const savedOrder = localStorage.getItem('toolOrder');

    if (savedOrder) {
        try {
            const order = JSON.parse(savedOrder);
            const grid = document.getElementById('toolsGrid');

            if (CONFIG.DEBUG) console.log('Loading saved order:', order);

            order.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    grid.appendChild(element);
                }
            });
        } catch (e) {
            console.error('Error loading tool order:', e);
        }
    }
}

function resetLayout() {
    localStorage.removeItem('toolOrder');
    toggleOrganizeMode(false);
    location.reload();
}

// ============================================
// THEME SWITCHING FUNCTIONALITY
// ============================================

const themes = {
    'dark': {
        primaryStart: '#F2C200',
        primaryEnd: '#e6b800',
        primary: '#F2C200',
        cardBg: 'rgba(21, 26, 34, 0.70)',
        bgStart: '#0F1114',
        bgEnd: '#0B0D10',
        textPrimary: '#E9EEF5',
        textSecondary: '#B8C0CC',
        border: '#232A35',
        inputBg: '#10141A',
        outputBg: '#10141A'
    },
    'light': {
        primaryStart: '#F2C200',
        primaryEnd: '#e6b800',
        primary: '#0F1114',
        cardBg: '#ffffff',
        bgStart: '#F0F2F5',
        bgEnd: '#E8EAEF',
        textPrimary: '#0F1114',
        textSecondary: '#555',
        border: '#D0D5DD',
        inputBg: '#ffffff',
        outputBg: '#F8F9FB'
    }
};

function changeTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--primary-gradient-start', theme.primaryStart);
    root.style.setProperty('--primary-gradient-end', theme.primaryEnd);
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--card-background', theme.cardBg);
    root.style.setProperty('--background-gradient-start', theme.bgStart);
    root.style.setProperty('--background-gradient-end', theme.bgEnd);
    root.style.setProperty('--text-primary', theme.textPrimary);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--border-color', theme.border);
    root.style.setProperty('--input-background', theme.inputBg);
    root.style.setProperty('--output-background', theme.outputBg);

    localStorage.setItem('selectedTheme', themeName);
    
    if (themeName === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }

    var btn = document.getElementById('themeToggleBtn');
    if (btn) { btn.classList.toggle('is-light', themeName === 'light'); }
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('selectedTheme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    changeTheme(newTheme);
}

// ============================================
// SITE INFO SECTION
// ============================================

function toggleSiteInfo() {
    const content = document.getElementById('siteInfoContent');
    const toggle = document.getElementById('siteInfoToggle');
    
    if (content && toggle) {
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            toggle.classList.remove('expanded');
            toggle.textContent = '+';
        } else {
            content.classList.add('expanded');
            toggle.classList.add('expanded');
            toggle.textContent = '+';
        }
        content.inert = !content.classList.contains('expanded');
        document.querySelector('[aria-controls="siteInfoContent"]').setAttribute('aria-expanded', String(!content.inert));
    }
}

function toggleFAQSection() {
    const container = document.getElementById('faqQuestionsContainer');
    const toggle = document.getElementById('faqSectionToggle');
    
    if (container && toggle) {
        if (container.classList.contains('expanded')) {
            container.classList.remove('expanded');
            toggle.classList.remove('expanded');
            toggle.textContent = '+';
        } else {
            container.classList.add('expanded');
            toggle.classList.add('expanded');
            toggle.textContent = '+';
        }
        container.inert = !container.classList.contains('expanded');
        document.querySelector('[aria-controls="faqQuestionsContainer"]').setAttribute('aria-expanded', String(!container.inert));
    }
}

function toggleFAQ(questionNumber) {
    const answer = document.getElementById('faqAnswer' + questionNumber);
    const toggle = document.getElementById('faqToggle' + questionNumber);
    
    if (answer && toggle) {
        if (answer.classList.contains('expanded')) {
            answer.classList.remove('expanded');
            toggle.classList.remove('expanded');
            toggle.textContent = '+';
        } else {
            answer.classList.add('expanded');
            toggle.classList.add('expanded');
            toggle.textContent = '+';
        }
    }
}

function clearLocalSettings() {
    if (confirm('This will clear all saved settings including tool visibility, layout order, and theme preferences. Continue?')) {
        localStorage.clear();
        showToast('All settings cleared! Reloading...', 'success', 2000);
        setTimeout(() => window.location.reload(), 1500);
    }
}

// ============================================
// CONTACT FORM
// ============================================

// Handle contact form submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Anti-spam checks
        const honeypot = document.getElementById('contactHoneypot').value;
        if (honeypot) {
            if (CONFIG.DEBUG) console.log('Spam detected (honeypot)');
            return;
        }
        
        const loadTime = document.getElementById('formLoadTime').value;
        const submitTime = Date.now();
        if (submitTime - loadTime < 3000) {
            showToast('Please wait a moment before submitting.', 'error');
            return;
        }
        
        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const message = document.getElementById('contactMessage').value;
        const statusDiv = document.getElementById('contactFormStatus');
        
        try {
            const response = await fetch('https://api.ducktyped.xyz/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    source: 'footer',
                    name: name,
                    email: email,
                    message: message,
                    _honey: honeypot,
                    _loadtime: loadTime
                })
            });
            
            if (response.ok) {
                statusDiv.textContent = '✓ Message sent successfully!';
                statusDiv.style.color = 'var(--success-color)';
                statusDiv.style.display = 'block';
                contactForm.reset();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            statusDiv.textContent = '✗ Failed to send message. Please try again.';
            statusDiv.style.color = 'var(--error-color)';
            statusDiv.style.display = 'block';
        }
    });
}

// ============================================
// CONSOLE MESSAGE (debug only)
// ============================================
if (CONFIG.DEBUG) {
    console.log('%c🦆 duckTyped v3.0', 'color: #F2C200; font-size: 16px; font-weight: bold;');
    console.log('%cWorker URL: ' + (WORKER_URL || 'Not configured'), 'color: #9a95a9;');
    console.log('%cType showAPIUsage() to see API statistics', 'color: #fdd207;');
}

// ============================================
// COMMAND BAR: SEARCH
// ============================================
window.addEventListener('DOMContentLoaded', function() {
    const toolSearchInput = document.getElementById('toolSearch');
    if (!toolSearchInput) return;

    let searchDebounceTimeout;
    toolSearchInput.addEventListener('input', function(e) {
        clearTimeout(searchDebounceTimeout);
        searchDebounceTimeout = setTimeout(() => {
        const query = e.target.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.tool-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const keywords = (card.dataset.keywords || '').toLowerCase();
            const title = (card.querySelector('h2')?.textContent || '').toLowerCase();
            const desc = (card.querySelector('.tool-description')?.textContent || '').toLowerCase();
            const match = !query || keywords.includes(query) || title.includes(query) || desc.includes(query);

            if (card.classList.contains('preset-hidden')) {
                // Skip cards hidden by preset filter
            } else if (match && !card.classList.contains('hidden')) {
                card.classList.remove('search-hidden');
                visibleCount++;
            } else if (!match) {
                card.classList.add('search-hidden');
            } else {
                // Card is hidden by toggle, don't count it
            }
        });

        // Update tool count badge
        setToolCountBadge(visibleCount);

        // Show/hide no results
        const noResults = document.getElementById('noResults');
        if (noResults) {
            noResults.classList.toggle('visible', visibleCount === 0 && query.length > 0);
            if (visibleCount === 0 && query.length > 0) {
                const noResultsDesc = document.getElementById('noResultsDesc');
                if (noResultsDesc) noResultsDesc.textContent = 'No tools match "' + query + '" — try a shorter term';
            }
        }

        // Update active filter bar
        updateActiveFilterBar(activeCategoryFilter, query);

        // Hide recent tools and discovery sections while searching
        const recentSection = document.getElementById('recentSection');
        if (recentSection) {
            const recent = JSON.parse(localStorage.getItem('qt_recent') || '[]');
            recentSection.style.display = query ? 'none' : (recent.length ? 'block' : 'none');
        }
        const popularSection = document.getElementById('popularSection');
        if (popularSection) popularSection.style.display = query ? 'none' : '';
        const trendingSection = document.getElementById('trendingSection');
        if (trendingSection) trendingSection.style.display = query ? 'none' : (trendingSection.dataset.hasItems ? '' : 'none');
        const catBrowse = document.getElementById('categoryBrowseSection');
        if (catBrowse) catBrowse.style.display = query ? 'none' : '';
        }, 150); // debounce delay
    });

    // Keyboard shortcut: / to focus search, Escape to clear
    document.addEventListener('keydown', function(e) {
        if (e.key === '/' && document.activeElement !== toolSearchInput
            && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
            e.preventDefault();
            toolSearchInput.focus();
        }
        if (e.key === 'Escape' && document.activeElement === toolSearchInput) {
            clearToolSearch();
            toolSearchInput.blur();
        }
    });

    // Initialize tool count
    setToolCountBadge(document.querySelectorAll('.tool-card:not(.hidden)').length);

    captureOriginalOrder();

    // ============================================
    // PRESET VIEW SYSTEM
    // ============================================
    (function initPresetView() {
        const params = new URLSearchParams(window.location.search);
        const preset = params.get('preset');
        if (!preset) return;

        // Handle favorites preset locally (no fetch needed)
        if (preset === 'favorites') {
            var favIds = getFavorites();
            var cards = document.querySelectorAll('.tool-card');
            var visibleCount = 0;
            cards.forEach(function(card) {
                if (favIds.includes(card.id)) {
                    visibleCount++;
                } else {
                    card.classList.add('preset-hidden');
                }
            });
            setToolCountBadge(visibleCount);
            var banner = document.getElementById('presetBanner');
            var label = document.getElementById('presetBannerLabel');
            if (banner) {
                banner.style.display = 'flex';
                if (label) label.textContent = 'Viewing Favorites (' + visibleCount + ' tools)';
            }
            if (visibleCount === 0) {
                var noResults = document.getElementById('noResults');
                if (noResults) noResults.classList.add('visible');
            }
            // Hide discovery sections
            var popSec = document.getElementById('popularSection');
            var catSec = document.getElementById('categoryBrowseSection');
            var trendSec = document.getElementById('trendingSection');
            if (popSec) popSec.style.display = 'none';
            if (catSec) catSec.style.display = 'none';
            if (trendSec) trendSec.style.display = 'none';
            // Activate favorites pill
            var favPill = document.querySelector('.filter-pill[data-filter="favorites"]');
            document.querySelectorAll('.filter-pill').forEach(function(p) {
                p.classList.toggle('active', p === favPill);
                p.setAttribute('aria-pressed', String(p === favPill));
            });
            activeCategoryFilter = 'favorites';
            return;
        }

        fetch('/config/tool-presets.json')
            .then(function(res) { return res.json(); })
            .then(function(presets) {
                var toolIds = presets[preset];
                if (!toolIds || !Array.isArray(toolIds)) return;

                // Filter: hide all cards not in the preset
                var cards = document.querySelectorAll('.tool-card');
                var visibleCount = 0;
                cards.forEach(function(card) {
                    if (toolIds.includes(card.id)) {
                        visibleCount++;
                    } else {
                        card.classList.add('preset-hidden');
                    }
                });

                // Update tool count
                setToolCountBadge(visibleCount);

                // Show preset banner
                var banner = document.getElementById('presetBanner');
                var label = document.getElementById('presetBannerLabel');
                if (banner) {
                    banner.style.display = 'flex';
                    if (label) {
                        var name = preset.charAt(0).toUpperCase() + preset.slice(1);
                        label.textContent = 'Preset View: ' + name + ' Tools';
                    }
                }

                // Show no-results if preset is empty or has only placeholder
                if (visibleCount === 0) {
                    var noResults = document.getElementById('noResults');
                    if (noResults) noResults.classList.add('visible');
                }
            })
            .catch(function() {
                // Silently fail — show all tools if config cannot be loaded
            });
    })();

    // Initialize recent tools
    renderRecentTools();

    // Scroll shadow + scroll-to-top
    const commandBar = document.getElementById('commandBar');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    window.addEventListener('scroll', function() {
        if (commandBar) commandBar.classList.toggle('scrolled', window.scrollY > 60);
        if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    });
});

function clearToolSearch() {
    const input = document.getElementById('toolSearch');
    if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        input.focus();
    }
}

function clearAllFilters() {
    // Reset category filter to "All"
    const allPill = document.querySelector('.filter-pill');
    if (allPill) filterByCat(allPill, 'all');

    // Clear search input
    const input = document.getElementById('toolSearch');
    if (input && input.value) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
    }

    // Clear preset
    const params = new URLSearchParams(window.location.search);
    if (params.get('preset')) {
        window.history.replaceState({}, '', window.location.pathname);
        document.querySelectorAll('.tool-card').forEach(card => card.classList.remove('preset-hidden'));
        const banner = document.getElementById('presetBanner');
        if (banner) banner.style.display = 'none';
    }

    // Hide active filter bar
    updateActiveFilterBar('all', '');
}

function updateActiveFilterBar(category, searchQuery) {
    const bar = document.getElementById('activeFilterBar');
    const label = document.getElementById('activeFilterLabel');
    if (!bar || !label) return;

    const parts = [];
    if (category && category !== 'all') {
        var catNames = { network: 'Network', security: 'Security', email: 'Email', url: 'Web / URL', lookup: 'Lookup', qr: 'QR', dev: 'Dev', favorites: 'Favorites' };
        parts.push('Category: ' + (catNames[category] || category));
    }
    if (searchQuery) {
        parts.push('Search: "' + searchQuery + '"');
    }

    if (parts.length > 0) {
        label.textContent = parts.join('  |  ');
        bar.style.display = 'flex';
    } else {
        bar.style.display = 'none';
    }
}

// ============================================
// COMMAND BAR: CATEGORY FILTER PILLS
// ============================================
let activeCategoryFilter = 'all';

function filterByCat(btn, category) {
    activeCategoryFilter = category;

    // Update pill styles
    document.querySelectorAll('.filter-pill').forEach(p => {
        p.classList.toggle('active', p === btn);
        p.setAttribute('aria-pressed', String(p === btn));
    });

    // Update category browse card active states
    document.querySelectorAll('.cat-browse-card').forEach(c => {
        c.classList.toggle('active', c.dataset.cat === category);
    });

    // Hide discovery sections when filtering
    const popularSection = document.getElementById('popularSection');
    const catBrowse = document.getElementById('categoryBrowseSection');
    const trendingSec = document.getElementById('trendingSection');
    const recentSec = document.getElementById('recentSection');
    if (popularSection) popularSection.style.display = category === 'all' ? '' : 'none';
    if (catBrowse) catBrowse.style.display = category === 'all' ? '' : 'none';
    if (trendingSec) trendingSec.style.display = category === 'all' ? (trendingSec.dataset.hasItems ? '' : 'none') : 'none';
    if (recentSec) {
        var recent = JSON.parse(localStorage.getItem('qt_recent') || '[]');
        recentSec.style.display = category === 'all' ? (recent.length ? 'block' : 'none') : 'none';
    }

    const cards = document.querySelectorAll('.tool-card');
    let visibleCount = 0;
    const favorites = category === 'favorites' ? getFavorites() : null;

    cards.forEach(card => {
        if (card.classList.contains('preset-hidden')) return;
        const cardCategories = (card.dataset.categories || '').split(',');
        const matchesCategory = category === 'all' || (category === 'favorites' ? favorites.includes(card.id) : cardCategories.includes(category));

        if (matchesCategory && !card.classList.contains('hidden')) {
            card.classList.remove('search-hidden');
            visibleCount++;
        } else if (!matchesCategory) {
            card.classList.add('search-hidden');
        }
    });

    // Re-apply search filter on top of category filter
    const searchInput = document.getElementById('toolSearch');
    if (searchInput && searchInput.value.trim()) {
        const query = searchInput.value.toLowerCase().trim();
        document.querySelectorAll('.tool-card:not(.search-hidden)').forEach(card => {
            const keywords = (card.dataset.keywords || '').toLowerCase();
            const title = (card.querySelector('h2')?.textContent || '').toLowerCase();
            if (!keywords.includes(query) && !title.includes(query)) {
                card.classList.add('search-hidden');
                visibleCount--;
            }
        });
    }

    // Update count
    setToolCountBadge(visibleCount);

    // No results with context-aware message
    const noResults = document.getElementById('noResults');
    if (noResults) {
        noResults.classList.toggle('visible', visibleCount === 0);
        if (visibleCount === 0) {
            const noResultsDesc = document.getElementById('noResultsDesc');
            if (noResultsDesc) {
                if (category === 'favorites') {
                    noResultsDesc.textContent = 'No favorites yet — toggle the switch on any tool card to add it';
                } else {
                    const searchVal = searchInput ? searchInput.value.trim() : '';
                    noResultsDesc.textContent = searchVal
                        ? 'No tools match "' + searchVal + '" in this category'
                        : 'No tools in this category';
                }
            }
        }
    }

    // Update active filter bar
    updateActiveFilterBar(category, searchInput ? searchInput.value.trim() : '');
}

// ============================================
// BROWSE BY CATEGORY (Category Browse Cards)
// ============================================
function browseCat(category) {
    // Find the matching filter pill in the command bar
    const pills = document.querySelectorAll('.filter-pill');
    let targetPill = null;
    pills.forEach(p => {
        if (p.getAttribute('onclick')?.includes("'" + category + "'")) targetPill = p;
    });
    if (targetPill) {
        filterByCat(targetPill, category);
        // The browse card is hidden by the filter; retain a visible focus target.
        targetPill.focus({ preventScroll: true });
    }
    // Scroll to the tools grid
    const grid = document.getElementById('toolsGrid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// SCROLL TO TOOL (Popular Tools section)
// ============================================
function scrollToTool(toolId) {
    const el = document.getElementById(toolId);
    if (!el) return;
    // Reset category filter to "all" so the tool is visible
    const allPill = document.querySelector('.filter-pill');
    if (allPill && activeCategoryFilter !== 'all') filterByCat(allPill, 'all');
    // Ensure tool is not hidden
    el.classList.remove('search-hidden', 'hidden');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Brief highlight
    el.style.boxShadow = '0 0 0 2px var(--primary-color), 0 0 24px rgba(242, 194, 0, 0.15)';
    setTimeout(() => { el.style.boxShadow = ''; }, 2000);
}

// ============================================
// SORT TOOLS
// ============================================
let originalToolOrder = [];

function captureOriginalOrder() {
    const grid = document.getElementById('toolsGrid');
    if (grid) {
        originalToolOrder = Array.from(grid.children).map(el => el.id);
    }
}

function sortTools(mode) {
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.tool-card'));

    if (originalToolOrder.length === 0) captureOriginalOrder();

    switch (mode) {
        case 'az':
            cards.sort((a, b) => {
                const nameA = (a.querySelector('h2')?.textContent || '').toLowerCase();
                const nameB = (b.querySelector('h2')?.textContent || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            break;
        case 'za':
            cards.sort((a, b) => {
                const nameA = (a.querySelector('h2')?.textContent || '').toLowerCase();
                const nameB = (b.querySelector('h2')?.textContent || '').toLowerCase();
                return nameB.localeCompare(nameA);
            });
            break;
        case 'recent':
            const recent = JSON.parse(localStorage.getItem('qt_recent') || '[]');
            cards.sort((a, b) => {
                const aIdx = recent.indexOf(a.id);
                const bIdx = recent.indexOf(b.id);
                if (aIdx === -1 && bIdx === -1) return 0;
                if (aIdx === -1) return 1;
                if (bIdx === -1) return -1;
                return aIdx - bIdx;
            });
            break;
        case 'default':
        default:
            cards.sort((a, b) => {
                return originalToolOrder.indexOf(a.id) - originalToolOrder.indexOf(b.id);
            });
            break;
    }

    cards.forEach(card => grid.appendChild(card));
}

// ============================================
// RECENT TOOLS TRACKING
// ============================================
function trackRecentTool(toolId) {
    let recent = JSON.parse(localStorage.getItem('qt_recent') || '[]');
    recent = recent.filter(id => id !== toolId);
    recent.unshift(toolId);
    recent = recent.slice(0, 6);
    localStorage.setItem('qt_recent', JSON.stringify(recent));
    renderRecentTools();

    // Track usage count for popular tools ranking
    try {
        var usage = JSON.parse(localStorage.getItem('dt_tool_usage') || '{}');
        usage[toolId] = (usage[toolId] || 0) + 1;
        localStorage.setItem('dt_tool_usage', JSON.stringify(usage));
    } catch (e) {}

    // Send anonymous tool run beacon
    if (typeof dtBeacon === 'function') dtBeacon('tool_run', toolId);

    // Track timestamped usage for trending (last 100 entries)
    try {
        var log = JSON.parse(localStorage.getItem('dt_usage_log') || '[]');
        log.push({ id: toolId, ts: Date.now() });
        if (log.length > 100) log = log.slice(-100);
        localStorage.setItem('dt_usage_log', JSON.stringify(log));
        renderTrendingTools();
    } catch (e) {}

    renderPopularTools();
}

function renderRecentTools() {
    const section = document.getElementById('recentSection');
    const row = document.getElementById('recentRow');
    if (!section || !row) return;

    const recent = JSON.parse(localStorage.getItem('qt_recent') || '[]');
    if (!recent.length) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    row.innerHTML = '';

    recent.forEach(toolId => {
        const card = document.getElementById(toolId);
        if (!card) return;

        const name = card.querySelector('h2')?.textContent || toolId;
        const cats = (card.dataset.categories || '').split(',');
        const icon = categoryIcons[cats[0]] || '🔧';

        const chip = document.createElement('div');
        chip.className = 'recent-tool-chip';
        chip.onclick = function() {
            // Reset category filter to all so the card is visible
            const allPill = document.querySelector('.filter-pill');
            if (allPill && activeCategoryFilter !== 'all') filterByCat(allPill, 'all');
            // Clear search
            const searchInput = document.getElementById('toolSearch');
            if (searchInput && searchInput.value) clearToolSearch();
            // Scroll to card
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.borderColor = 'rgba(242, 194, 0, 0.5)';
            card.style.boxShadow = '0 0 24px rgba(242, 194, 0, 0.15)';
            setTimeout(function() {
                card.style.borderColor = '';
                card.style.boxShadow = '';
            }, 1500);
        };
        chip.innerHTML = '<span class="chip-dot"></span>' +
            '<span class="chip-icon">' + icon + '</span>' +
            '<span class="chip-name">' + name + '</span>';
        row.appendChild(chip);
    });

    // Toggle fade indicator if chips overflow the row
    requestAnimationFrame(function() {
        section.classList.toggle('has-overflow', row.scrollWidth > row.clientWidth);
    });
}

function clearRecentTools() {
    localStorage.removeItem('qt_recent');
    renderRecentTools();
}

// ============================================
// POPULAR TOOLS (ranked by usage count)
// ============================================
var POPULAR_DEFAULTS = [
    { id: 'dnsChecker', name: 'DNS Record Checker', desc: 'A, AAAA, MX, TXT, SPF, DKIM' },
    { id: 'sslChecker', name: 'SSL Certificate Checker', desc: 'Validate certs & expiry dates' },
    { id: 'passwordGen', name: 'Password Generator', desc: 'Secure random passwords' },
    { id: 'whoisChecker', name: 'WHOIS / IP Lookup', desc: 'Domain & IP registration info' },
    { id: 'jsonFormatter', name: 'JSON Formatter', desc: 'Format, validate & minify' },
    { id: 'portScanner', name: 'Port Scanner', desc: 'Check open ports & services' }
];

var categoryIcons = {
    'security': '🔒', 'network': '🌐', 'email': '📧',
    'url': '🔗', 'qr': '📱', 'lookup': '🔍', 'web': '🔗',
    'encoding': '🔧', 'ai': '🤖', 'dev': '🛠️'
};

function getToolMeta(toolId) {
    var card = document.getElementById(toolId);
    if (!card) return null;
    var name = card.querySelector('h2')?.textContent || toolId;
    var desc = card.querySelector('p')?.textContent || '';
    var cats = (card.dataset.categories || '').split(',');
    var icon = categoryIcons[cats[0]] || '🔧';
    return { id: toolId, name: name, desc: desc, icon: icon };
}

function renderPopularTools() {
    var grid = document.querySelector('#popularSection .popular-tools-grid');
    if (!grid) return;

    var usage = {};
    try { usage = JSON.parse(localStorage.getItem('dt_tool_usage') || '{}'); } catch (e) {}

    // Build ranked list from usage data
    var ranked = Object.keys(usage)
        .map(function(id) { return { id: id, count: usage[id] }; })
        .sort(function(a, b) { return b.count - a.count; })
        .slice(0, 6);

    // Fall back to defaults if not enough data
    if (ranked.length < 3) {
        renderPopularFromList(grid, POPULAR_DEFAULTS);
        return;
    }

    var items = [];
    ranked.forEach(function(r) {
        var meta = getToolMeta(r.id);
        if (meta) items.push(meta);
    });

    // Pad with defaults if needed
    if (items.length < 6) {
        var seen = {};
        items.forEach(function(i) { seen[i.id] = true; });
        POPULAR_DEFAULTS.forEach(function(d) {
            if (!seen[d.id] && items.length < 6) {
                var meta = getToolMeta(d.id);
                if (meta) items.push(meta);
            }
        });
    }

    renderPopularFromList(grid, items);
}

function renderPopularFromList(grid, items) {
    grid.innerHTML = '';
    items.forEach(function(item) {
        var meta = getToolMeta(item.id);
        var icon = meta ? meta.icon : '🔧';
        var name = meta ? meta.name : item.name;
        var desc = meta ? (meta.desc.length > 50 ? meta.desc.substring(0, 50) + '...' : meta.desc) : item.desc;

        var a = document.createElement('a');
        a.className = 'popular-tool-card';
        a.href = 'javascript:void(0)';
        a.onclick = function() { scrollToTool(item.id); };
        a.innerHTML = '<span class="pop-icon">' + icon + '</span>' +
            '<div class="pop-info">' +
                '<span class="pop-name">' + name + '</span>' +
                '<span class="pop-desc">' + desc + '</span>' +
            '</div>';
        grid.appendChild(a);
    });
}

// ============================================
// TRENDING TOOLS (most used in last 7 days)
// ============================================
function renderTrendingTools() {
    var section = document.getElementById('trendingSection');
    if (!section) return;

    var log = [];
    try { log = JSON.parse(localStorage.getItem('dt_usage_log') || '[]'); } catch (e) {}

    var sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    var recentLog = log.filter(function(entry) { return entry.ts >= sevenDaysAgo; });

    if (recentLog.length < 3) {
        section.style.display = 'none';
        return;
    }

    // Count frequency in the recent window
    var freq = {};
    recentLog.forEach(function(entry) {
        freq[entry.id] = (freq[entry.id] || 0) + 1;
    });

    var trending = Object.keys(freq)
        .map(function(id) { return { id: id, count: freq[id] }; })
        .sort(function(a, b) { return b.count - a.count; })
        .slice(0, 5);

    var row = section.querySelector('.trending-tools-row');
    if (!row) return;

    row.innerHTML = '';
    var hasItems = false;

    trending.forEach(function(t) {
        var meta = getToolMeta(t.id);
        if (!meta) return;
        hasItems = true;

        var chip = document.createElement('div');
        chip.className = 'trending-tool-chip';
        chip.onclick = function() {
            var allPill = document.querySelector('.filter-pill');
            if (allPill && activeCategoryFilter !== 'all') filterByCat(allPill, 'all');
            var searchInput = document.getElementById('toolSearch');
            if (searchInput && searchInput.value) clearToolSearch();
            var card = document.getElementById(t.id);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.style.borderColor = 'rgba(242, 194, 0, 0.5)';
                card.style.boxShadow = '0 0 24px rgba(242, 194, 0, 0.15)';
                setTimeout(function() {
                    card.style.borderColor = '';
                    card.style.boxShadow = '';
                }, 1500);
            }
        };
        chip.innerHTML = '<span class="trending-icon">🔥</span>' +
            '<span class="chip-icon">' + meta.icon + '</span>' +
            '<span class="chip-name">' + meta.name + '</span>' +
            '<span class="trending-count">' + t.count + '</span>';
        row.appendChild(chip);
    });

    section.dataset.hasItems = hasItems ? '1' : '';
    section.style.display = hasItems ? 'block' : 'none';
}

// Track recent tool usage when buttons inside tool cards are clicked
document.addEventListener('click', function(e) {
    const card = e.target.closest('.tool-card');
    if (card && card.id) {
        const tag = e.target.tagName;
        if (tag === 'BUTTON' || (tag === 'INPUT' && e.target.type === 'submit')) {
            trackRecentTool(card.id);
        }
    }
});

// ============================================
// FILTER & CUSTOMIZE TOGGLE (matching Site Info style)
// ============================================
function toggleFilterCustomize() {
    const content = document.getElementById('filterContent');
    const toggle = document.getElementById('filterCustomizeToggle');
    if (!content || !toggle) return;

    content.classList.toggle('expanded');
    toggle.classList.toggle('expanded');
    content.inert = !content.classList.contains('expanded');
    document.querySelector('[aria-controls="filterContent"]').setAttribute('aria-expanded', String(!content.inert));
}

// ============================================
// FAVORITES SYSTEM
// ============================================
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('dt_favorites') || '[]');
    } catch (e) {
        return [];
    }
}

function saveFavorites(favorites) {
    localStorage.setItem('dt_favorites', JSON.stringify(favorites));
}

function toggleFavorite(toolId, e) {
    if (e) e.stopPropagation();
    let favorites = getFavorites();
    const idx = favorites.indexOf(toolId);
    if (idx === -1) {
        favorites.push(toolId);
    } else {
        favorites.splice(idx, 1);
    }
    saveFavorites(favorites);

    // Update toggle state
    const cb = document.querySelector('#' + toolId + ' .fav-switch input');
    if (cb) {
        cb.checked = idx === -1;
        var lbl = document.querySelector('#' + toolId + ' .fav-label');
        if (lbl) lbl.textContent = cb.checked ? 'Favorited' : 'Favorite';
    }

    // Update favorites pill count
    updateFavoritePillCount();

    // If currently viewing favorites, re-filter
    if (activeCategoryFilter === 'favorites') {
        filterByCat(document.querySelector('.filter-pill[data-filter="favorites"]'), 'favorites');
    }
}

function updateFavoritePillCount() {
    const pill = document.querySelector('.filter-pill[data-filter="favorites"]');
    if (!pill) return;
    const count = getFavorites().length;
    pill.textContent = count > 0 ? '\u2605 Favorites (' + count + ')' : '\u2605 Favorites';
}

function initFavoriteButtons() {
    const favorites = getFavorites();
    const cards = document.querySelectorAll('.tool-card');

    cards.forEach(function(card) {
        // Create favorite toggle at bottom of card
        const wrap = document.createElement('div');
        wrap.className = 'fav-toggle';

        const isFav = favorites.includes(card.id);
        const label = document.createElement('label');
        label.className = 'fav-switch';
        label.setAttribute('title', 'Toggle favorite');
        label.innerHTML =
            '<input type="checkbox"' + (isFav ? ' checked' : '') + '>' +
            '<span class="fav-track"><span class="fav-thumb"></span></span>' +
            '<span class="fav-label">' + (isFav ? 'Favorited' : 'Favorite') + '</span>';
        label.querySelector('input').onchange = function(e) {
            toggleFavorite(card.id, e);
            label.querySelector('.fav-label').textContent =
                this.checked ? 'Favorited' : 'Favorite';
        };

        wrap.appendChild(label);
        card.appendChild(wrap);
    });

    updateFavoritePillCount();
}

// Hook into DOMContentLoaded to init favorites + popular/trending
window.addEventListener('DOMContentLoaded', function() {
    initFavoriteButtons();
    renderPopularTools();
    renderTrendingTools();
});
