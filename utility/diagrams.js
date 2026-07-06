/* ============================================
   DUCKTYPED — DIAGRAM RENDERER
   Auto-renders themed SVG diagrams on error pages.
   Usage: <div class="dt-diagram" data-diagram="dns" data-error="nxdomain"></div>
   ============================================ */

(function () {
    'use strict';

    // Shared SVG helpers
    function svgOpen(w, h) {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet">';
    }
    function arrowDef() {
        return '<defs><marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" class="dt-arrowhead"/></marker></defs>';
    }
    function node(cls, x, y, w, h, label, sub) {
        var cx = x + w / 2;
        var ty = sub ? y + h / 2 - 6 : y + h / 2 + 4;
        var s = '<g class="' + cls + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" ry="8"/>';
        s += '<text x="' + cx + '" y="' + ty + '" text-anchor="middle">' + label + '</text>';
        if (sub) {
            s += '<text x="' + cx + '" y="' + (y + h / 2 + 10) + '" text-anchor="middle" class="dt-node-label">' + sub + '</text>';
        }
        s += '</g>';
        return s;
    }
    function arrow(x1, y1, x2, y2) {
        return '<g class="dt-arrow"><line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" marker-end="url(#ah)"/></g>';
    }
    function flowLabel(x, y, text) {
        return '<text x="' + x + '" y="' + y + '" text-anchor="middle" class="dt-flow-label">' + text + '</text>';
    }
    function errorLabel(x, y, text) {
        return '<text x="' + x + '" y="' + y + '" text-anchor="middle" class="dt-error-label">' + text + '</text>';
    }
    function errorBracket(x, y, w, h, label) {
        var s = '<g class="dt-error">';
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" ry="6" fill="none"/>';
        s += '</g>';
        s += errorLabel(x + w / 2, y + h + 14, label);
        return s;
    }

    // ---- DNS Resolution Diagram ----
    var dnsErrors = {
        nxdomain: { highlightIdx: 3, label: 'NXDOMAIN — domain not found' },
        timeout: { highlightIdx: 1, label: 'DNS query timed out' },
        servfail: { highlightIdx: 3, label: 'SERVFAIL — server failure' },
        refused: { highlightIdx: 3, label: 'REFUSED — query refused' },
        badconfig: { highlightIdx: 1, label: 'Bad DNS configuration' },
        nointernet: { highlightIdx: 0, label: 'No internet connection' },
        default: { highlightIdx: -1, label: '' }
    };

    function renderDNS(errorType) {
        var err = dnsErrors[errorType] || dnsErrors['default'];
        var W = 680, H = 170;
        var nw = 120, nh = 48;
        var nodes = [
            { x: 10, y: 20, label: 'Browser', sub: 'Your device' },
            { x: 155, y: 20, label: 'DNS Resolver', sub: '1.1.1.1 / ISP' },
            { x: 300, y: 20, label: 'Root Server', sub: '. (root)' },
            { x: 445, y: 20, label: 'TLD Server', sub: '.com / .org' },
            { x: 545, y: 95, label: 'Auth NS', sub: 'Authoritative' }
        ];
        var s = svgOpen(W, H) + arrowDef();

        for (var i = 0; i < nodes.length; i++) {
            var cls = 'dt-node';
            if (i === err.highlightIdx) cls = 'dt-error';
            s += node(cls, nodes[i].x, nodes[i].y, nw, nh, nodes[i].label, nodes[i].sub);
        }

        // Forward arrows (top row)
        s += arrow(130, 44, 155, 44);
        s += flowLabel(143, 38, 'query');
        s += arrow(275, 44, 300, 44);
        s += arrow(420, 44, 445, 44);
        // Down arrow to auth NS
        s += arrow(505, 68, 545, 95);
        // Return arrow along bottom
        s += '<g class="dt-arrow"><path d="M545,143 L70,143 L70,68" marker-end="url(#ah)"/></g>';
        s += flowLabel(310, 138, 'IP address returned');

        // Error bracket
        if (err.highlightIdx >= 0) {
            var en = nodes[err.highlightIdx];
            s += errorBracket(en.x - 4, en.y - 4, nw + 8, nh + 8, err.label);
        }

        s += '</svg>';
        return s;
    }

    // ---- HTTP / Proxy / Origin Diagram ----
    var httpErrors = {
        '502': { highlightIdx: 2, label: '502 — invalid upstream response' },
        '503': { highlightIdx: 2, label: '503 — service unavailable' },
        '504': { highlightIdx: 2, label: '504 — upstream timed out' },
        'conn_reset': { highlightIdx: 1, label: 'Connection reset by server' },
        'conn_refused': { highlightIdx: 2, label: 'Connection refused by origin' },
        'default': { highlightIdx: -1, label: '' }
    };

    function renderHTTP(errorType) {
        var err = httpErrors[errorType] || httpErrors['default'];
        var W = 680, H = 140;
        var nw = 130, nh = 48;
        var nodes = [
            { x: 10, y: 20, label: 'Client', sub: 'Browser' },
            { x: 170, y: 20, label: 'CDN / Proxy', sub: 'Cloudflare / nginx' },
            { x: 340, y: 20, label: 'Origin Server', sub: 'Your app server' },
            { x: 510, y: 20, label: 'Application', sub: 'PHP / Node / Python' }
        ];
        var s = svgOpen(W, H) + arrowDef();

        for (var i = 0; i < nodes.length; i++) {
            var cls = 'dt-node';
            if (i === err.highlightIdx) cls = 'dt-error';
            s += node(cls, nodes[i].x, nodes[i].y, nw, nh, nodes[i].label, nodes[i].sub);
        }

        s += arrow(140, 44, 170, 44);
        s += flowLabel(155, 38, 'request');
        s += arrow(300, 44, 340, 44);
        s += flowLabel(320, 38, 'forward');
        s += arrow(470, 44, 510, 44);
        s += flowLabel(490, 38, 'pass');

        // Return path
        s += '<g class="dt-arrow"><path d="M510,68 L75,68" marker-end="url(#ah)" stroke-dasharray="5 3"/></g>';
        s += flowLabel(295, 82, 'response');

        if (err.highlightIdx >= 0) {
            var en = nodes[err.highlightIdx];
            s += errorBracket(en.x - 4, en.y - 4, nw + 8, nh + 8, err.label);
        }

        s += '</svg>';
        return s;
    }

    // ---- SMTP Email Delivery Diagram ----
    var smtpErrors = {
        '550': { highlightIdx: 2, label: '550 — mailbox unavailable / rejected' },
        '554': { highlightIdx: 2, label: '554 — transaction failed' },
        '553': { highlightIdx: 2, label: '553 — invalid address' },
        '535': { highlightIdx: 1, label: '535 — auth failed' },
        '421': { highlightIdx: 2, label: '421 — service not available' },
        '451': { highlightIdx: 2, label: '451 — processing error' },
        'relay': { highlightIdx: 2, label: 'Relay access denied' },
        'default': { highlightIdx: -1, label: '' }
    };

    function renderSMTP(errorType) {
        var err = smtpErrors[errorType] || smtpErrors['default'];
        var W = 680, H = 140;
        var nw = 125, nh = 48;
        var nodes = [
            { x: 10, y: 20, label: 'Sender MTA', sub: 'Your mail server' },
            { x: 165, y: 20, label: 'DNS MX', sub: 'MX record lookup' },
            { x: 320, y: 20, label: 'Recipient MTA', sub: 'Destination server' },
            { x: 510, y: 20, label: 'Mailbox', sub: 'Inbox delivery' }
        ];
        var s = svgOpen(W, H) + arrowDef();

        for (var i = 0; i < nodes.length; i++) {
            var cls = 'dt-node';
            if (i === err.highlightIdx) cls = 'dt-error';
            s += node(cls, nodes[i].x, nodes[i].y, nw, nh, nodes[i].label, nodes[i].sub);
        }

        s += arrow(135, 44, 165, 44);
        s += flowLabel(150, 38, 'query');
        s += arrow(290, 44, 320, 44);
        s += flowLabel(305, 38, 'connect');
        s += arrow(445, 44, 510, 44);
        s += flowLabel(478, 38, 'deliver');

        // Bounce return
        s += '<g class="dt-arrow"><path d="M320,68 L75,68" marker-end="url(#ah)" stroke-dasharray="5 3"/></g>';
        s += flowLabel(200, 82, 'bounce / error response');

        if (err.highlightIdx >= 0) {
            var en = nodes[err.highlightIdx];
            s += errorBracket(en.x - 4, en.y - 4, nw + 8, nh + 8, err.label);
        }

        s += '</svg>';
        return s;
    }

    // ---- SSL / TLS Handshake Diagram ----
    var sslErrors = {
        'protocol': { highlightIdx: 1, label: 'Protocol version mismatch' },
        'expired': { highlightIdx: 2, label: 'Certificate expired' },
        'authority': { highlightIdx: 2, label: 'Untrusted certificate authority' },
        'handshake': { highlightIdx: 1, label: 'Handshake failed' },
        'revoked': { highlightIdx: 2, label: 'Certificate revoked' },
        'invalid': { highlightIdx: 2, label: 'Certificate invalid' },
        'default': { highlightIdx: -1, label: '' }
    };

    function renderSSL(errorType) {
        var err = sslErrors[errorType] || sslErrors['default'];
        var W = 480, H = 240;
        var colL = 50, colR = 330, colW = 100, rowH = 36;
        var s = svgOpen(W, H) + arrowDef();

        // Client and Server headers
        s += node('dt-node', colL - 10, 8, colW + 20, 32, 'Client', null);
        s += node('dt-node', colR - 10, 8, colW + 20, 32, 'Server', null);

        // Vertical timeline lines
        s += '<line x1="' + (colL + colW / 2) + '" y1="40" x1="' + (colL + colW / 2) + '" y2="230" stroke="var(--diagram-node-border)" stroke-width="1" x2="' + (colL + colW / 2) + '"/>';
        s += '<line x1="' + (colR + colW / 2) + '" y1="40" x2="' + (colR + colW / 2) + '" y2="230" stroke="var(--diagram-node-border)" stroke-width="1"/>';

        var steps = [
            { y: 60, dir: 'right', label: 'ClientHello', sub: 'TLS version, ciphers' },
            { y: 100, dir: 'left', label: 'ServerHello', sub: 'Chosen cipher, cert' },
            { y: 140, dir: 'right', label: 'Key Exchange', sub: 'Verify cert, keys' },
            { y: 180, dir: 'left', label: 'Finished', sub: 'Encrypted connection' }
        ];

        var lx = colL + colW / 2;
        var rx = colR + colW / 2;

        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            var cls = 'dt-arrow';
            if (i === err.highlightIdx) cls = 'dt-arrow';

            if (step.dir === 'right') {
                s += '<g class="' + cls + '"><line x1="' + (lx + 4) + '" y1="' + step.y + '" x2="' + (rx - 4) + '" y2="' + step.y + '" marker-end="url(#ah)"/></g>';
            } else {
                s += '<g class="' + cls + '"><line x1="' + (rx - 4) + '" y1="' + step.y + '" x2="' + (lx + 4) + '" y2="' + step.y + '" marker-end="url(#ah)"/></g>';
            }

            var mid = (lx + rx) / 2;
            s += '<text x="' + mid + '" y="' + (step.y - 6) + '" text-anchor="middle" class="dt-node-label" style="font-weight:600;font-size:12px;fill:var(--diagram-node-text)">' + step.label + '</text>';
            s += flowLabel(mid, step.y + 14, step.sub);

            // Error highlight on the arrow step
            if (i === err.highlightIdx) {
                s += '<rect x="' + (lx + 10) + '" y="' + (step.y - 18) + '" width="' + (rx - lx - 20) + '" height="36" rx="4" ry="4" fill="var(--diagram-error-fill)" stroke="var(--diagram-error-stroke)" stroke-width="1.5" stroke-dasharray="5 3"/>';
                s += errorLabel(mid, step.y + 30, err.label);
            }
        }

        s += '</svg>';
        return s;
    }

    // ---- Renderer map ----
    var renderers = {
        dns: renderDNS,
        http: renderHTTP,
        smtp: renderSMTP,
        ssl: renderSSL
    };

    // ---- Auto-init ----
    function init() {
        var els = document.querySelectorAll('.dt-diagram[data-diagram]');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var type = el.getAttribute('data-diagram');
            var error = el.getAttribute('data-error') || 'default';
            var renderer = renderers[type];
            if (renderer) {
                var wrap = document.createElement('div');
                wrap.className = 'dt-diagram-wrap';
                wrap.innerHTML = renderer(error);
                el.appendChild(wrap);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
