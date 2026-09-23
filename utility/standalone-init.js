// ============================================
// DUCKTYPED — STANDALONE PAGE INIT
// Shared theme toggle, stubs for core.js dependencies
// Include this AFTER core.js on all standalone pages
// ============================================

// Theme definitions (must match ui.js)
var standaloneThemes = {
    'dark': {
        bgStart: '#0F1114', bgEnd: '#0B0D10',
        primary: '#F2C200', cardBg: 'rgba(21,26,34,0.70)',
        textPrimary: '#E9EEF5', textSecondary: '#B8C0CC',
        border: '#232A35', inputBg: '#10141A', outputBg: '#10141A'
    },
    'light': {
        bgStart: '#F0F2F5', bgEnd: '#E8EAEF',
        primary: '#0F1114', cardBg: '#ffffff',
        textPrimary: '#0F1114', textSecondary: '#555',
        border: '#D0D5DD', inputBg: '#ffffff', outputBg: '#F8F9FB'
    }
};

// Theme support
function changeTheme(theme) {
    var t = standaloneThemes[theme] || standaloneThemes['dark'];
    var root = document.documentElement;
    root.style.setProperty('--background-gradient-start', t.bgStart);
    root.style.setProperty('--background-gradient-end', t.bgEnd);
    root.style.setProperty('--primary-color', t.primary);
    root.style.setProperty('--card-background', t.cardBg);
    root.style.setProperty('--text-primary', t.textPrimary);
    root.style.setProperty('--text-secondary', t.textSecondary);
    root.style.setProperty('--border-color', t.border);
    root.style.setProperty('--input-background', t.inputBg);
    root.style.setProperty('--output-background', t.outputBg);

    if (theme === 'light') { document.body.classList.add('light-theme'); }
    else { document.body.classList.remove('light-theme'); }
    localStorage.setItem('selectedTheme', theme);
    var btn = document.getElementById('themeToggleBtn');
    if (btn) { btn.classList.toggle('is-light', theme === 'light'); }
}

function toggleTheme() {
    var isLight = document.body.classList.contains('light-theme');
    changeTheme(isLight ? 'dark' : 'light');
}

// Apply saved theme immediately
(function() { var saved = localStorage.getItem('selectedTheme'); if (saved) changeTheme(saved); })();

// Populate footer year (replaces document.write for better performance with deferred scripts)
(function() {
    var yearEls = document.querySelectorAll('.footer-year');
    var year = new Date().getFullYear();
    for (var i = 0; i < yearEls.length; i++) yearEls[i].textContent = year;
})();

// Stubs for functions that core.js DOMContentLoaded calls but don't exist on standalone pages
if (typeof initDragAndDrop === 'undefined') { window.initDragAndDrop = function() {}; }
if (typeof loadToolOrder === 'undefined') { window.loadToolOrder = function() {}; }
if (typeof initOrganizeMode === 'undefined') { window.initOrganizeMode = function() {}; }
if (typeof loadSavedNotes === 'undefined') { window.loadSavedNotes = function() {}; }
if (typeof initializeEncryptedNotes === 'undefined') { window.initializeEncryptedNotes = function() {}; }

// Load global site search (deferred until idle — non-critical for initial render)
(function() {
    function loadSearch() {
        var s = document.createElement('script');
        s.src = '/utility/site-search.js';
        s.defer = true;
        document.head.appendChild(s);
    }
    if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(loadSearch);
    } else {
        setTimeout(loadSearch, 300);
    }
})();

// ============================================
// DYNAMIC CONTENT STATISTICS
// Fetches site-search.json (cached by browser) and populates
// any element with a data-dt-count attribute. Also updates
// tool-page footer CTA text dynamically.
// ============================================
(function() {
    var STATS_URL = '/site-search.json';

    // Tool URL slug → category mapping for homepage category pills.
    // A tool may appear in multiple categories.
    var toolCategories = {
        'dns-lookup': ['network', 'email', 'security', 'lookup'],
        'ssl-checker': ['security', 'network'],
        'whois-lookup': ['network', 'lookup'],
        'port-scanner': ['network', 'security'],
        'http-latency': ['network'],
        'reverse-dns': ['network', 'lookup'],
        'traceroute': ['network'],
        'subnet-calculator': ['network'],
        'dns-propagation': ['network'],
        'ip-range-generator': ['network'],
        'isp-lookup': ['network', 'lookup'],
        'http-request-builder': ['dev', 'network'],
        'email-validator': ['email', 'security'],
        'email-header-analyzer': ['email', 'lookup'],
        'smtp-checker': ['email', 'security', 'network'],
        'blacklist-checker': ['email', 'security', 'network'],
        'metadata-extractor': ['url', 'email', 'lookup'],
        'breach-checker': ['security'],
        'security-headers': ['security', 'url'],
        'password-generator': ['security', 'lookup'],
        'password-entropy': ['security'],
        'hash-generator': ['dev', 'security'],
        'hmac-generator': ['dev', 'security'],
        'secure-note': ['security'],
        'url-safety': ['url', 'security'],
        'public-key-decoder': ['security'],
        'csr-decoder': ['security'],
        'url-encoder': ['dev', 'url'],
        'url-parser': ['dev', 'url'],
        'redirect-checker': ['url', 'network'],
        'link-checker': ['url', 'network'],
        'tech-detector': ['url', 'lookup'],
        'robots-analyzer': ['url', 'lookup'],
        'query-string-parser': ['dev', 'url'],
        'qr-generator': ['qr'],
        'qr-scanner': ['qr'],
        'json-formatter': ['dev'],
        'base64-encoder': ['dev'],
        'base32-encoder': ['dev'],
        'regex-tester': ['dev'],
        'jwt-decoder': ['dev', 'security'],
        'jwt-generator': ['dev', 'security'],
        'timestamp-converter': ['dev'],
        'color-converter': ['dev'],
        'text-diff': ['dev'],
        'ascii-table': ['dev'],
        'cron-parser': ['dev'],
        'uuid-generator': ['dev'],
        'character-counter': ['dev'],
        'line-tools': ['dev'],
        'env-file-parser': ['dev'],
        'docker-compose-validator': ['dev'],
        'webhook-tester': ['dev'],
        'timezone-converter': ['dev'],
        'plain-notes': ['lookup'],
        'mac-lookup': ['lookup'],
        'device-lookup': ['lookup']
    };

    function computeStats(data) {
        var stats = { tools: 0, errors: 0, learn: 0, categories: 0 };
        var catCounts = { network: 0, security: 0, email: 0, url: 0, qr: 0, dev: 0, lookup: 0 };
        for (var i = 0; i < data.length; i++) {
            var t = data[i].type;
            if (t === 'tool') {
                var slug = (data[i].url || '').replace(/^\/|\/$/g, '');
                // /feedback/ and /badges/ are tagged 'tool' so they rank in site search, but they are
                // pages, not counted tools. Keep in sync with NON_TOOL_URLS in scripts/add-related-links.js.
                if (slug !== 'feedback' && slug !== 'badges') stats.tools++;
                var cats = toolCategories[slug];
                if (cats) {
                    for (var c = 0; c < cats.length; c++) {
                        catCounts[cats[c]] = (catCounts[cats[c]] || 0) + 1;
                    }
                }
            }
            else if (t === 'error') stats.errors++;
            else if (t === 'learn') stats.learn++;
            else if (t === 'category') stats.categories++;
        }
        stats.catCounts = catCounts;
        return stats;
    }

    function updateDOM(stats) {
        // Update elements with data-dt-count attribute
        var els = document.querySelectorAll('[data-dt-count]');
        for (var i = 0; i < els.length; i++) {
            var key = els[i].getAttribute('data-dt-count');
            if (stats[key] !== undefined) {
                els[i].textContent = stats[key];
            }
        }

        // Update category pill counts
        var catEls = document.querySelectorAll('[data-dt-cat]');
        for (var k = 0; k < catEls.length; k++) {
            var cat = catEls[k].getAttribute('data-dt-cat');
            if (stats.catCounts && stats.catCounts[cat] !== undefined) {
                catEls[k].textContent = stats.catCounts[cat];
            }
        }

        // Update tool-page footer CTA: replace "55+ free tools" pattern
        var footerCtas = document.querySelectorAll('.standalone-footer-cta p');
        for (var j = 0; j < footerCtas.length; j++) {
            var p = footerCtas[j];
            p.innerHTML = p.innerHTML.replace(
                /\d+\+?\s*free\s*tools/i,
                stats.tools + ' free tools'
            );
        }
    }

    function init() {
        fetch(STATS_URL)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var stats = computeStats(data);
                updateDOM(stats);
            })
            .catch(function() {});
    }

    // Defer non-critical stats fetch until browser is idle
    function scheduleInit() {
        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(init);
        } else {
            setTimeout(init, 200);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleInit);
    } else {
        scheduleInit();
    }
})();

// ============================================
// HELPFULNESS COMPONENT
// Uses localStorage for vote state. No external tracking.
// ============================================

(function() {
    // Determine page type from URL path
    function getPageType() {
        var p = location.pathname;
        if (p.indexOf('/errors/') === 0) return 'error';
        if (p.indexOf('/learn/') === 0) return 'learn';
        // Utility tool pages live at /dns-lookup/, /json-formatter/, etc.
        // Exclude top-level non-tool paths
        var skip = ['/', '/utility/', '/index.html'];
        if (skip.indexOf(p) !== -1) return null;
        if (p.indexOf('/utility/') === 0) return null; // static assets
        // Anything else at root with a slug is a utility tool page
        if (/^\/[a-z0-9][a-z0-9\-]+\/?$/.test(p)) return 'utility';
        return null;
    }

    // Slug for localStorage keys
    function getPageSlug() {
        return location.pathname.replace(/\/+$/,'').replace(/^\/+/,'').replace(/\//g,'--') || 'home';
    }


    // --- Helpfulness Component ---
    function injectHelpful(pageType) {
        var slug = getPageSlug();
        var storageKey = 'dt_helpful_' + slug;
        var existing = localStorage.getItem(storageKey);

        // Build the component
        var wrap = document.createElement('div');
        wrap.className = 'dt-helpful';
        wrap.id = 'dtHelpful';

        var label = document.createElement('span');
        label.className = 'dt-helpful-label';
        label.textContent = 'Was this helpful?';

        var btns = document.createElement('span');
        btns.className = 'dt-helpful-btns';

        var btnYes = document.createElement('button');
        btnYes.className = 'dt-helpful-btn';
        btnYes.setAttribute('data-vote', 'yes');
        btnYes.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg> Yes';

        var btnNo = document.createElement('button');
        btnNo.className = 'dt-helpful-btn';
        btnNo.setAttribute('data-vote', 'no');
        btnNo.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg> No';

        btns.appendChild(btnYes);
        btns.appendChild(btnNo);
        wrap.appendChild(label);
        wrap.appendChild(btns);

        // If already voted, show state
        if (existing) {
            applyVotedState(wrap, existing);
        }

        // Click handler
        btns.addEventListener('click', function(e) {
            var btn = e.target.closest('.dt-helpful-btn');
            if (!btn || localStorage.getItem(storageKey)) return;
            var vote = btn.getAttribute('data-vote');
            localStorage.setItem(storageKey, vote);
            applyVotedState(wrap, vote);
            // Send anonymous vote to backend
            dtBeacon('vote', slug, vote);
        });

        // Find insertion point based on page type
        var target = null;
        if (pageType === 'learn' || pageType === 'error') {
            // Insert after </article>, before recommended-tools or learn-cta
            target = document.querySelector('.recommended-tools') || document.querySelector('.learn-cta');
        } else if (pageType === 'utility') {
            // Insert after standalone-footer-cta, before footer
            target = document.querySelector('.standalone-footer-cta');
            if (target) target = target.nextElementSibling; // insert before what comes after the CTA
            if (!target) target = document.querySelector('.standalone-page-footer');
        }

        if (target && target.parentNode) {
            target.parentNode.insertBefore(wrap, target);
        }
    }

    function applyVotedState(wrap, vote) {
        var btns = wrap.querySelectorAll('.dt-helpful-btn');
        for (var i = 0; i < btns.length; i++) {
            var bv = btns[i].getAttribute('data-vote');
            if (bv === vote) {
                btns[i].classList.add('voted');
            } else {
                btns[i].classList.add('voted-other');
            }
        }
        var thanks = document.createElement('span');
        thanks.className = 'dt-helpful-thanks';
        if (vote === 'no') {
            thanks.innerHTML = 'Thanks for your feedback! <a href="/feedback/?page=' + encodeURIComponent(location.pathname) + '" class="dt-helpful-suggest-link">Tell us how to improve</a>';
        } else {
            thanks.textContent = 'Thanks for your feedback!';
        }
        wrap.appendChild(thanks);
    }


    // --- Recommended Tools Cards for Learn Pages ---
    // Extracts tool links from the existing "Related Tools" <ul> and
    // renders them as visual cards (matching the error-page pattern).
    var toolMeta = {
        '/dns-lookup/':        { icon: '🌐', name: 'DNS Record Checker',     desc: 'Check A, AAAA, MX, TXT records' },
        '/ssl-checker/':       { icon: '🔒', name: 'SSL Certificate Checker', desc: 'Validate certs & expiry dates' },
        '/whois-lookup/':      { icon: '🔍', name: 'WHOIS / IP Lookup',      desc: 'Domain & IP registration info' },
        '/port-scanner/':      { icon: '📡', name: 'Port Scanner',           desc: 'Check open ports & services' },
        '/http-latency/':      { icon: '⚡', name: 'HTTP Latency Checker',   desc: 'Measure server response times' },
        '/email-validator/':   { icon: '📧', name: 'Email Validator',        desc: 'Verify email deliverability' },
        '/email-header-analyzer/': { icon: '📧', name: 'Email Header Analyzer', desc: 'Inspect email routing & auth' },
        '/smtp-checker/':      { icon: '📧', name: 'SMTP Checker',           desc: 'Test mail server connectivity' },
        '/security-headers/':  { icon: '🛡️', name: 'Security Headers',       desc: 'Inspect HTTP security headers' },
        '/password-generator/':{ icon: '🔑', name: 'Password Generator',     desc: 'Generate strong passwords' },
        '/json-formatter/':    { icon: '🛠️', name: 'JSON Formatter',         desc: 'Format, validate & minify JSON' },
        '/base64-encoder/':    { icon: '🛠️', name: 'Base64 Encoder',         desc: 'Encode & decode Base64' },
        '/url-encoder/':       { icon: '🛠️', name: 'URL Encoder',            desc: 'Encode & decode URLs' },
        '/regex-tester/':      { icon: '🛠️', name: 'Regex Tester',           desc: 'Test regular expressions live' },
        '/hash-generator/':    { icon: '🛠️', name: 'Hash Generator',         desc: 'SHA-256, SHA-512 & more' },
        '/jwt-decoder/':       { icon: '🛠️', name: 'JWT Decoder',            desc: 'Decode & inspect JWT tokens' },
        '/qr-generator/':      { icon: '📱', name: 'QR Code Generator',      desc: 'Generate QR codes instantly' },
        '/qr-scanner/':        { icon: '📱', name: 'QR Code Scanner',        desc: 'Scan QR codes from images' },
        '/url-safety/':        { icon: '🔗', name: 'URL Safety Checker',     desc: 'Check URLs for threats' },
        '/redirect-checker/':  { icon: '🔗', name: 'Redirect Checker',       desc: 'Follow redirect chains' },
        '/link-checker/':      { icon: '🔗', name: 'Broken Link Checker',    desc: 'Find broken links on pages' },
        '/metadata-extractor/':{ icon: '🔗', name: 'Metadata Extractor',     desc: 'Extract URL meta tags' },
        '/isp-lookup/':        { icon: '🔍', name: 'ISP Checker',            desc: 'Identify ISP by IP address' },
        '/mac-lookup/':        { icon: '🔍', name: 'MAC Address Lookup',     desc: 'Identify device vendor' },
        '/reverse-dns/':       { icon: '🌐', name: 'Reverse DNS Lookup',     desc: 'Find hostnames from IPs' },
        '/traceroute/':        { icon: '🌐', name: 'Traceroute',             desc: 'Trace network path to host' },
        '/subnet-calculator/': { icon: '🌐', name: 'Subnet Calculator',      desc: 'Calculate CIDR ranges' },
        '/breach-checker/':    { icon: '🔒', name: 'Breach Checker',         desc: 'Check if a password was leaked' },
        '/blacklist-checker/': { icon: '🔒', name: 'Blacklist Checker',      desc: 'Check IP/domain reputation' },
        '/tech-detector/':     { icon: '🔗', name: 'Tech Stack Detector',    desc: 'Identify site technologies' },
        '/robots-analyzer/':   { icon: '🔗', name: 'Robots.txt Analyzer',    desc: 'Inspect robots.txt rules' },
        '/timestamp-converter/':{ icon: '🛠️', name: 'Timestamp Converter',   desc: 'Convert Unix timestamps' },
        '/color-converter/':   { icon: '🛠️', name: 'Color Converter',        desc: 'Convert HEX, RGB, HSL' },
        '/encrypted-note/':    { icon: '🔒', name: 'Secure Note Sender',     desc: 'Send encrypted messages' },
        '/secure-note/':       { icon: '🔒', name: 'Secure Note Sender',     desc: 'Send encrypted messages' },
        '/plain-notes/':       { icon: '📝', name: 'Plain Notes',            desc: 'Quick notepad with auto-save' },
        '/device-lookup/':     { icon: '📱', name: 'Device Lookup',          desc: 'IMEI, Apple serial, Dell tags' }
    };

    function injectRecommendedTools(pageType) {
        if (pageType !== 'learn') return;
        // Find Related Tools section links
        var headings = document.querySelectorAll('h2');
        var relatedUl = null;
        for (var i = 0; i < headings.length; i++) {
            if (headings[i].textContent.trim() === 'Related Tools') {
                var next = headings[i].nextElementSibling;
                // Skip a <p> description if present
                while (next && next.tagName !== 'UL') next = next.nextElementSibling;
                if (next && next.tagName === 'UL') relatedUl = next;
                break;
            }
        }
        if (!relatedUl) return;

        var links = relatedUl.querySelectorAll('a[href]');
        if (!links.length) return;

        var cards = [];
        for (var j = 0; j < links.length && cards.length < 4; j++) {
            var href = links[j].getAttribute('href');
            // Normalize: ensure trailing slash
            var key = href.replace(/\/$/, '') + '/';
            var meta = toolMeta[key];
            if (meta) {
                cards.push({ href: href, icon: meta.icon, name: meta.name, desc: meta.desc });
            }
        }
        if (!cards.length) return;

        // Build the section
        var section = document.createElement('div');
        section.className = 'recommended-tools';
        section.innerHTML = '<div class="recommended-tools-heading">Recommended Tools</div>';
        var grid = document.createElement('div');
        grid.className = 'recommended-tools-grid';
        for (var k = 0; k < cards.length; k++) {
            var c = cards[k];
            var a = document.createElement('a');
            a.href = c.href;
            a.className = 'recommended-tool-card';
            a.innerHTML = '<span class="recommended-tool-name">' + c.icon + ' ' + c.name + '</span>' +
                          '<span class="recommended-tool-desc">' + c.desc + '</span>';
            grid.appendChild(a);
        }
        section.appendChild(grid);

        // Insert before learn-cta
        var cta = document.querySelector('.learn-cta');
        if (cta && cta.parentNode) {
            cta.parentNode.insertBefore(section, cta);
        }
    }

    // --- Error Page View Tracking ---
    // Counts views per error page in localStorage for popular errors ranking
    function trackErrorView(pageType) {
        if (pageType !== 'error') return;
        try {
            var slug = getPageSlug();
            var views = JSON.parse(localStorage.getItem('dt_error_views') || '{}');
            views[slug] = (views[slug] || 0) + 1;
            localStorage.setItem('dt_error_views', JSON.stringify(views));
        } catch (e) {}
    }

    // --- Shareable Tool URLs ---
    // Allows users to share tool state via URL parameters.
    // No data is stored server-side; state lives entirely in the URL.
    //
    // SECURITY: Only client-side, non-sensitive tools are included here.
    // Tools EXCLUDED from sharing (and why):
    //   jwt-decoder        — JWTs are authentication tokens
    //   password-entropy   — users paste real passwords
    //   password-generator — random output, sharing settings is useless
    //   breach-checker     — users enter real passwords
    //   secure-note        — has its own encrypted hash-based sharing
    //   env-file-parser    — may contain API keys / secrets
    //   hmac-generator     — involves secret keys
    //   csr-decoder        — certificate requests may be sensitive
    //   public-key-decoder — key material
    //   text-diff          — two large textareas, URL length impractical, content may be sensitive
    //   query-string-parser— query strings may contain tokens/secrets
    //   uuid/password-generator — random output, no meaningful input to share
    //   line-tools         — lineOp(op) takes an argument, incompatible with zero-arg dispatch
    //   email-header-analyzer — pasted headers carry routing IPs/addresses and exceed URL limits
    //   ip-range-generator — multi-mode UI, state not capturable in simple params
    //   docker-compose-validator — compose files routinely embed env secrets
    //   http-request-builder — arbitrary-request sender, abuse surface
    //
    // Network tools (dns-lookup, port-scanner, traceroute, etc.) are
    // PREFILL-ONLY (autoRun: false): the URL param fills the input but the
    // visitor must click to run. Auto-running would turn every shared or
    // crawled link into a drive-by backend API hit, and would let a shared
    // port-scanner/traceroute link make every visitor probe an
    // attacker-chosen third-party host.
    //
    // Max input length per parameter: 2000 characters (prevents oversized URLs).
    var SHARE_MAX_INPUT_LENGTH = 2000;

    var shareableTools = {
        'base64-encoder': {
            inputs: [{ id: 'base64Input', param: 'input' }],
            actionParam: 'action',
            actions: { encode: 'encodeBase64', decode: 'decodeBase64' },
            defaultAction: 'encode'
        },
        'json-formatter': {
            inputs: [{ id: 'jsonInput', param: 'input' }],
            actionParam: 'action',
            actions: { format: 'formatJSON', minify: 'minifyJSON' },
            defaultAction: 'format'
        },
        'regex-tester': {
            inputs: [
                { id: 'regexPattern', param: 'pattern' },
                { id: 'regexFlags', param: 'flags' },
                { id: 'regexTestString', param: 'test' }
            ],
            actionParam: null,
            actions: { run: 'testRegex' },
            defaultAction: 'run'
        },
        'timestamp-converter': {
            inputs: [{ id: 'timestampInput', param: 'input' }],
            actionParam: null,
            actions: { convert: 'convertTimestamp' },
            defaultAction: 'convert'
        },
        'url-encoder': {
            inputs: [{ id: 'urlEncodeInput', param: 'input' }],
            actionParam: 'action',
            actions: { encode: 'encodeURL', decode: 'decodeURL' },
            defaultAction: 'encode'
        },
        'color-converter': {
            inputs: [{ id: 'colorInput', param: 'color' }],
            actionParam: null,
            actions: { convert: 'convertColor' },
            defaultAction: 'convert'
        },
        'hash-generator': {
            inputs: [{ id: 'hashInput', param: 'input' }],
            actionParam: null,
            actions: { generate: 'generateHashes' },
            defaultAction: 'generate'
        },
        'cron-parser': {
            inputs: [{ id: 'cronInput', param: 'expr' }],
            actionParam: null,
            actions: { parse: 'parseCron' },
            defaultAction: 'parse'
        },
        'subnet-calculator': {
            inputs: [
                { id: 'subnetIp', param: 'ip' },
                { id: 'subnetCidr', param: 'cidr' }
            ],
            actionParam: null,
            actions: { calculate: 'calculateSubnet' },
            defaultAction: 'calculate'
        },
        'url-parser': {
            inputs: [{ id: 'urlInput', param: 'url' }],
            actionParam: null,
            actions: { parse: 'parseURL' },
            defaultAction: 'parse'
        },
        'base32-encoder': {
            inputs: [{ id: 'plainInput', param: 'input' }],
            actionParam: 'action',
            actions: { encode: 'encodeB32', decode: 'decodeB32' },
            defaultAction: 'encode'
        },
        'qr-generator': {
            inputs: [{ id: 'qrURL', param: 'text' }],
            actionParam: null,
            actions: { generate: 'generateUnifiedQR' },
            defaultAction: 'generate'
        },
        'character-counter': {
            inputs: [{ id: 'textInput', param: 'text' }],
            actionParam: null,
            actions: { count: 'updateStats' },
            defaultAction: 'count'
        },
        'timezone-converter': {
            inputs: [
                { id: 'tzInput', param: 'input' },
                { id: 'tzFrom', param: 'from' }
            ],
            actionParam: null,
            actions: { convert: 'convertTimezone' },
            defaultAction: 'convert'
        },
        // Network tools: prefill-only, never auto-run (see SECURITY note above)
        'dns-lookup': {
            inputs: [{ id: 'domainName', param: 'domain' }],
            actionParam: null,
            actions: { check: 'checkDNS' },
            defaultAction: 'check',
            autoRun: false
        },
        'dns-propagation': {
            inputs: [
                { id: 'domainInput', param: 'domain' },
                { id: 'recordType', param: 'type' }
            ],
            actionParam: null,
            actions: { check: 'checkPropagation' },
            defaultAction: 'check',
            autoRun: false
        },
        'whois-lookup': {
            inputs: [{ id: 'whoisInput', param: 'domain' }],
            actionParam: null,
            actions: { lookup: 'lookupWhois' },
            defaultAction: 'lookup',
            autoRun: false
        },
        'isp-lookup': {
            inputs: [{ id: 'ispInput', param: 'ip' }],
            actionParam: null,
            actions: { check: 'checkISP' },
            defaultAction: 'check',
            autoRun: false
        },
        'http-latency': {
            inputs: [
                { id: 'pingHost', param: 'host' },
                { id: 'pingMode', param: 'mode' }
            ],
            actionParam: null,
            actions: { check: 'checkPing' },
            defaultAction: 'check',
            autoRun: false
        },
        'ssl-checker': {
            inputs: [{ id: 'sslDomain', param: 'domain' }],
            actionParam: null,
            actions: { check: 'checkSSL' },
            defaultAction: 'check',
            autoRun: false
        },
        'port-scanner': {
            inputs: [{ id: 'portScanHost', param: 'host' }],
            actionParam: null,
            actions: { scan: 'scanSelectedPorts' },
            defaultAction: 'scan',
            autoRun: false
        },
        'reverse-dns': {
            inputs: [{ id: 'reverseDnsInput', param: 'ip' }],
            actionParam: null,
            actions: { lookup: 'lookupReverseDns' },
            defaultAction: 'lookup',
            autoRun: false
        },
        'traceroute': {
            inputs: [{ id: 'tracerouteHost', param: 'host' }],
            actionParam: null,
            actions: { run: 'runTraceroute' },
            defaultAction: 'run',
            autoRun: false
        },
        'email-validator': {
            inputs: [{ id: 'emailToValidate', param: 'email' }],
            actionParam: null,
            actions: { validate: 'validateEmail' },
            defaultAction: 'validate',
            autoRun: false
        },
        'smtp-checker': {
            inputs: [{ id: 'smtpHost', param: 'host' }],
            actionParam: null,
            actions: { check: 'checkSMTP' },
            defaultAction: 'check',
            autoRun: false
        },
        'blacklist-checker': {
            inputs: [{ id: 'blacklistIp', param: 'ip' }],
            actionParam: null,
            actions: { check: 'checkBlacklist' },
            defaultAction: 'check',
            autoRun: false
        },
        'mac-lookup': {
            inputs: [{ id: 'macInput', param: 'mac' }],
            actionParam: null,
            actions: { lookup: 'lookupMAC' },
            defaultAction: 'lookup',
            autoRun: false
        },
        'device-lookup': {
            inputs: [{ id: 'deviceInput', param: 'id' }],
            actionParam: null,
            actions: { lookup: 'runDeviceLookup' },
            defaultAction: 'lookup',
            autoRun: false
        },
        'redirect-checker': {
            inputs: [{ id: 'urlToTrace', param: 'url' }],
            actionParam: null,
            actions: { check: 'checkRedirects' },
            defaultAction: 'check',
            autoRun: false
        },
        'link-checker': {
            inputs: [{ id: 'urlToTest', param: 'url' }],
            actionParam: null,
            actions: { check: 'checkLinkStatus' },
            defaultAction: 'check',
            autoRun: false
        },
        'security-headers': {
            inputs: [{ id: 'secHeadersUrl', param: 'url' }],
            actionParam: null,
            actions: { check: 'checkSecurityHeaders' },
            defaultAction: 'check',
            autoRun: false
        },
        'metadata-extractor': {
            inputs: [{ id: 'urlToExtract', param: 'url' }],
            actionParam: null,
            actions: { extract: 'extractMetadata' },
            defaultAction: 'extract',
            autoRun: false
        },
        'robots-analyzer': {
            inputs: [{ id: 'robotsUrl', param: 'url' }],
            actionParam: null,
            actions: { analyze: 'analyzeRobots' },
            defaultAction: 'analyze',
            autoRun: false
        },
        'tech-detector': {
            inputs: [{ id: 'techDetectUrl', param: 'url' }],
            actionParam: null,
            actions: { detect: 'detectTechStack' },
            defaultAction: 'detect',
            autoRun: false
        },
        'url-safety': {
            inputs: [{ id: 'urlToCheck', param: 'url' }],
            actionParam: null,
            actions: { check: 'checkURLSafety' },
            defaultAction: 'check',
            autoRun: false
        }
    };

    function getToolSlugFromPath() {
        var p = location.pathname.replace(/\/+$/, '').replace(/^\/+/, '');
        return p || null;
    }

    function initShareableUrls(pageType) {
        if (pageType !== 'utility') return;
        var slug = getToolSlugFromPath();
        if (!slug || !shareableTools[slug]) return;
        var config = shareableTools[slug];

        // Restore state from URL params (with length limit to prevent abuse)
        var params = new URLSearchParams(location.search);
        var hasInput = false;
        for (var i = 0; i < config.inputs.length; i++) {
            var inp = config.inputs[i];
            var val = params.get(inp.param);
            if (val !== null && val.length <= SHARE_MAX_INPUT_LENGTH) {
                var el = document.getElementById(inp.id);
                if (el) { el.value = val; hasInput = true; }
            }
        }

        // Auto-run the tool if inputs were provided via URL
        // (skipped for autoRun:false tools — network tools only prefill)
        if (hasInput && config.autoRun !== false) {
            var actionKey = config.defaultAction;
            if (config.actionParam) {
                var urlAction = params.get(config.actionParam);
                if (urlAction && config.actions[urlAction]) {
                    actionKey = urlAction;
                }
            }
            var fnName = config.actions[actionKey];
            if (fnName && typeof window[fnName] === 'function') {
                window[fnName]();
            }
        }

        // Inject Share Link button
        injectShareButton(config, slug);

        // After the user runs the tool, mirror the inputs into the address
        // bar (replaceState, no reload/history entry) so the URL itself is
        // copy-pasteable. Only fires on user clicks, so prefill-only tools
        // still never expose auto-run behavior.
        var toolCard = document.querySelector('.tool-card.standalone-card');
        if (toolCard) {
            toolCard.addEventListener('click', function (ev) {
                var btn = ev.target.closest ? ev.target.closest('button') : null;
                if (!btn || btn.classList.contains('dt-share-btn')) return;
                setTimeout(function () { updateUrlFromInputs(config); }, 0);
            });
        }
    }

    function updateUrlFromInputs(config) {
        try {
            var url = new URL(location.href);
            var changed = false;
            for (var i = 0; i < config.inputs.length; i++) {
                var inp = config.inputs[i];
                var el = document.getElementById(inp.id);
                if (!el) continue;
                if (el.value && el.value.length <= SHARE_MAX_INPUT_LENGTH) {
                    if (url.searchParams.get(inp.param) !== el.value) {
                        url.searchParams.set(inp.param, el.value);
                        changed = true;
                    }
                } else if (url.searchParams.has(inp.param)) {
                    url.searchParams.delete(inp.param);
                    changed = true;
                }
            }
            if (changed) history.replaceState(null, '', url.pathname + url.search);
        } catch (e) {}
    }

    function buildShareBtn(config, slug) {
        var shareBtn = document.createElement('button');
        shareBtn.className = 'dt-share-btn';
        shareBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share Link';
        shareBtn.title = 'Copy a shareable link with your current input';
        shareBtn.addEventListener('click', function() {
            var hasValue = false;
            var tooLong = false;
            var url = new URL(location.origin + '/' + slug + '/');
            for (var i = 0; i < config.inputs.length; i++) {
                var inp = config.inputs[i];
                var el = document.getElementById(inp.id);
                if (el && el.value) {
                    if (el.value.length > SHARE_MAX_INPUT_LENGTH) {
                        tooLong = true;
                        break;
                    }
                    url.searchParams.set(inp.param, el.value);
                    hasValue = true;
                }
            }
            if (tooLong) {
                if (typeof showToast === 'function') showToast('Input too long to share via URL');
                return;
            }
            if (!hasValue) {
                if (typeof showToast === 'function') showToast('Enter some input first!');
                return;
            }
            navigator.clipboard.writeText(url.toString()).then(function() {
                if (typeof showToast === 'function') showToast('Link copied!');
            }).catch(function() {
                prompt('Copy this link:', url.toString());
            });
        });
        return shareBtn;
    }

    function injectShareButton(config, slug) {
        var toolCard = document.querySelector('.tool-card.standalone-card');
        if (!toolCard) return;

        var shareBtn = buildShareBtn(config, slug);

        // Try to append to existing button row
        var btnRow = toolCard.querySelector('.encode-decode-btns');
        if (btnRow) {
            btnRow.appendChild(shareBtn);
            return;
        }

        // Fallback: insert a standalone share row before the results div
        var resultsDivs = toolCard.querySelectorAll('[id$="Results"]');
        var resultsDiv = resultsDivs.length ? resultsDivs[resultsDivs.length - 1] : null;

        var wrap = document.createElement('div');
        wrap.style.cssText = 'margin: 10px 0; display: flex; justify-content: flex-end;';
        wrap.appendChild(shareBtn);

        if (resultsDiv) {
            resultsDiv.parentNode.insertBefore(wrap, resultsDiv);
        } else {
            toolCard.appendChild(wrap);
        }
    }

    // --- Advanced Related Content Engine ---
    // Topic-based mapping connecting pages across /errors/, /learn/, and /utility/ sections.
    // Each topic defines keywords (matched against URL), plus related guides, errors, AND tools.
    var topicMap = [
        {
            id: 'dns',
            keywords: ['dns', 'nxdomain', 'name-not-resolved', 'name_not_resolved', 'nameserver'],
            tools: [
                { href: '/dns-lookup/', title: 'DNS Record Checker' },
                { href: '/reverse-dns/', title: 'Reverse DNS Lookup' },
                { href: '/whois-lookup/', title: 'WHOIS Lookup' },
                { href: '/dns-propagation/', title: 'DNS Propagation Checker' }
            ],
            guides: [
                { href: '/learn/dns-lookup/', title: 'DNS Records Explained' },
                { href: '/learn/dns-propagation/', title: 'DNS Propagation Guide' },
                { href: '/learn/dns-probe-finished-nxdomain/', title: 'What Causes NXDOMAIN' },
                { href: '/learn/reverse-dns/', title: 'Reverse DNS Explained' },
                { href: '/learn/whois-lookup/', title: 'WHOIS Lookup Guide' }
            ],
            errors: [
                { href: '/errors/dns/nxdomain', title: 'NXDOMAIN' },
                { href: '/errors/dns/servfail', title: 'SERVFAIL' },
                { href: '/errors/dns/dns-lookup-failed', title: 'DNS Lookup Failed' },
                { href: '/errors/dns/dns-server-not-responding', title: 'DNS Server Not Responding' },
                { href: '/errors/browser/dns_probe_finished_nxdomain', title: 'DNS_PROBE_FINISHED_NXDOMAIN' },
                { href: '/errors/browser/err_name_not_resolved', title: 'ERR_NAME_NOT_RESOLVED' }
            ]
        },
        {
            id: 'email',
            keywords: ['email', 'smtp', 'mail', 'dkim', 'dmarc', 'spf', 'relay', 'mailbox'],
            tools: [
                { href: '/email-validator/', title: 'Email Address Validator' },
                { href: '/email-header-analyzer/', title: 'Email Header Analyzer' },
                { href: '/smtp-checker/', title: 'SMTP Checker' },
                { href: '/blacklist-checker/', title: 'Blacklist / RBL Checker' },
                { href: '/breach-checker/', title: 'Email Breach Checker' }
            ],
            guides: [
                { href: '/learn/email-validator/', title: 'Email Validation Guide' },
                { href: '/learn/email-header-analyzer/', title: 'Email Header Analysis' },
                { href: '/learn/email-authentication/', title: 'Email Authentication Explained' },
                { href: '/learn/smtp-checker/', title: 'SMTP Connectivity Guide' },
                { href: '/learn/what-is-dkim/', title: 'What is DKIM?' },
                { href: '/learn/what-is-dmarc/', title: 'What is DMARC?' },
                { href: '/learn/what-is-spf/', title: 'What is SPF?' },
                { href: '/learn/blacklist-checker/', title: 'Email Blacklist Guide' }
            ],
            errors: [
                { href: '/errors/email/smtp-550', title: 'SMTP 550 — Mailbox Not Found' },
                { href: '/errors/email/smtp-421', title: 'SMTP 421 — Service Not Available' },
                { href: '/errors/email/smtp-535', title: 'SMTP 535 — Authentication Failed' },
                { href: '/errors/email/smtp-554', title: 'SMTP 554 — Transaction Failed' },
                { href: '/errors/email/relay-access-denied', title: 'Relay Access Denied' },
                { href: '/errors/email/mailbox-unavailable', title: 'Mailbox Unavailable' },
                { href: '/errors/email/message-rejected', title: 'Message Rejected' }
            ]
        },
        {
            id: 'ssl',
            keywords: ['ssl', 'tls', 'cert', 'certificate', 'https', 'insecure-response', 'insecure_response'],
            tools: [
                { href: '/ssl-checker/', title: 'SSL Certificate Checker' },
                { href: '/csr-decoder/', title: 'CSR Decoder' },
                { href: '/public-key-decoder/', title: 'Public Key Decoder' },
                { href: '/security-headers/', title: 'Security Headers Checker' }
            ],
            guides: [
                { href: '/learn/ssl-checker/', title: 'SSL Certificate Guide' },
                { href: '/learn/ssl-tls-handshake/', title: 'SSL/TLS Handshake Explained' },
                { href: '/learn/err-ssl-protocol-error/', title: 'ERR_SSL_PROTOCOL_ERROR Guide' }
            ],
            errors: [
                { href: '/errors/ssl/ssl-certificate-expired', title: 'SSL Certificate Expired' },
                { href: '/errors/ssl/ssl-handshake-failed', title: 'SSL Handshake Failed' },
                { href: '/errors/ssl/ssl-certificate-invalid', title: 'SSL Certificate Invalid' },
                { href: '/errors/ssl/net-err-cert-authority-invalid', title: 'NET::ERR_CERT_AUTHORITY_INVALID' },
                { href: '/errors/ssl/net-err-cert-date-invalid', title: 'NET::ERR_CERT_DATE_INVALID' },
                { href: '/errors/ssl/err_ssl_protocol_error', title: 'ERR_SSL_PROTOCOL_ERROR' },
                { href: '/errors/ssl/tls-version-unsupported', title: 'TLS Version Unsupported' },
                { href: '/errors/browser/err_cert_common_name_invalid', title: 'ERR_CERT_COMMON_NAME_INVALID' }
            ]
        },
        {
            id: 'http',
            keywords: ['/http/', 'http-latency', 'http-429', 'http-502', 'bad-gateway', 'bad-request', 'not-found', 'unauthorized', 'forbidden', 'latency', 'redirect-checker', 'moved-permanently', 'security-headers', 'link-checker'],
            tools: [
                { href: '/http-latency/', title: 'HTTP Latency Checker' },
                { href: '/redirect-checker/', title: 'Redirect Checker' },
                { href: '/link-checker/', title: 'Broken Link Checker' },
                { href: '/security-headers/', title: 'Security Headers Checker' },
                { href: '/http-request-builder/', title: 'HTTP Request Builder' }
            ],
            guides: [
                { href: '/learn/http-latency/', title: 'HTTP Latency Guide' },
                { href: '/learn/http-502-bad-gateway/', title: 'What is 502 Bad Gateway?' },
                { href: '/learn/http-429-too-many-requests/', title: 'What is 429 Too Many Requests?' },
                { href: '/learn/redirect-checker/', title: 'Redirect Chains Explained' },
                { href: '/learn/security-headers/', title: 'Security Headers Guide' },
                { href: '/learn/link-checker/', title: 'Broken Links Guide' }
            ],
            errors: [
                { href: '/errors/http/400-bad-request', title: '400 Bad Request' },
                { href: '/errors/http/401-unauthorized', title: '401 Unauthorized' },
                { href: '/errors/http/403-forbidden', title: '403 Forbidden' },
                { href: '/errors/http/404-not-found', title: '404 Not Found' },
                { href: '/errors/http/429-too-many-requests', title: '429 Too Many Requests' },
                { href: '/errors/http/500-internal-server-error', title: '500 Internal Server Error' },
                { href: '/errors/http/502-bad-gateway', title: '502 Bad Gateway' },
                { href: '/errors/http/503-service-unavailable', title: '503 Service Unavailable' },
                { href: '/errors/http/504-gateway-timeout', title: '504 Gateway Timeout' }
            ]
        },
        {
            id: 'network',
            keywords: ['connection', 'network', 'proxy', 'tunnel', 'port', 'traceroute', 'subnet', 'isp', 'internet-disconnected', 'internet_disconnected', 'quic', 'address-unreachable', 'address_unreachable'],
            tools: [
                { href: '/port-scanner/', title: 'Port Scanner' },
                { href: '/traceroute/', title: 'Traceroute' },
                { href: '/subnet-calculator/', title: 'Subnet Calculator' },
                { href: '/isp-lookup/', title: 'ISP / IP Lookup' },
                { href: '/ip-range-generator/', title: 'IP Range Generator' },
                { href: '/http-latency/', title: 'HTTP Latency Checker' }
            ],
            guides: [
                { href: '/learn/port-scanner/', title: 'Port Scanning Guide' },
                { href: '/learn/traceroute/', title: 'Traceroute Explained' },
                { href: '/learn/subnet-calculator/', title: 'Subnet Calculation Guide' },
                { href: '/learn/isp-lookup/', title: 'ISP Lookup Guide' },
                { href: '/learn/http-latency/', title: 'HTTP Latency Guide' }
            ],
            errors: [
                { href: '/errors/browser/err_connection_refused', title: 'ERR_CONNECTION_REFUSED' },
                { href: '/errors/browser/err_connection_reset', title: 'ERR_CONNECTION_RESET' },
                { href: '/errors/browser/err_connection_timed_out', title: 'ERR_CONNECTION_TIMED_OUT' },
                { href: '/errors/browser/err_internet_disconnected', title: 'ERR_INTERNET_DISCONNECTED' },
                { href: '/errors/browser/err_network_changed', title: 'ERR_NETWORK_CHANGED' },
                { href: '/errors/browser/err_proxy_connection_failed', title: 'ERR_PROXY_CONNECTION_FAILED' },
                { href: '/errors/browser/err_tunnel_connection_failed', title: 'ERR_TUNNEL_CONNECTION_FAILED' }
            ]
        },
        {
            id: 'security',
            keywords: ['password', 'breach', 'blacklist', 'url-safety', 'security-header', 'hash', 'hmac', 'encrypted', 'secure-note'],
            tools: [
                { href: '/password-generator/', title: 'Password Generator' },
                { href: '/password-entropy/', title: 'Password Entropy Calculator' },
                { href: '/hash-generator/', title: 'Hash Generator' },
                { href: '/hmac-generator/', title: 'HMAC Generator' },
                { href: '/breach-checker/', title: 'Email Breach Checker' },
                { href: '/url-safety/', title: 'URL Safety Checker' },
                { href: '/secure-note/', title: 'Encrypted Note' }
            ],
            guides: [
                { href: '/learn/password-generator/', title: 'Password Security Guide' },
                { href: '/learn/breach-checker/', title: 'Data Breach Guide' },
                { href: '/learn/url-safety/', title: 'URL Safety Guide' },
                { href: '/learn/security-headers/', title: 'Security Headers Guide' },
                { href: '/learn/blacklist-checker/', title: 'Blacklist Checker Guide' },
                { href: '/learn/hash-generator/', title: 'Cryptographic Hash Guide' },
                { href: '/learn/encrypted-note/', title: 'Encrypted Notes Guide' }
            ],
            errors: []
        },
        {
            id: 'encoding',
            keywords: ['base64', 'base32', 'url-encoder', 'url-decoder', 'percent-encoding', 'encoding', 'ascii'],
            tools: [
                { href: '/base64-encoder/', title: 'Base64 Encoder / Decoder' },
                { href: '/base32-encoder/', title: 'Base32 Encoder / Decoder' },
                { href: '/url-encoder/', title: 'URL Encoder / Decoder' },
                { href: '/ascii-table/', title: 'ASCII Table' }
            ],
            guides: [
                { href: '/learn/base64-encoder/', title: 'Base64 Encoding Explained' },
                { href: '/learn/url-encoder/', title: 'URL Encoding Guide' }
            ],
            errors: []
        },
        {
            id: 'json',
            keywords: ['json', 'json-formatter'],
            tools: [
                { href: '/json-formatter/', title: 'JSON Formatter' },
                { href: '/jwt-decoder/', title: 'JWT Decoder' },
                { href: '/jwt-generator/', title: 'JWT Generator' }
            ],
            guides: [
                { href: '/learn/json-formatter/', title: 'JSON Formatting and Validation' },
                { href: '/learn/jwt-decoder/', title: 'JSON Web Tokens Explained' }
            ],
            errors: []
        },
        {
            id: 'jwt',
            keywords: ['jwt', 'json-web-token', 'bearer-token'],
            tools: [
                { href: '/jwt-decoder/', title: 'JWT Decoder' },
                { href: '/jwt-generator/', title: 'JWT Generator' },
                { href: '/json-formatter/', title: 'JSON Formatter' },
                { href: '/base64-encoder/', title: 'Base64 Encoder / Decoder' }
            ],
            guides: [
                { href: '/learn/jwt-decoder/', title: 'JSON Web Tokens Explained' },
                { href: '/learn/json-formatter/', title: 'JSON Formatting Guide' }
            ],
            errors: []
        },
        {
            id: 'url',
            keywords: ['url-parser', 'url-safety', 'redirect', 'link-checker', 'robots', 'tech-detector', 'query-string'],
            tools: [
                { href: '/url-parser/', title: 'URL Parser' },
                { href: '/url-encoder/', title: 'URL Encoder / Decoder' },
                { href: '/url-safety/', title: 'URL Safety Checker' },
                { href: '/redirect-checker/', title: 'Redirect Checker' },
                { href: '/link-checker/', title: 'Broken Link Checker' },
                { href: '/robots-analyzer/', title: 'Robots.txt Analyzer' },
                { href: '/tech-detector/', title: 'Tech Stack Detector' },
                { href: '/query-string-parser/', title: 'Query String Parser' }
            ],
            guides: [
                { href: '/learn/url-encoder/', title: 'URL Encoding Guide' },
                { href: '/learn/url-safety/', title: 'URL Safety Guide' },
                { href: '/learn/redirect-checker/', title: 'Redirect Chains Explained' },
                { href: '/learn/link-checker/', title: 'Broken Links Guide' },
                { href: '/learn/robots-analyzer/', title: 'Robots.txt Guide' },
                { href: '/learn/tech-detector/', title: 'Web Technology Detection' }
            ],
            errors: [
                { href: '/errors/browser/err_too_many_redirects', title: 'ERR_TOO_MANY_REDIRECTS' },
                { href: '/errors/http/301-moved-permanently', title: '301 Moved Permanently' },
                { href: '/errors/http/404-not-found', title: '404 Not Found' }
            ]
        },
        {
            id: 'qr',
            keywords: ['qr'],
            tools: [
                { href: '/qr-generator/', title: 'QR Code Generator' },
                { href: '/qr-scanner/', title: 'QR Code Scanner' }
            ],
            guides: [
                { href: '/learn/qr-generator/', title: 'QR Code Generation' },
                { href: '/learn/qr-scanner/', title: 'QR Code Scanning Guide' }
            ],
            errors: []
        },
        {
            id: 'domain',
            keywords: ['whois', 'domain', 'registrar'],
            tools: [
                { href: '/whois-lookup/', title: 'WHOIS Lookup' },
                { href: '/dns-lookup/', title: 'DNS Record Checker' },
                { href: '/dns-propagation/', title: 'DNS Propagation Checker' }
            ],
            guides: [
                { href: '/learn/whois-lookup/', title: 'WHOIS Lookup Guide' },
                { href: '/learn/dns-lookup/', title: 'DNS Records Explained' },
                { href: '/learn/dns-propagation/', title: 'DNS Propagation Guide' }
            ],
            errors: [
                { href: '/errors/dns/nxdomain', title: 'NXDOMAIN' },
                { href: '/errors/browser/err_name_not_resolved', title: 'ERR_NAME_NOT_RESOLVED' }
            ]
        },
        {
            id: 'database',
            keywords: ['database', 'mongodb', 'mysql', 'postgresql', 'redis', 'sqlite', 'deadlock'],
            tools: [],
            guides: [],
            errors: [
                { href: '/errors/database/database-connection-timeout', title: 'Database Connection Timeout' },
                { href: '/errors/database/database-too-many-connections', title: 'Too Many Connections' },
                { href: '/errors/database/database-deadlock-detected', title: 'Deadlock Detected' },
                { href: '/errors/database/postgresql-connection-refused', title: 'PostgreSQL Connection Refused' },
                { href: '/errors/database/mysql-access-denied', title: 'MySQL Access Denied' },
                { href: '/errors/database/redis-connection-refused', title: 'Redis Connection Refused' },
                { href: '/errors/database/sqlite-database-locked', title: 'SQLite Database Locked' },
                { href: '/errors/database/mongodb-connection-failed', title: 'MongoDB Connection Failed' }
            ]
        },
        {
            id: 'devops',
            keywords: ['docker', 'kubernetes', 'npm', 'yarn', 'pip', 'git-', 'python-module', 'java-class', 'permission-denied-publickey'],
            tools: [
                { href: '/docker-compose-validator/', title: 'Docker Compose Validator' },
                { href: '/env-file-parser/', title: 'Env File Parser' }
            ],
            guides: [],
            errors: [
                { href: '/errors/devops/docker-daemon-not-running', title: 'Docker Daemon Not Running' },
                { href: '/errors/devops/docker-port-already-allocated', title: 'Docker Port Already Allocated' },
                { href: '/errors/devops/kubernetes-crashloopbackoff', title: 'Kubernetes CrashLoopBackOff' },
                { href: '/errors/devops/npm-err-eresolve', title: 'npm ERR! ERESOLVE' },
                { href: '/errors/devops/git-merge-conflict', title: 'Git Merge Conflict' },
                { href: '/errors/devops/permission-denied-publickey', title: 'Permission Denied (publickey)' }
            ]
        },
        {
            id: 'devtools',
            keywords: ['regex', 'timestamp', 'color-converter', 'cron', 'text-diff', 'line-tools', 'character-counter', 'uuid', 'webhook', 'plain-notes'],
            tools: [
                { href: '/regex-tester/', title: 'Regex Tester' },
                { href: '/timestamp-converter/', title: 'Timestamp Converter' },
                { href: '/color-converter/', title: 'Color Converter' },
                { href: '/cron-parser/', title: 'Cron Expression Parser' },
                { href: '/text-diff/', title: 'Text Diff Tool' },
                { href: '/uuid-generator/', title: 'UUID Generator' },
                { href: '/character-counter/', title: 'Character Counter' },
                { href: '/line-tools/', title: 'Line Tools' }
            ],
            guides: [
                { href: '/learn/regex-tester/', title: 'Regular Expressions Guide' },
                { href: '/learn/timestamp-converter/', title: 'Unix Timestamps Explained' },
                { href: '/learn/color-converter/', title: 'Color Format Conversion' }
            ],
            errors: []
        }
    ];

    // Detect which topics match the current page URL
    function detectTopics(path) {
        var pathLower = path.toLowerCase();
        var matched = [];

        // Also detect by error category from URL path
        var categoryMatch = pathLower.match(/^\/errors\/([^\/]+)\//);
        var category = categoryMatch ? categoryMatch[1] : null;

        for (var i = 0; i < topicMap.length; i++) {
            var topic = topicMap[i];

            // Match by error category
            if (category && topic.id === category) {
                matched.push(topic);
                continue;
            }

            // Match by keywords in the path
            for (var k = 0; k < topic.keywords.length; k++) {
                if (pathLower.indexOf(topic.keywords[k]) !== -1) {
                    matched.push(topic);
                    break;
                }
            }
        }
        return matched;
    }

    // Check if a related section already exists in the article
    function hasSection(headingText) {
        var headings = document.querySelectorAll('article h2, .dt-related-links-heading');
        for (var i = 0; i < headings.length; i++) {
            if (headings[i].textContent.trim() === headingText) return true;
        }
        return false;
    }

    // Check if page already has a .related-guides paragraph
    function hasRelatedGuidesP() {
        return !!document.querySelector('article .related-guides');
    }

    // Build a related links section (card style matching recommended-tools)
    function buildRelatedSection(heading, items) {
        var section = document.createElement('div');
        section.className = 'dt-related-links';
        section.innerHTML = '<div class="dt-related-links-heading">' + heading + '</div>';
        var list = document.createElement('div');
        list.className = 'dt-related-links-list';
        for (var i = 0; i < items.length; i++) {
            var a = document.createElement('a');
            a.href = items[i].href;
            a.className = 'dt-related-link';
            a.textContent = items[i].title;
            list.appendChild(a);
        }
        section.appendChild(list);
        return section;
    }

    // Build a related tools section with icon cards (richer than plain links)
    function buildRelatedToolCards(items) {
        var section = document.createElement('div');
        section.className = 'dt-related-links dt-related-tools-section';
        section.innerHTML = '<div class="dt-related-links-heading">Related Tools</div>';
        var grid = document.createElement('div');
        grid.className = 'recommended-tools-grid';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var key = item.href.replace(/\/$/, '') + '/';
            var meta = toolMeta[key];
            var a = document.createElement('a');
            a.href = item.href;
            a.className = 'recommended-tool-card';
            if (meta) {
                a.innerHTML = '<span class="recommended-tool-name">' + meta.icon + ' ' + meta.name + '</span>' +
                              '<span class="recommended-tool-desc">' + meta.desc + '</span>';
            } else {
                a.innerHTML = '<span class="recommended-tool-name">' + item.title + '</span>';
            }
            grid.appendChild(a);
        }
        section.appendChild(grid);
        return section;
    }

    // Collect unique items from matched topics, excluding current page
    function collectItems(topics, key, path, maxItems) {
        var seen = {};
        var result = [];
        for (var t = 0; t < topics.length; t++) {
            var arr = topics[t][key];
            if (!arr) continue;
            for (var i = 0; i < arr.length; i++) {
                var item = arr[i];
                if (path.indexOf(item.href.replace(/\/+$/, '')) !== -1) continue;
                if (seen[item.href]) continue;
                seen[item.href] = true;
                result.push(item);
            }
        }
        return result.slice(0, maxItems || 4);
    }

    // Find the best insertion point for related sections
    function findInsertTarget(pageType) {
        if (pageType === 'utility') {
            return document.querySelector('.standalone-footer-cta') ||
                   document.querySelector('.standalone-page-footer');
        }
        return document.querySelector('.recommended-tools') ||
               document.querySelector('.learn-cta') ||
               document.querySelector('.standalone-page-footer');
    }

    // Inject cross-section related content on ALL page types
    function injectCrossSectionLinks(pageType) {
        var path = location.pathname;
        var topics = detectTopics(path);
        if (!topics.length) return;

        var insertTarget = findInsertTarget(pageType);
        if (!insertTarget || !insertTarget.parentNode) return;

        var tools = collectItems(topics, 'tools', path, 4);
        var guides = collectItems(topics, 'guides', path, 4);
        var errors = collectItems(topics, 'errors', path, 4);

        // Error pages: inject Related Guides + Related Tools
        if (pageType === 'error') {
            if (tools.length > 0 && !hasSection('Related Tools')) {
                var toolSection = buildRelatedToolCards(tools);
                insertTarget.parentNode.insertBefore(toolSection, insertTarget);
            }
            if (guides.length > 0 && !hasRelatedGuidesP() && !hasSection('Related Guides')) {
                var guideSection = buildRelatedSection('Related Guides', guides);
                insertTarget.parentNode.insertBefore(guideSection, insertTarget);
            }
        }

        // Learn pages: inject Related Errors + Related Tools (if no recommended-tools already)
        if (pageType === 'learn') {
            if (errors.length > 0 && !hasSection('Related Errors')) {
                var errorSection = buildRelatedSection('Related Errors', errors);
                insertTarget.parentNode.insertBefore(errorSection, insertTarget);
            }
        }

        // Utility tool pages: inject Related Guides + Related Errors
        // (skipped when the page already carries a static related-links block
        // generated by scripts/add-related-links.js)
        if (pageType === 'utility') {
            if (document.querySelector('.related-guides') || document.querySelector('.recommended-tools')) return;
            if (guides.length > 0 && !hasSection('Related Guides')) {
                var utilGuideSection = buildRelatedSection('Related Guides', guides);
                insertTarget.parentNode.insertBefore(utilGuideSection, insertTarget);
            }
            if (errors.length > 0 && !hasSection('Related Errors')) {
                var utilErrorSection = buildRelatedSection('Related Errors', errors);
                insertTarget.parentNode.insertBefore(utilErrorSection, insertTarget);
            }
        }
    }

    // --- Ad Slot Placeholders ---
    // Inserts empty, hidden ad-slot divs into appropriate positions.
    // Slots remain invisible (display:none) until data-ad-active is set.
    function createAdSlot(className) {
        var div = document.createElement('div');
        div.className = 'ad-slot ' + className;
        return div;
    }

    function injectAdSlots(pageType) {
        // content-bottom-ad: after main content, before footer CTAs
        var contentBottomTarget = null;
        if (pageType === 'utility') {
            // After standalone-footer-cta, before footer
            contentBottomTarget = document.querySelector('.standalone-footer-cta');
        } else if (pageType === 'learn') {
            // Before learn-cta
            contentBottomTarget = document.querySelector('.learn-cta');
        } else if (pageType === 'error') {
            // Before recommended-tools or learn-cta
            contentBottomTarget = document.querySelector('.recommended-tools') || document.querySelector('.learn-cta');
        }

        if (contentBottomTarget && contentBottomTarget.parentNode) {
            contentBottomTarget.parentNode.insertBefore(
                createAdSlot('content-bottom-ad'),
                contentBottomTarget
            );
        }

        // sidebar-ad: after the footer CTA / learn-cta, before the footer element
        var footer = document.querySelector('.standalone-page-footer');
        if (footer && footer.parentNode) {
            footer.parentNode.insertBefore(
                createAdSlot('sidebar-ad'),
                footer
            );
        }
    }

    // --- Init on DOM ready ---
    function init() {
        var pageType = getPageType();
        if (!pageType) return;
        injectHelpful(pageType);
        injectRecommendedTools(pageType);
        injectCrossSectionLinks(pageType);
        injectAdSlots(pageType);
        trackErrorView(pageType);
        initShareableUrls(pageType);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
