// ============================================
// DUCKTYPED — Dev Tools
// Base64, URL Encode, JSON, Regex, Hash, JWT, Timestamp, Color
// ============================================

// ============================================
// BASE64 ENCODE/DECODE
// ============================================
function encodeBase64() {
    clientTool({
        inputId: 'base64Input',
        resultsId: 'base64Results',
        emptyMsg: 'Please enter text to encode!',
        allowUntrimmed: true,
        process: function (value) {
            return resultHeading('Encoded Base64') + outputBox(DT.encoding.base64Encode(value), { copy: true });
        }
    });
}

function decodeBase64() {
    clientTool({
        inputId: 'base64Input',
        resultsId: 'base64Results',
        emptyMsg: 'Please enter Base64 to decode!',
        errorMsg: 'Invalid Base64 string. Make sure the input is valid Base64-encoded data.',
        process: function (value) {
            return resultHeading('Decoded Text') + outputBox(DT.encoding.base64Decode(value), { preWrap: true });
        }
    });
}

// ============================================
// URL ENCODE/DECODE
// ============================================
function encodeURL() {
    clientTool({
        inputId: 'urlEncodeInput',
        resultsId: 'urlEncodeResults',
        emptyMsg: 'Please enter text to encode!',
        allowUntrimmed: true,
        process: function (value) {
            return resultHeading('URL-Encoded') + outputBox(DT.encoding.urlEncode(value), { copy: true });
        }
    });
}

function decodeURL() {
    clientTool({
        inputId: 'urlEncodeInput',
        resultsId: 'urlEncodeResults',
        emptyMsg: 'Please enter an encoded string to decode!',
        errorMsg: 'Invalid encoded string. The input contains malformed percent-encoding.',
        process: function (value) {
            return resultHeading('Decoded Text') + outputBox(DT.encoding.urlDecode(value), { preWrap: true });
        }
    });
}

// ============================================
// JSON FORMATTER / VALIDATOR
// ============================================
function formatJSON() {
    clientTool({
        inputId: 'jsonInput',
        resultsId: 'jsonResults',
        emptyMsg: 'Please enter JSON to format!',
        process: function (value) {
            var parsed = JSON.parse(value);
            var formatted = JSON.stringify(parsed, null, 2);
            return resultHeading('Formatted JSON') +
                '<div class="json-output">' + syntaxHighlightJSON(formatted) + '</div>' +
                copyButton('JSON.stringify(JSON.parse(document.getElementById(\'jsonInput\').value.trim()), null, 2)', 'Copy Formatted');
        }
    });
}

function minifyJSON() {
    clientTool({
        inputId: 'jsonInput',
        resultsId: 'jsonResults',
        emptyMsg: 'Please enter JSON to minify!',
        process: function (value) {
            var parsed = JSON.parse(value);
            var minified = JSON.stringify(parsed);
            var savings = Math.round((1 - minified.length / value.length) * 100);
            return resultHeading('Minified JSON') +
                outputBox(minified, { scrollable: true, copy: true, rawCopyText: minified }) +
                resultNote('Original: ' + value.length.toLocaleString() + ' chars → Minified: ' + minified.length.toLocaleString() + ' chars (' + savings + '% smaller)');
        }
    });
}

function syntaxHighlightJSON(json) {
    return escapeHtml(json).replace(
        /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                cls = /:$/.test(match) ? 'json-key' : 'json-string';
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        }
    );
}

// ============================================
// REGEX TESTER
// ============================================
function testRegex() {
    const pattern = document.getElementById('regexPattern').value;
    const flags = document.getElementById('regexFlags').value;
    const testStr = document.getElementById('regexTestString').value;
    const resultsDiv = document.getElementById('regexResults');

    if (!pattern) { resultsDiv.innerHTML = ''; return; }
    if (!testStr) { resultsDiv.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 10px;">Enter a test string to see matches.</div>'; return; }

    try {
        const regex = new RegExp(pattern, flags);
        const matches = [];
        let match;

        if (flags.includes('g')) {
            while ((match = regex.exec(testStr)) !== null) {
                matches.push({ index: match.index, length: match[0].length, value: match[0], groups: match.slice(1) });
                if (match[0].length === 0) { regex.lastIndex++; }
            }
        } else {
            match = regex.exec(testStr);
            if (match) {
                matches.push({ index: match.index, length: match[0].length, value: match[0], groups: match.slice(1) });
            }
        }

        let html = '';

        // Match count
        const countColor = matches.length > 0 ? 'var(--success-color)' : 'var(--error-color)';
        html += '<div style="margin: 12px 0 8px; font-weight: 600; color: ' + countColor + ';">' + matches.length + ' match' + (matches.length !== 1 ? 'es' : '') + ' found</div>';

        // Highlighted text
        if (matches.length > 0) {
            let highlighted = '';
            let lastIndex = 0;
            matches.forEach(function(m) {
                highlighted += escapeHtml(testStr.substring(lastIndex, m.index));
                highlighted += '<mark class="regex-match">' + escapeHtml(testStr.substring(m.index, m.index + m.length)) + '</mark>';
                lastIndex = m.index + m.length;
            });
            highlighted += escapeHtml(testStr.substring(lastIndex));
            html += '<div class="regex-output output-box pre-wrap" style="word-break: normal;">' + highlighted + '</div>';

            // Match details
            html += '<div style="margin-top: 12px;"><strong style="font-size: 0.9em;">Match Details:</strong></div>';
            html += '<div class="dns-results" style="margin-top: 6px;">';
            matches.forEach(function(m, i) {
                html += '<div class="dns-record"><strong>Match ' + (i + 1) + '</strong>';
                html += '<div class="dns-record-value" style="font-family: var(--font-mono); font-size: 0.88em;">';
                html += '"' + escapeHtml(m.value) + '" <span class="text-muted">at index ' + m.index + '</span>';
                if (m.groups.length > 0) {
                    html += '<br>';
                    m.groups.forEach(function(g, gi) {
                        html += 'Group ' + (gi + 1) + ': ' + (g !== undefined ? '"' + escapeHtml(g) + '"' : '<span class="text-muted">undefined</span>') + '<br>';
                    });
                }
                html += '</div></div>';
            });
            html += '</div>';
        } else {
            html += '<div class="output-box pre-wrap" style="color: var(--text-secondary); word-break: normal;">No matches found in the test string.</div>';
        }

        resultsDiv.innerHTML = html;
    } catch (e) {
        resultsDiv.innerHTML = '<div class="error"><strong>Invalid Regex</strong><br>' + escapeHtml(e.message) + '</div>';
    }
}

// ============================================
// HASH GENERATOR (Web Crypto API)
// ============================================
async function generateHashes() {
    var input = document.getElementById('hashInput').value;
    var resultsDiv = document.getElementById('hashResults');
    if (!input) { resultsDiv.innerHTML = '<div class="error">Please enter text to hash!</div>'; return; }

    resultsDiv.innerHTML = '<div class="success">Generating hashes...</div>';

    try {
        var results = await DT.encoding.hashAll(input);

        var html = resultHeading('Hash Results');
        results.forEach(function (r) {
            var id = 'hash-' + r.algo.replace('-', '');
            html += '<div class="hash-result-row">' +
                '<span class="hash-algo">' + r.algo + '</span>' +
                '<span class="hash-value" id="' + id + '">' + r.hash + '</span>' +
                copyButton('document.getElementById(\'' + id + '\').textContent') +
                '</div>';
        });
        html += resultNote('All hashes generated locally using Web Crypto API. Input: ' + input.length.toLocaleString() + ' characters.');
        resultsDiv.innerHTML = html;
    } catch (e) {
        resultsDiv.innerHTML = '<div class="error">Hashing failed: ' + escapeHtml(e.message) + '</div>';
    }
}

// ============================================
// JWT DECODER
// ============================================
function decodeJWT() {
    const input = document.getElementById('jwtInput').value.trim();
    const resultsDiv = document.getElementById('jwtResults');
    if (!input) { resultsDiv.innerHTML = '<div class="error">Please enter a JWT token!</div>'; return; }

    try {
        const parts = input.split('.');
        if (parts.length !== 3) {
            resultsDiv.innerHTML = '<div class="error">Invalid JWT format. A JWT must have 3 parts separated by dots (header.payload.signature).</div>';
            return;
        }

        const header = JSON.parse(DT.encoding.base64UrlDecode(parts[0]));
        const payload = JSON.parse(DT.encoding.base64UrlDecode(parts[1]));

        let html = resultHeading('Decoded JWT');
        html += '<div class="dns-results">';

        // Header
        html += '<div class="dns-record"><strong>Header</strong>';
        html += '<div class="dns-record-value"><div class="json-output" style="max-height: 200px;">' + syntaxHighlightJSON(JSON.stringify(header, null, 2)) + '</div></div></div>';

        // Payload
        html += '<div class="dns-record"><strong>Payload</strong>';
        html += '<div class="dns-record-value"><div class="json-output" style="max-height: 300px;">' + syntaxHighlightJSON(JSON.stringify(payload, null, 2)) + '</div></div></div>';

        // Expiration
        if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            const isExpired = Date.now() > payload.exp * 1000;
            const icon = isExpired ? '❌' : '✅';
            const color = isExpired ? 'var(--error-color)' : 'var(--success-color)';
            html += '<div class="dns-record"><strong>' + icon + ' Expiration</strong>';
            html += '<div class="dns-record-value" style="color: ' + color + ';">' + (isExpired ? 'EXPIRED' : 'Valid') + ' — ' + escapeHtml(expDate.toUTCString()) + '</div></div>';
        }

        // Issued At
        if (payload.iat) {
            const iatDate = new Date(payload.iat * 1000);
            html += '<div class="dns-record"><strong>Issued At</strong>';
            html += '<div class="dns-record-value">' + escapeHtml(iatDate.toUTCString()) + '</div></div>';
        }

        // Signature
        html += '<div class="dns-record"><strong>Signature</strong>';
        html += '<div class="dns-record-value" style="font-family: var(--font-mono); font-size: 0.85em; word-break: break-all; color: var(--text-secondary);">' + escapeHtml(parts[2]) + '</div></div>';

        html += '</div>';
        html += resultNote('<strong>Note:</strong> This decoder does not verify the signature. It only decodes and displays the token contents. Signature verification requires the signing key.', '');
        resultsDiv.innerHTML = html;
    } catch (e) {
        resultsDiv.innerHTML = '<div class="error">Failed to decode JWT. The token may be malformed or contain invalid Base64.</div>';
    }
}

// ============================================
// UNIX TIMESTAMP CONVERTER
// ============================================
var _timestampInterval = null;

function startLiveClock() {
    var el = document.getElementById('timestampLive');
    if (!el) return;
    function update() {
        var now = Math.floor(Date.now() / 1000);
        el.innerHTML = 'Current Epoch: <strong>' + now + '</strong>';
    }
    update();
    if (_timestampInterval) clearInterval(_timestampInterval);
    _timestampInterval = setInterval(update, 1000);
}

function convertTimestamp() {
    var input = document.getElementById('timestampInput').value.trim();
    var resultsDiv = document.getElementById('timestampResults');
    if (!input) { resultsDiv.innerHTML = '<div class="error">Please enter a Unix timestamp!</div>'; return; }

    var ts = Number(input);
    if (isNaN(ts)) { resultsDiv.innerHTML = '<div class="error">Invalid timestamp. Enter a numeric value.</div>'; return; }

    // Auto-detect seconds vs milliseconds
    var isMs = ts > 9999999999;
    var date = new Date(isMs ? ts : ts * 1000);

    if (isNaN(date.getTime())) { resultsDiv.innerHTML = '<div class="error">Invalid timestamp value.</div>'; return; }

    var rows = '';
    rows += resultRow('📅', 'UTC', escapeHtml(date.toUTCString()));
    rows += resultRow('🕐', 'Local', escapeHtml(date.toLocaleString()));
    rows += resultRow('📋', 'ISO 8601', escapeHtml(date.toISOString()));
    rows += resultRow('⏱️', 'Seconds', String(Math.floor(date.getTime() / 1000)));
    rows += resultRow('⚡', 'Milliseconds', String(date.getTime()));
    if (isMs) {
        rows += resultRow('ℹ️', 'Detected', '<span class="text-muted">Input treated as milliseconds (>10 digits)</span>');
    }

    var relStr = getRelativeTime(date);
    rows += resultRow('🔄', 'Relative', relStr);

    resultsDiv.innerHTML = resultHeading('Timestamp → Date') + resultWrap(rows);
}

function convertDateToTimestamp() {
    var input = document.getElementById('dateInput').value;
    var resultsDiv = document.getElementById('timestampResults');
    if (!input) { resultsDiv.innerHTML = '<div class="error">Please select a date and time!</div>'; return; }

    var date = new Date(input);
    if (isNaN(date.getTime())) { resultsDiv.innerHTML = '<div class="error">Invalid date value.</div>'; return; }

    var seconds = Math.floor(date.getTime() / 1000);
    var millis = date.getTime();

    var rows = '';
    rows += resultRow('⏱️', 'Seconds', '<strong>' + seconds + '</strong>');
    rows += resultRow('⚡', 'Milliseconds', String(millis));
    rows += resultRow('📅', 'UTC', escapeHtml(date.toUTCString()));
    rows += resultRow('📋', 'ISO 8601', escapeHtml(date.toISOString()));

    resultsDiv.innerHTML = resultHeading('Date → Timestamp') + resultWrap(rows);
}

function getRelativeTime(date) {
    var now = Date.now();
    var diff = now - date.getTime();
    var abs = Math.abs(diff);
    var suffix = diff > 0 ? 'ago' : 'from now';
    if (abs < 60000) return Math.floor(abs / 1000) + ' seconds ' + suffix;
    if (abs < 3600000) return Math.floor(abs / 60000) + ' minutes ' + suffix;
    if (abs < 86400000) return Math.floor(abs / 3600000) + ' hours ' + suffix;
    if (abs < 2592000000) return Math.floor(abs / 86400000) + ' days ' + suffix;
    if (abs < 31536000000) return Math.floor(abs / 2592000000) + ' months ' + suffix;
    return Math.floor(abs / 31536000000) + ' years ' + suffix;
}

// ============================================
// COLOR CONVERTER — uses DT.color for pure conversions
// ============================================
function convertColor() {
    var input = document.getElementById('colorInput').value.trim();
    var resultsDiv = document.getElementById('colorResults');
    if (!input) { resultsDiv.innerHTML = ''; return; }

    // Try DT.color first, fall back to canvas for named colors
    var rgb = DT.color.parseToRgb(input);
    if (!rgb) {
        try {
            var ctx = document.createElement('canvas').getContext('2d');
            ctx.fillStyle = input;
            var computed = ctx.fillStyle;
            if (computed.startsWith('#')) {
                rgb = DT.color.parseToRgb(computed);
            }
        } catch (e) {}
    }
    if (!rgb) {
        resultsDiv.innerHTML = '<div class="error">Could not parse color. Try formats like: #FF6600, rgb(255,102,0), hsl(24,100%,50%)</div>';
        return;
    }

    var hex = DT.color.rgbToHex(rgb.r, rgb.g, rgb.b);
    var hsl = DT.color.rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Sync color picker
    var picker = document.getElementById('colorPicker');
    if (picker) picker.value = hex;

    renderColorResults(hex, rgb, hsl, resultsDiv);
}

function updateColorFromPicker() {
    var picker = document.getElementById('colorPicker');
    var input = document.getElementById('colorInput');
    if (picker && input) {
        input.value = picker.value;
        convertColor();
    }
}

function renderColorResults(hex, rgb, hsl, resultsDiv) {
    var hexUpper = hex.toUpperCase();
    var rgbStr = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
    var hslStr = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';

    // Determine text color for contrast
    var lum = DT.color.luminance(rgb.r, rgb.g, rgb.b);
    var textColor = lum > 0.5 ? '#000' : '#fff';

    var html = '<div class="color-preview-swatch" style="background-color: ' + hex + '; display: flex; align-items: center; justify-content: center; color: ' + textColor + '; font-weight: 700; font-size: 1.1em;">' + hexUpper + '</div>';
    html += '<div class="color-values-grid">';
    html += colorValueRow('HEX', hexUpper, 'colorHex');
    html += colorValueRow('RGB', rgbStr, 'colorRgb');
    html += colorValueRow('HSL', hslStr, 'colorHsl');
    html += '</div>';
    resultsDiv.innerHTML = html;
}

function colorValueRow(label, value, id) {
    return '<div class="color-value-row">' +
        '<strong style="min-width: 36px; color: var(--primary-color);">' + label + '</strong>' +
        '<span id="' + id + '" style="flex: 1;">' + value + '</span>' +
        copyButton('document.getElementById(\'' + id + '\').textContent') +
        '</div>';
}

// Auto-start live clock if element exists
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { startLiveClock(); });
} else {
    startLiveClock();
}
