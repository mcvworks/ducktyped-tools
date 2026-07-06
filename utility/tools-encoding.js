// ============================================
// DUCKTYPED — Encoding/Decoding Library
// Pure functions with no DOM dependencies.
// Reusable across tools, future APIs, and embeds.
// ============================================

var DT = window.DT || {};

DT.encoding = {

    // ---- Base64 (UTF-8 safe) ----

    base64Encode: function (text) {
        return btoa(unescape(encodeURIComponent(text)));
    },

    base64Decode: function (b64) {
        return decodeURIComponent(escape(atob(b64)));
    },

    // ---- Base64-URL (used by JWT, etc.) ----

    base64UrlEncode: function (text) {
        return btoa(unescape(encodeURIComponent(text)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    },

    base64UrlDecode: function (str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return decodeURIComponent(escape(atob(str)));
    },

    // ---- URL encoding ----

    urlEncode: function (text) {
        return encodeURIComponent(text);
    },

    urlDecode: function (text) {
        return decodeURIComponent(text);
    },

    // ---- Hashing (Web Crypto, async) ----

    hash: async function (text, algorithm) {
        var encoder = new TextEncoder();
        var data = encoder.encode(text);
        var hashBuffer = await crypto.subtle.digest(algorithm, data);
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    },

    hashAll: async function (text) {
        var algos = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
        var self = this;
        var results = await Promise.all(algos.map(async function (algo) {
            return { algo: algo, hash: await self.hash(text, algo) };
        }));
        return results;
    }
};

// ---- Color conversion (pure math, no DOM) ----

DT.color = {

    parseToRgb: function (input) {
        // HEX
        var hexMatch = input.match(/^#?([0-9a-f]{3,8})$/i);
        if (hexMatch) {
            var h = hexMatch[1];
            if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
            if (h.length === 6 || h.length === 8) {
                return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
            }
        }
        // RGB
        var rgbMatch = input.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
        if (rgbMatch) {
            return { r: Math.min(255, +rgbMatch[1]), g: Math.min(255, +rgbMatch[2]), b: Math.min(255, +rgbMatch[3]) };
        }
        // HSL
        var hslMatch = input.match(/hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?/i);
        if (hslMatch) {
            return DT.color.hslToRgb(+hslMatch[1], +hslMatch[2], +hslMatch[3]);
        }
        return null;
    },

    rgbToHex: function (r, g, b) {
        return '#' + [r, g, b].map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    },

    rgbToHsl: function (r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    },

    hslToRgb: function (h, s, l) {
        h /= 360; s /= 100; l /= 100;
        var r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            function hue2rgb(p, q, t) {
                if (t < 0) t += 1; if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    },

    luminance: function (r, g, b) {
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }
};

window.DT = DT;
