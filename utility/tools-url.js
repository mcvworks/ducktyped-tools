// ============================================
// QUACKTOOLS — URL Tools
// Safety, Redirect, Broken Link, Metadata
// ============================================

// URL TOOLS
// ============================================

// URL Safety Checker
async function checkURLSafety() {
    const url = document.getElementById('urlToCheck').value.trim();
    const resultsDiv = document.getElementById('urlSafetyResults');
    
    if (!url) {
        resultsDiv.innerHTML = '<div class="error">Please enter a URL!</div>';
        return;
    }
    
    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        resultsDiv.innerHTML = '<div class="error">Invalid URL format! Please include http:// or https://</div>';
        return;
    }
    
    resultsDiv.innerHTML = '<div class="success">🔍 Checking URL safety...</div>';
    
    try {
        let html = sectionHeading('Safety Check Results');
        html += '<div class="dns-results">';

        const urlObj = new URL(url);

        // 1. Protocol Check
        const isHTTPS = urlObj.protocol === 'https:';
        html += resultRow(isHTTPS ? '✅' : '⚠️', 'SSL/HTTPS', isHTTPS ? 'Secure HTTPS connection' : 'Warning: Not using HTTPS', isHTTPS ? 'text-success' : 'text-warning');
        
        // 2. Domain Pattern Check
        const suspiciousPatterns = [
            { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, name: 'IP address instead of domain' },
            { pattern: /-{2,}/, name: 'Multiple consecutive hyphens' },
            { pattern: /\.tk$|\.ml$|\.ga$|\.cf$|\.gq$/i, name: 'Free domain extension (common in phishing)' },
            { pattern: /[0-9]{5,}/, name: 'Long number sequences' },
            { pattern: /\@/, name: 'Contains @ symbol (URL trick)' }
        ];
        
        let suspiciousFound = false;
        suspiciousPatterns.forEach(check => {
            if (check.pattern.test(url)) {
                suspiciousFound = true;
                html += resultRow('⚠️', 'Pattern Warning', 'Detected: ' + escapeHtml(check.name), 'text-warning');
            }
        });

        if (!suspiciousFound) {
            html += resultRow('✅', 'URL Pattern', 'No suspicious patterns detected', 'text-success');
        }
        
        // 3. Domain Length Check
        const domainLength = urlObj.hostname.length;
        const isReasonableLength = domainLength < 60;
        html += resultRow(isReasonableLength ? '✅' : '⚠️', 'Domain Length', domainLength + ' characters' + (!isReasonableLength ? ' (unusually long)' : ''), isReasonableLength ? 'text-success' : 'text-warning');

        // 4. Homograph Attack Check (lookalike characters)
        const hasSuspiciousChars = /[а-яА-Я]|[α-ωΑ-Ω]/.test(urlObj.hostname);
        html += resultRow(!hasSuspiciousChars ? '✅' : '⚠️', 'Character Set', hasSuspiciousChars ? 'Contains non-Latin characters (possible homograph attack)' : 'Standard Latin characters', !hasSuspiciousChars ? 'text-success' : 'text-warning');

        // 5. Port Check
        const port = urlObj.port;
        const hasUnusualPort = port && port !== '80' && port !== '443';
        if (hasUnusualPort) {
            html += resultRow('⚠️', 'Unusual Port', 'Using port ' + escapeHtml(port) + ' (non-standard)', 'text-warning');
        }
        
        html += '</div>';
        
        // Summary
        const warningCount = (suspiciousFound ? 1 : 0) + (!isHTTPS ? 1 : 0) + (!isReasonableLength ? 1 : 0) + 
                            (hasSuspiciousChars ? 1 : 0) + (hasUnusualPort ? 1 : 0);
        
        const variant = warningCount === 0 ? 'success' : warningCount <= 2 ? 'warning' : 'error';
        let assessmentText;
        if (warningCount === 0) assessmentText = '<span class="text-success">✅ URL appears safe - no warnings detected</span>';
        else if (warningCount <= 2) assessmentText = '<span class="text-warning">⚠️ ' + warningCount + ' warning(s) - proceed with caution</span>';
        else assessmentText = '<span class="text-error">🚨 ' + warningCount + ' warnings - high risk URL</span>';
        html += resultSummary('<strong>Overall Assessment:</strong><br>' + assessmentText, variant);

        // Disclaimer
        html += infoNote('<strong>Note:</strong> This is a basic pattern-based check. For comprehensive malware/phishing detection, use dedicated security services like Google Safe Browsing or VirusTotal.');
        
        resultsDiv.innerHTML = html;
        
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error checking URL: ${error.message}</div>`;
    }
}

// URL Redirect Checker
async function checkRedirects() {
    await runTool({
        inputId: 'urlToTrace',
        resultsId: 'urlRedirectResults',
        tool: 'redirect',
        validate: validateUrlInput,
        loadingMsg: '🔄 Tracing redirects...',
        errorPrefix: 'Error tracing redirects',
        getPayload: (url) => ({ url }),
        render: (data, url) => {
            let html = resultHeading('Redirect Chain');
            const chain = data.chain || [];
            if (data.hops > 0) {
                let rows = '';
                chain.forEach((step, index) => {
                    rows += resultRow('🔗', `Step ${index + 1}: ${step.statusCode || 'N/A'}`, escapeHtml(step.url));
                });
                html += resultWrap(rows);
                html += resultSummary(`<strong>Summary:</strong> ${data.hops} redirect(s) detected<br>Final destination: <span class="text-success">${escapeHtml(data.finalUrl || chain[chain.length - 1].url)}</span>`, 'success');
            } else {
                html += '<div class="success">✅ No redirects - URL loads directly</div>';
                html += resultSummary(`Direct URL: <span class="text-success">${escapeHtml(data.finalUrl || url)}</span>`, 'success');
            }
            return html;
        }
    });
}

// Broken Link Checker
async function checkLinkStatus() {
    const startTime = Date.now();
    await runTool({
        inputId: 'urlToTest',
        resultsId: 'urlStatusResults',
        tool: 'urlstatus',
        validate: validateUrlInput,
        loadingMsg: '⏳ Checking link status...',
        errorPrefix: 'Error checking link',
        getPayload: (url) => ({ url }),
        render: (data) => {
            // Prefer the server-measured time; the client-side delta includes API overhead
            const responseTime = data.responseTime != null ? data.responseTime : Date.now() - startTime;
            const statusCode = data.statusCode || 0;
            let statusIcon = '✅', statusText = 'Working', colorClass = 'text-success', variant = 'success';
            if (statusCode >= 400) { statusIcon = '❌'; statusText = 'Broken'; colorClass = 'text-error'; variant = 'error'; }
            else if (statusCode >= 300) { statusIcon = '🔄'; statusText = 'Redirect'; colorClass = 'text-warning'; variant = 'warning'; }

            let rows = resultRow(statusIcon, 'HTTP Status', `<span class="${colorClass}">${statusCode} - ${statusText}</span>`);
            rows += resultRow('⏱️', 'Response Time', `<span class="text-muted">${responseTime}ms</span>`);
            if (data.server) rows += resultRow('🖥️', 'Server', `<span class="text-muted">${escapeHtml(data.server)}</span>`);
            if (data.contentType) rows += resultRow('📄', 'Content Type', `<span class="text-muted">${escapeHtml(data.contentType)}</span>`);

            let summaryText;
            if (statusCode >= 200 && statusCode < 300) summaryText = `<span class="text-success">✅ Link is working properly</span>`;
            else if (statusCode >= 300 && statusCode < 400) summaryText = `<span class="text-warning">🔄 Link redirects to another location</span>`;
            else if (statusCode >= 400) summaryText = `<span class="text-error">❌ Link is broken (${statusCode} error)</span>`;
            else summaryText = `<span class="text-muted">Cannot determine status</span>`;

            return resultHeading('Link Status Results') + resultWrap(rows) + resultSummary(`<strong>Summary:</strong> ${summaryText}`, variant);
        }
    });
}

// URL Metadata Extractor
async function extractMetadata() {
    await runTool({
        inputId: 'urlToExtract',
        resultsId: 'urlMetadataResults',
        tool: 'metadata',
        validate: validateUrlInput,
        loadingMsg: '📄 Extracting metadata...',
        errorPrefix: 'Error extracting metadata',
        getPayload: (url) => ({ url }),
        render: (data) => {
            let rows = '';
            if (data.title) rows += resultRow('📌', 'Title', escapeHtml(data.title));
            if (data.description) rows += resultRow('📝', 'Description', escapeHtml(data.description));
            if (data.ogTitle && data.ogTitle !== data.title) rows += resultRow('🎴', 'OG Title', escapeHtml(data.ogTitle));
            if (data.ogDescription && data.ogDescription !== data.description) rows += resultRow('🎴', 'OG Description', escapeHtml(data.ogDescription));
            if (data.ogImage) {
                const safeUrl = escapeHtml(data.ogImage);
                rows += resultRow('🖼️', 'OG Image', `<img src="${safeUrl}" style="max-width: 100%; max-height: 200px; margin-top: 10px; border-radius: 6px; border: 1px solid var(--border-color);" onerror="this.style.display='none'"><br><a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); font-size: 0.9em;">${safeUrl}</a>`);
            }
            if (data.keywords) rows += resultRow('🏷️', 'Keywords', escapeHtml(data.keywords));
            if (data.author) rows += resultRow('✍️', 'Author', escapeHtml(data.author));

            return resultHeading('Page Metadata') + resultWrap(rows)
                + resultSummary(`<p><strong>Social Media Preview:</strong> This is how the link will appear when shared on social media platforms like Facebook, Twitter, LinkedIn, etc.</p>`);
        }
    });
}

// ============================================
// SECURITY HEADERS CHECKER (Uses Worker)
// ============================================
async function checkSecurityHeaders() {
    // Auto-add https:// if missing before validation
    const inputEl = document.getElementById('secHeadersUrl');
    let urlVal = inputEl.value.trim();
    if (urlVal && !urlVal.startsWith('http://') && !urlVal.startsWith('https://')) {
        urlVal = 'https://' + urlVal;
        inputEl.value = urlVal;
    }

    await runTool({
        inputId: 'secHeadersUrl',
        resultsId: 'secHeadersResults',
        tool: 'secheaders',
        validate: validateUrlInput,
        loadingMsg: '🛡️ Checking security headers...',
        errorPrefix: 'Error checking security headers',
        getPayload: (url) => ({ url }),
        render: (data) => {
            const gradeColors = { 'A+': 'var(--success-color)', 'A': 'var(--success-color)', 'B': '#F2C200', 'C': '#F2C200', 'D': 'var(--error-color)', 'F': 'var(--error-color)' };
            const gradeColor = gradeColors[data.grade] || 'var(--text-secondary)';
            const variant = (data.score >= 70) ? 'success' : (data.score >= 40) ? 'warning' : 'error';

            let html = `<div style="text-align: center; margin: 20px 0;"><div style="display: inline-block; width: 80px; height: 80px; line-height: 80px; border-radius: 50%; background: ${gradeColor}; color: #111318; font-size: 2em; font-weight: 800; font-family: var(--font-mono);">${escapeHtml(data.grade)}</div><div class="text-muted" style="margin-top: 8px; font-size: 0.9em;">Score: ${data.score}%</div></div>`;

            let rows = '';
            if (data.checks) {
                for (const [headerName, check] of Object.entries(data.checks)) {
                    const icon = check.present ? '✅' : '❌';
                    let val = '';
                    if (check.present && check.value) {
                        val = `<span class="text-success">Present</span><br><code style="font-size: 0.85em; word-break: break-all;" class="text-muted">${escapeHtml(check.value.substring(0, 200))}${check.value.length > 200 ? '...' : ''}</code>`;
                    } else {
                        val = `<span class="text-error">Missing</span>`;
                        if (check.recommendation) val += `<br><small class="text-muted">💡 ${escapeHtml(check.recommendation)}</small>`;
                    }
                    rows += resultRow(icon, headerName, val);
                }
            }
            html += resultWrap(rows);

            const presentCount = data.checks ? Object.values(data.checks).filter(c => c.present).length : 0;
            const totalCount = data.checks ? Object.keys(data.checks).length : 0;
            html += resultSummary(`<strong>Summary:</strong> ${presentCount} of ${totalCount} security headers present`, variant);
            return html;
        }
    });
}

// ============================================
// TECH STACK DETECTOR (Uses Worker)
// ============================================
async function detectTechStack() {
    await runTool({
        inputId: 'techDetectUrl',
        resultsId: 'techDetectResults',
        tool: 'techdetect',
        validate: validateUrlInput,
        loadingMsg: '🔍 Detecting technologies...',
        errorPrefix: 'Error detecting technologies',
        getPayload: (url) => ({ url }),
        render: (data) => {
            const categoryIcons = { 'Server/Hosting': '🖥️', 'CMS': '📝', 'JS Framework': '⚛️', 'JS Library': '📦', 'CSS Framework': '🎨', 'CDN/Security': '🛡️', 'Analytics': '📊', 'E-commerce': '🛒', 'Website Builder': '🏗️', 'Payment': '💳', 'Security': '🔒', 'Hosting': '☁️', 'Other': '🔧' };
            let rows = '';
            if (data.technologies && data.technologies.length > 0) {
                const groups = {};
                data.technologies.forEach(tech => { const cat = tech.category || 'Other'; if (!groups[cat]) groups[cat] = []; groups[cat].push(tech); });
                for (const [category, techs] of Object.entries(groups)) {
                    const icon = categoryIcons[category] || '🔧';
                    let val = techs.map(t => `<strong>${escapeHtml(t.name)}</strong>${t.evidence ? ` <small class="text-muted">(${escapeHtml(t.evidence)})</small>` : ''}`).join('<br>');
                    rows += resultRow(icon, category, val);
                }
            } else {
                rows += resultRow('🔧', 'No technologies detected', '<span class="text-muted">Could not identify any known technologies on this page.</span>');
            }
            return resultHeading(`Technologies Detected (${data.count || 0})`) + resultWrap(rows)
                + resultSummary(`<p><strong>Note:</strong> Detection is based on HTTP headers and HTML content analysis. Some technologies may not be detectable if they don't leave visible signatures.</p>`);
        }
    });
}

// ============================================
// ROBOTS.TXT & SITEMAP ANALYZER (Uses Worker)
// ============================================
async function analyzeRobots() {
    await runTool({
        inputId: 'robotsUrl',
        resultsId: 'robotsResults',
        tool: 'robots',
        validate: validateUrlInput,
        loadingMsg: '🤖 Analyzing robots.txt & sitemap...',
        errorPrefix: 'Error analyzing robots',
        getPayload: (url) => ({ url }),
        render: (data, url) => {
            let rows = '';

            // Robots.txt
            if (data.robotsTxt) {
                const lines = data.robotsTxt.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
                const allows = lines.filter(l => l.toLowerCase().startsWith('allow:'));
                const disallows = lines.filter(l => l.toLowerCase().startsWith('disallow:'));
                const userAgents = lines.filter(l => l.toLowerCase().startsWith('user-agent:'));
                const sitemaps = lines.filter(l => l.toLowerCase().startsWith('sitemap:'));

                let val = `<strong>User-Agents:</strong> ${userAgents.length} rule(s)<br><strong>Allow Rules:</strong> ${allows.length}<br><strong>Disallow Rules:</strong> ${disallows.length}<br><strong>Sitemap References:</strong> ${sitemaps.length}<br>`;
                if (disallows.length > 0) {
                    val += `<br><strong>Blocked Paths:</strong><br>`;
                    disallows.slice(0, 10).forEach(d => { val += `🚫 ${escapeHtml(d.split(':').slice(1).join(':').trim() || '(empty)')}<br>`; });
                    if (disallows.length > 10) val += `<em>... and ${disallows.length - 10} more</em><br>`;
                }
                val += `<br><details style="cursor: pointer;"><summary style="color: var(--primary-color); font-weight: 600;">View Full robots.txt</summary><pre style="margin-top: 10px; padding: 12px; background: var(--card-background); border: 1px solid var(--border-color); border-radius: 6px; overflow-x: auto; font-size: 0.85em; max-height: 300px; overflow-y: auto;">${escapeHtml(data.robotsTxt)}</pre></details>`;
                rows += resultRow('✅', 'robots.txt Found', val);
            } else {
                rows += resultRow('❌', 'robots.txt Not Found', `<span class="text-warning">No robots.txt file found at ${escapeHtml(data.baseUrl || url)}/robots.txt</span>`);
            }

            // Sitemap
            if (data.sitemap) {
                let val = `<strong>URL:</strong> <a href="${escapeHtml(data.sitemap.url)}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color);">${escapeHtml(data.sitemap.url)}</a><br><strong>URLs in Sitemap:</strong> ${data.sitemap.urlCount}<br>`;
                if (data.sitemap.sampleUrls && data.sitemap.sampleUrls.length > 0) {
                    val += `<br><strong>Sample URLs (first ${Math.min(data.sitemap.sampleUrls.length, 10)}):</strong><br>`;
                    data.sitemap.sampleUrls.slice(0, 10).forEach(u => { val += `• <a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); font-size: 0.9em;">${escapeHtml(u)}</a><br>`; });
                    if (data.sitemap.sampleUrls.length > 10) val += `<em>... and more</em><br>`;
                }
                rows += resultRow('✅', 'Sitemap Found', val);
            } else {
                rows += resultRow('⚠️', 'No Sitemap Found', '<span class="text-warning">No sitemap reference found in robots.txt</span>');
            }

            return resultHeading(`Robots & Sitemap Analysis for ${escapeHtml(data.baseUrl || url)}`) + resultWrap(rows)
                + resultSummary(`<p><strong>SEO Tips:</strong> A well-configured robots.txt and XML sitemap help search engines crawl and index your site efficiently. Make sure your sitemap includes all important pages and is referenced in robots.txt.</p>`);
        }
    });
}

// ============================================
