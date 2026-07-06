// ============================================
// QUACKTOOLS — SHARED TOOL HELPERS
// HTML builders, validation, boilerplate reducers
// ============================================

// ============================================
// RESULT HTML BUILDERS
// ============================================

/**
 * Build a single result row (replaces repeated dns-record HTML pattern).
 * @param {string} icon - Emoji icon
 * @param {string} label - Bold label
 * @param {string} value - HTML content for the value
 * @param {string} [colorClass] - Optional: 'text-success', 'text-warning', 'text-error', 'text-muted'
 */
function resultRow(icon, label, value, colorClass) {
    const cls = colorClass ? ` class="${colorClass}"` : '';
    return `<div class="dns-record"><strong>${icon} ${escapeHtml(label)}</strong><div class="dns-record-value"${cls}>${value}</div></div>`;
}

/**
 * Build a result section heading.
 */
function resultHeading(text) {
    return `<div class="result-heading"><strong>${escapeHtml(text)}</strong></div>`;
}

/**
 * Build a summary box with optional border color variant.
 * @param {string} html - Inner HTML content
 * @param {'success'|'warning'|'error'|''} [variant] - Border color variant
 */
function resultSummary(html, variant) {
    const cls = variant ? ` ${variant}-border` : '';
    return `<div class="result-summary${cls}">${html}</div>`;
}

/**
 * Build a note/info box.
 * @param {string} html - Inner HTML content
 * @param {'warning'|'error'|''} [variant] - Optional variant
 */
function resultNote(html, variant) {
    const cls = variant ? ` ${variant}` : '';
    return `<div class="result-note${cls}">${html}</div>`;
}

/**
 * Wrap content in a dns-results container.
 */
function resultWrap(innerHtml) {
    return `<div class="dns-results">${innerHtml}</div>`;
}

// ============================================
// TOOL RUNNER — reduces boilerplate for worker-backed tools
// ============================================

/**
 * Run a worker-backed tool with standard validation, loading state, and error handling.
 * @param {object} opts
 * @param {string} opts.inputId - ID of the input element
 * @param {string} opts.resultsId - ID of the results container
 * @param {string} opts.tool - Worker tool name (e.g. 'dns', 'whois')
 * @param {function} opts.getPayload - (inputValue) => request body object
 * @param {function} opts.render - (data, inputValue) => HTML string
 * @param {string} [opts.loadingMsg] - Loading message
 * @param {string} [opts.errorPrefix] - Error message prefix
 * @param {function} [opts.validate] - (inputValue) => error string or null
 * @param {boolean} [opts.requireWorker=true] - Whether worker must be available
 */
async function runTool(opts) {
    const input = document.getElementById(opts.inputId);
    const resultsDiv = document.getElementById(opts.resultsId);
    const value = input ? input.value.trim() : '';

    if (!value) {
        resultsDiv.innerHTML = '<div class="error">Please enter a value!</div>';
        return;
    }

    // Custom validation
    if (opts.validate) {
        const err = opts.validate(value);
        if (err) {
            resultsDiv.innerHTML = `<div class="error">${escapeHtml(err)}</div>`;
            return;
        }
    }

    // Worker availability check
    if (opts.requireWorker !== false && !workerAvailable) {
        resultsDiv.innerHTML = '<div class="error">Backend service unavailable. Please try again later.</div>';
        return;
    }

    resultsDiv.innerHTML = `<div class="success">${opts.loadingMsg || 'Processing...'}</div>`;

    try {
        const payload = opts.getPayload(value);
        const data = await callWorker(opts.tool, payload);
        resultsDiv.innerHTML = opts.render(data, value);
    } catch (error) {
        const prefix = opts.errorPrefix || 'Error';
        resultsDiv.innerHTML = `<div class="error">${prefix}: ${escapeHtml(error.message)}</div>`;
    }
}

// ============================================
// OUTPUT BOX — replaces repeated inline-styled output containers
// ============================================

/**
 * Build an output box with optional copy button.
 * @param {string} content - Text content (will be escaped)
 * @param {object} [opts]
 * @param {boolean} [opts.preWrap] - Use white-space: pre-wrap (for decoded text)
 * @param {boolean} [opts.scrollable] - Add max-height + overflow
 * @param {boolean} [opts.copy] - Show a copy button
 * @param {string} [opts.rawCopyText] - Raw text for the copy button (defaults to content)
 * @param {boolean} [opts.html] - If true, content is treated as raw HTML (not escaped)
 */
function outputBox(content, opts) {
    opts = opts || {};
    var cls = 'output-box';
    if (opts.preWrap) cls += ' pre-wrap';
    if (opts.scrollable) cls += ' scrollable';
    var inner = opts.html ? content : escapeHtml(content);
    var copyBtn = '';
    if (opts.copy) {
        var copyText = (opts.rawCopyText || content).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
        copyBtn = '<button class="copy-btn" onclick="navigator.clipboard.writeText(\'' + copyText + '\'); showToast(\'Copied!\');">Copy</button>';
    }
    return '<div class="' + cls + '">' + inner + copyBtn + '</div>';
}

/**
 * Build a standalone copy button (inline, not positioned).
 * @param {string} textExpr - JS expression that evaluates to the text to copy
 * @param {string} [label] - Button label (default: "Copy")
 */
function copyButton(textExpr, label) {
    return '<button class="copy-btn copy-btn-inline" onclick="navigator.clipboard.writeText(' + textExpr + '); showToast(\'Copied!\');">' + (label || 'Copy') + '</button>';
}

/**
 * Build an info/note block (for disclaimers, tips, summaries at bottom of results).
 * @param {string} html - Inner HTML
 * @param {'success'|'warning'|'error'|''} [variant] - Border color variant
 */
function infoNote(html, variant) {
    var cls = 'info-note';
    if (variant) cls += ' ' + variant;
    return '<div class="' + cls + '"><p>' + html + '</p></div>';
}

/**
 * Build a section heading for tool results.
 * @param {string} text - Heading text (will be escaped)
 */
function sectionHeading(text) {
    return '<div class="tool-section-heading"><strong>' + escapeHtml(text) + '</strong></div>';
}

// ============================================
// CLIENT TOOL RUNNER — reduces boilerplate for client-side (no-worker) tools
// ============================================

/**
 * Run a client-side tool with standard validation and error handling.
 * Eliminates repeated get-input → validate → try/catch → render pattern.
 * @param {object} opts
 * @param {string} opts.inputId - ID of the input element
 * @param {string} opts.resultsId - ID of the results container
 * @param {function} opts.process - (inputValue) => HTML string to display
 * @param {string} [opts.emptyMsg] - Message when input is empty
 * @param {string} [opts.errorMsg] - Static error message (overrides e.message)
 * @param {function} [opts.validate] - (inputValue) => error string or null
 * @param {boolean} [opts.allowUntrimmed] - If true, don't trim input value
 */
function clientTool(opts) {
    var input = document.getElementById(opts.inputId);
    var resultsDiv = document.getElementById(opts.resultsId);
    var value = input ? (opts.allowUntrimmed ? input.value : input.value.trim()) : '';

    if (!value) {
        resultsDiv.innerHTML = '<div class="error">' + escapeHtml(opts.emptyMsg || 'Please enter a value!') + '</div>';
        return;
    }

    if (opts.validate) {
        var err = opts.validate(value);
        if (err) {
            resultsDiv.innerHTML = '<div class="error">' + escapeHtml(err) + '</div>';
            return;
        }
    }

    try {
        resultsDiv.innerHTML = opts.process(value);
    } catch (e) {
        resultsDiv.innerHTML = '<div class="error">' + escapeHtml(opts.errorMsg || e.message) + '</div>';
    }
}

// ============================================
// COMMON VALIDATORS
// ============================================

function validateUrlInput(value) {
    try {
        new URL(value);
        return null;
    } catch (e) {
        return 'Invalid URL format! Please include http:// or https://';
    }
}

function validateIpInput(value) {
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
        return 'Invalid IP format! Please enter a valid IPv4 address (e.g., 203.0.113.1)';
    }
    return null;
}

function validateDomainInput(value) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        return 'Invalid domain format! Please enter a valid domain (e.g., example.com)';
    }
    return null;
}

function validateJsonInput(value) {
    try {
        JSON.parse(value);
        return null;
    } catch (e) {
        return 'Invalid JSON: ' + e.message;
    }
}

function validateEmailFormat(value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Invalid email format! Please enter a valid email address.';
    }
    return null;
}

function validatePortInput(value) {
    var port = parseInt(value);
    if (isNaN(port) || port < 1 || port > 65535) {
        return 'Invalid port number! Must be between 1 and 65535.';
    }
    return null;
}

// ============================================
// PLAIN NOTES (Client-side, localStorage)
// Lives here (not tools-network.js) because the standalone
// /plain-notes/ page loads tools-helpers.js but not the network lib.
// ============================================
function loadSavedNotes() {
    const savedNotes = localStorage.getItem('plainNotes');
    if (savedNotes && document.getElementById('notesTextarea')) {
        document.getElementById('notesTextarea').value = savedNotes;
    }
}

function saveNotes() {
    const textarea = document.getElementById('notesTextarea');
    if (!textarea) return;
    const notes = textarea.value;
    localStorage.setItem('plainNotes', notes);

    const statusDiv = document.getElementById('notesSaveStatus');
    if (statusDiv) {
        statusDiv.style.display = 'block';
        setTimeout(() => { statusDiv.style.display = 'none'; }, 2000);
    }
    showToast('✓ Notes saved!');
}

function clearNotes() {
    if (confirm('Are you sure you want to clear all notes?')) {
        document.getElementById('notesTextarea').value = '';
        localStorage.removeItem('plainNotes');
        showToast('Notes cleared');
    }
}

function downloadNotes() {
    const textarea = document.getElementById('notesTextarea');
    if (!textarea || !textarea.value.trim()) {
        showToast('No notes to download!', 'error');
        return;
    }
    const blob = new Blob([textarea.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quacktools-notes-' + new Date().toISOString().slice(0, 10) + '.txt';
    link.click();
    URL.revokeObjectURL(url);
    showToast('✓ Notes downloaded!');
}

// Auto-save notes every 30 seconds
let autoSaveTimeout;
if (document.getElementById('notesTextarea')) {
    document.getElementById('notesTextarea').addEventListener('input', function() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            localStorage.setItem('plainNotes', this.value);
        }, 2000);
    });
}
