// ============================================
// DUCKTYPED — GLOBAL SITE SEARCH
// Client-side search across tools, learn, errors
// Loaded by standalone-init.js and utility/index.html
// ============================================

(function () {
    'use strict';

    var INDEX_URL = '/site-search.json';
    var MAX_RESULTS = 12;
    var MAX_PER_GROUP = 4;
    var searchIndex = null;
    var fetchPromise = null;
    var activeIdx = -1;

    // ── Inject search HTML into the nav ──────────────────────────────────────

    function injectSearchBar() {
        var navInner = document.querySelector('.unified-nav-inner');
        if (!navInner || document.getElementById('navSearchWrap')) return;

        var themeBtn = navInner.querySelector('.theme-toggle-btn');

        var wrap = document.createElement('div');
        wrap.id = 'navSearchWrap';
        wrap.className = 'nav-search-wrap';
        wrap.setAttribute('role', 'search');
        wrap.innerHTML =
            '<button class="nav-search-icon-btn" id="navSearchToggle" aria-label="Search site" type="button">' +
                '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<circle cx="9" cy="9" r="7"/><line x1="15" y1="15" x2="19" y2="19"/>' +
                '</svg>' +
            '</button>' +
            '<input class="nav-search-input" id="navSearchInput" type="search" ' +
                'placeholder="Search tools, errors, docs..." autocomplete="off" ' +
                'aria-label="Search tools, errors, and documentation" aria-autocomplete="list" ' +
                'aria-controls="navSearchDropdown" aria-expanded="false" spellcheck="false">' +
            '<div class="nav-search-dropdown" id="navSearchDropdown" role="listbox" aria-label="Search results" hidden></div>';

        if (themeBtn) {
            navInner.insertBefore(wrap, themeBtn);
        } else {
            navInner.appendChild(wrap);
        }

        attachEvents(wrap);
    }

    // ── Lazy-load the search index ────────────────────────────────────────────

    function loadIndex() {
        if (searchIndex) return Promise.resolve(searchIndex);
        if (fetchPromise) return fetchPromise;
        fetchPromise = fetch(INDEX_URL)
            .then(function (r) { return r.json(); })
            .then(function (data) { searchIndex = data; return data; })
            .catch(function () { searchIndex = []; return []; });
        return fetchPromise;
    }

    // ── Scoring ───────────────────────────────────────────────────────────────

    function scoreEntry(entry, q) {
        var score = 0;
        var title = entry.title.toLowerCase();
        var desc = entry.description.toLowerCase();
        var kws = entry.keywords || [];
        var aliases = entry.aliases || [];
        var category = (entry.category || '').toLowerCase();

        // Full query matching against title
        if (title === q) { score += 30; }
        else if (title.startsWith(q)) { score += 18; }
        else if (title.includes(q)) { score += 12; }

        // Description match
        if (desc.includes(q)) { score += 3; }

        // Category match
        if (category && category.includes(q)) { score += 6; }

        // Keyword matching
        for (var i = 0; i < kws.length; i++) {
            var kw = kws[i].toLowerCase();
            if (kw === q) { score += 15; }
            else if (kw.startsWith(q)) { score += 8; }
            else if (kw.includes(q)) { score += 5; }
            else if (q.length >= 3 && q.includes(kw) && kw.length >= 3) { score += 2; }
        }

        // Alias matching (common alternate names)
        for (var j = 0; j < aliases.length; j++) {
            var al = aliases[j].toLowerCase();
            if (al === q) { score += 20; }
            else if (al.startsWith(q)) { score += 12; }
            else if (al.includes(q)) { score += 6; }
        }

        // Multi-word query: score each word independently and add partial credit
        var words = q.split(/\s+/);
        if (words.length > 1) {
            var wordHits = 0;
            for (var w = 0; w < words.length; w++) {
                var word = words[w];
                if (word.length < 2) continue;
                var wordFound = false;
                if (title.includes(word)) { wordFound = true; }
                if (desc.includes(word)) { wordFound = true; }
                if (category.includes(word)) { wordFound = true; }
                for (var k = 0; k < kws.length; k++) {
                    if (kws[k].toLowerCase().includes(word)) { wordFound = true; break; }
                }
                for (var a = 0; a < aliases.length; a++) {
                    if (aliases[a].toLowerCase().includes(word)) { wordFound = true; break; }
                }
                if (wordFound) wordHits++;
            }
            // Bonus based on how many query words matched
            if (wordHits > 0) {
                var wordRatio = wordHits / words.length;
                score += Math.round(wordRatio * 10);
            }
        }

        // Type boost so tools rank above error pages for generic queries
        if (score > 0) {
            if (entry.type === 'tool') { score += 10; }
            else if (entry.type === 'category') { score += 8; }
            else if (entry.type === 'learn') { score += 5; }
        }

        return score;
    }

    function search(query) {
        if (!searchIndex || !query) return [];
        var q = query.trim().toLowerCase();
        if (q.length < 1) return [];

        var results = [];
        for (var i = 0; i < searchIndex.length; i++) {
            var s = scoreEntry(searchIndex[i], q);
            if (s > 0) results.push({ entry: searchIndex[i], score: s });
        }
        results.sort(function (a, b) { return b.score - a.score; });
        return results;
    }

    // ── Group results by type ────────────────────────────────────────────────

    var TYPE_ORDER = ['tool', 'category', 'learn', 'error'];
    var TYPE_LABELS = { tool: 'Tools', learn: 'Learn', error: 'Errors', category: 'Categories' };
    var TYPE_LABEL_SINGULAR = { tool: 'Tool', learn: 'Learn', error: 'Error', category: 'Category' };

    function groupResults(scored) {
        var groups = {};
        var totalShown = 0;

        for (var i = 0; i < scored.length; i++) {
            var type = scored[i].entry.type || 'tool';
            if (!groups[type]) groups[type] = [];
            if (groups[type].length < MAX_PER_GROUP && totalShown < MAX_RESULTS) {
                groups[type].push(scored[i]);
                totalShown++;
            }
        }

        // Return in defined order
        var ordered = [];
        for (var t = 0; t < TYPE_ORDER.length; t++) {
            var key = TYPE_ORDER[t];
            if (groups[key] && groups[key].length > 0) {
                ordered.push({ type: key, items: groups[key] });
            }
        }
        return ordered;
    }

    // ── Rendering ─────────────────────────────────────────────────────────────

    function highlightMatch(text, query) {
        if (!query || query.length < 2) return escHtml(text);
        var words = query.toLowerCase().split(/\s+/).filter(function (w) { return w.length >= 2; });
        var escaped = escHtml(text);
        for (var i = 0; i < words.length; i++) {
            var pattern = escHtml(words[i]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            var re = new RegExp('(' + pattern + ')', 'gi');
            escaped = escaped.replace(re, '<mark class="nav-search-hl">$1</mark>');
        }
        return escaped;
    }

    function renderDropdown(scored, query) {
        var dropdown = document.getElementById('navSearchDropdown');
        var input = document.getElementById('navSearchInput');
        if (!dropdown || !input) return;

        activeIdx = -1;

        if (!scored.length) {
            dropdown.innerHTML =
                '<div class="nav-search-empty">' +
                    '<div class="nav-search-empty-icon">&#128269;</div>' +
                    '<div>No results for &ldquo;' + escHtml(query) + '&rdquo;</div>' +
                    '<div class="nav-search-empty-hint">Try a shorter term or different keywords</div>' +
                '</div>';
            dropdown.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            reportSearchMiss(query);
            return;
        }
        clearTimeout(missTimer);

        var groups = groupResults(scored);
        var html = '';
        var itemIndex = 0;

        for (var g = 0; g < groups.length; g++) {
            var group = groups[g];
            var groupLabel = TYPE_LABELS[group.type] || group.type;
            html += '<div class="nav-search-group">' +
                '<div class="nav-search-group-label">' + escHtml(groupLabel) + '</div>';

            for (var i = 0; i < group.items.length; i++) {
                var r = group.items[i].entry;
                var badge = TYPE_LABEL_SINGULAR[r.type] || r.type;
                html +=
                    '<a class="nav-search-item" href="' + escAttr(r.url) + '" role="option" ' +
                        'data-idx="' + itemIndex + '" tabindex="-1">' +
                        '<span class="nav-search-badge nav-search-badge--' + escAttr(r.type) + '">' + escHtml(badge) + '</span>' +
                        '<span class="nav-search-item-body">' +
                            '<span class="nav-search-item-title">' + highlightMatch(r.title, query) + '</span>' +
                            '<span class="nav-search-item-desc">' + highlightMatch(r.description, query) + '</span>' +
                        '</span>' +
                    '</a>';
                itemIndex++;
            }
            html += '</div>';
        }

        // Summary footer
        var totalHits = scored.length;
        if (totalHits > itemIndex) {
            html += '<div class="nav-search-footer">' + totalHits + ' results found &mdash; showing top ' + itemIndex + '</div>';
        }

        dropdown.innerHTML = html;
        dropdown.hidden = false;
        input.setAttribute('aria-expanded', 'true');

        // Track search result clicks
        var items = dropdown.querySelectorAll('.nav-search-item');
        for (var k = 0; k < items.length; k++) {
            items[k].addEventListener('click', function() {
                if (typeof dtBeacon === 'function') dtBeacon('search', '', query);
            });
        }
    }

    // A search that finds nothing is the most useful thing a visitor can tell
    // us: it is a tool or guide we do not have. Report it only once typing has
    // settled, so half-typed words are not counted, and once per page.
    var missTimer = null;
    var reportedMisses = {};
    function reportSearchMiss(query) {
        clearTimeout(missTimer);
        var settled = (query || '').toLowerCase().trim();
        if (settled.length < 3 || reportedMisses[settled]) return;
        missTimer = setTimeout(function () {
            reportedMisses[settled] = true;
            if (typeof dtBeacon === 'function') dtBeacon('search_miss', '', settled);
        }, 2000);
    }

    function hideDropdown() {
        var dropdown = document.getElementById('navSearchDropdown');
        var input = document.getElementById('navSearchInput');
        if (dropdown) { dropdown.hidden = true; dropdown.innerHTML = ''; }
        if (input) { input.setAttribute('aria-expanded', 'false'); }
        activeIdx = -1;
    }

    // ── Keyboard navigation ───────────────────────────────────────────────────

    function moveActive(dir) {
        var dropdown = document.getElementById('navSearchDropdown');
        if (!dropdown || dropdown.hidden) return;
        var items = dropdown.querySelectorAll('.nav-search-item');
        if (!items.length) return;

        if (activeIdx >= 0) items[activeIdx].classList.remove('nav-search-item--active');

        activeIdx = activeIdx + dir;
        if (activeIdx < 0) activeIdx = items.length - 1;
        if (activeIdx >= items.length) activeIdx = 0;

        items[activeIdx].classList.add('nav-search-item--active');
        items[activeIdx].focus();
    }

    // ── Event wiring ──────────────────────────────────────────────────────────

    var debounceTimer = null;

    function attachEvents(wrap) {
        var input = document.getElementById('navSearchInput');
        var toggle = document.getElementById('navSearchToggle');
        var dropdown = document.getElementById('navSearchDropdown');

        // Mobile icon toggle
        toggle.addEventListener('click', function () {
            wrap.classList.toggle('nav-search-wrap--open');
            if (wrap.classList.contains('nav-search-wrap--open')) {
                input.focus();
                loadIndex();
            } else {
                hideDropdown();
            }
        });

        // Load index on focus
        input.addEventListener('focus', function () {
            loadIndex();
        });

        // Debounced search on input
        input.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            var val = input.value.trim();
            if (!val) { hideDropdown(); return; }
            debounceTimer = setTimeout(function () {
                loadIndex().then(function () {
                    var results = search(val);
                    renderDropdown(results, val);
                });
            }, 120);
        });

        // Keyboard nav
        input.addEventListener('keydown', function (e) {
            var dropdown = document.getElementById('navSearchDropdown');
            if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
            else if (e.key === 'Escape') {
                hideDropdown();
                wrap.classList.remove('nav-search-wrap--open');
                input.value = '';
                input.blur();
            } else if (e.key === 'Enter') {
                if (activeIdx >= 0 && dropdown && !dropdown.hidden) {
                    var items = dropdown.querySelectorAll('.nav-search-item');
                    if (items[activeIdx]) { e.preventDefault(); items[activeIdx].click(); }
                }
            }
        });

        // Keyboard nav from dropdown items back to input
        if (dropdown) {
            dropdown.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
                else if (e.key === 'Escape') {
                    hideDropdown();
                    wrap.classList.remove('nav-search-wrap--open');
                    input.value = '';
                    input.focus();
                }
            });
        }

        // Close on outside click
        document.addEventListener('click', function (e) {
            if (!wrap.contains(e.target)) {
                hideDropdown();
                if (!document.activeElement || !wrap.contains(document.activeElement)) {
                    wrap.classList.remove('nav-search-wrap--open');
                }
            }
        });

        // Global '/' shortcut to focus search (only on non-utility pages to avoid
        // conflicting with the existing tool search on the utility index)
        document.addEventListener('keydown', function (e) {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' &&
                    document.activeElement.tagName !== 'TEXTAREA' &&
                    !document.activeElement.isContentEditable &&
                    !document.body.classList.contains('has-tool-search')) {
                e.preventDefault();
                wrap.classList.add('nav-search-wrap--open');
                input.focus();
                loadIndex();
            }
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escAttr(str) {
        return String(str).replace(/"/g, '&quot;');
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    function init() {
        injectSearchBar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

}());
