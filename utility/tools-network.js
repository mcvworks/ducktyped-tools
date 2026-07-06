// ============================================
// QUACKTOOLS — Network & Lookup Tools
// DNS, WHOIS, SSL, Port, Ping, ISP, MAC, Notes, SMTP
// ============================================

// DNS RECORD CHECKER (Uses Worker)
// ============================================
async function checkDNS(dkimSelector = '', additionalSelectors = '') {
    const domain = document.getElementById('domainName').value.trim();
    const resultsDiv = document.getElementById('dnsResults');

    if (!domain) {
        resultsDiv.innerHTML = '<div class="error">Please enter a domain name!</div>';
        return;
    }

    if (!workerAvailable) {
        resultsDiv.innerHTML = '<div class="error">Backend service unavailable. Please try again later.</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="success">Checking DNS records...</div>';

    try {
        const data = await callWorker('dns', { domain });

        if (CONFIG.DEBUG) console.log('DNS result:', data);

        let html = '<div class="dns-results">';
        let hasAnyResults = false;
        let spfRecord = null;
        let dmarcRecord = null;

        // A Records
        if (data.A && data.A.length > 0) {
            hasAnyResults = true;
            html += '<div class="dns-record"><strong>A Records:</strong><div class="dns-record-value">';
            data.A.forEach(ip => { html += `${escapeHtml(ip)}<br>`; });
            html += '</div></div>';
        }

        // AAAA Records
        if (data.AAAA && data.AAAA.length > 0) {
            hasAnyResults = true;
            html += '<div class="dns-record"><strong>AAAA Records:</strong><div class="dns-record-value">';
            data.AAAA.forEach(ip => { html += `${escapeHtml(ip)}<br>`; });
            html += '</div></div>';
        }

        // MX Records
        if (data.MX && data.MX.length > 0) {
            hasAnyResults = true;
            html += '<div class="dns-record"><strong>MX Records:</strong><div class="dns-record-value">';
            data.MX.forEach(mx => { html += `${escapeHtml(mx.exchange)} (priority: ${mx.priority})<br>`; });
            html += '</div></div>';
        }

        // NS Records
        if (data.NS && data.NS.length > 0) {
            hasAnyResults = true;
            html += '<div class="dns-record"><strong>NS Records:</strong><div class="dns-record-value">';
            data.NS.forEach(ns => { html += `${escapeHtml(ns)}<br>`; });
            html += '</div></div>';
        }

        // CNAME Records
        if (data.CNAME && data.CNAME.length > 0) {
            hasAnyResults = true;
            html += '<div class="dns-record"><strong>CNAME Records:</strong><div class="dns-record-value">';
            data.CNAME.forEach(cn => { html += `${escapeHtml(cn)}<br>`; });
            html += '</div></div>';
        }

        // SOA Record
        if (data.SOA && data.SOA.nsname) {
            hasAnyResults = true;
            html += '<div class="dns-record"><strong>SOA Record:</strong><div class="dns-record-value">';
            html += `Primary NS: ${escapeHtml(data.SOA.nsname)}<br>`;
            html += `Hostmaster: ${escapeHtml(data.SOA.hostmaster)}<br>`;
            html += `Serial: ${data.SOA.serial}<br>`;
            html += `Refresh: ${data.SOA.refresh}s | Retry: ${data.SOA.retry}s | Expire: ${data.SOA.expire}s<br>`;
            html += `Min TTL: ${data.SOA.minttl}s<br>`;
            html += '</div></div>';
        }

        // TXT Records
        if (data.TXT && data.TXT.length > 0) {
            hasAnyResults = true;
            html += '<div class="dns-record"><strong>TXT Records:</strong><div class="dns-record-value">';
            data.TXT.forEach(txt => {
                const txtStr = Array.isArray(txt) ? txt.join('') : txt;
                html += `${escapeHtml(txtStr)}<br>`;
                if (txtStr.includes('v=spf1')) {
                    spfRecord = txtStr;
                }
            });
            html += '</div></div>';
        }

        // CAA Records
        if (data.CAA && data.CAA.length > 0) {
            hasAnyResults = true;
            html += '<div class="dns-record"><strong>CAA Records:</strong><div class="dns-record-value">';
            data.CAA.forEach(caa => {
                const flags = caa.critical ? ' (critical)' : '';
                const tag = caa.issue ? 'issue' : caa.issuewild ? 'issuewild' : caa.iodef ? 'iodef' : '';
                const value = caa.issue || caa.issuewild || caa.iodef || JSON.stringify(caa);
                html += `${tag}: ${escapeHtml(value)}${flags}<br>`;
            });
            html += '</div></div>';
        }

        // SPF Record (from backend's dedicated field)
        if (data.SPF && data.SPF.length > 0) {
            hasAnyResults = true;
            spfRecord = data.SPF[0];
        }

        // DMARC Record (from backend's dedicated field)
        if (data.DMARC && data.DMARC.length > 0) {
            hasAnyResults = true;
            dmarcRecord = data.DMARC[0];
            html += '<div class="dns-record"><strong>DMARC Record:</strong><div class="dns-record-value">';
            html += `${escapeHtml(dmarcRecord)}<br>`;
            html += '</div></div>';
        }

        // SPF Summary
        if (spfRecord) {
            html += resultRow('✓', 'SPF Record', '<span class="text-success">✓ SPF record found</span><br><code style="display: block; margin-top: 6px;" class="output-box">' + escapeHtml(spfRecord) + '</code>');
        }

        // DKIM Check Section
        html += '<div class="dns-record">';
        html += '<strong>DKIM Records:</strong>';
        html += '<div class="dns-record-value">';

        // Show DKIM results from backend if available
        if (data.DKIM && typeof data.DKIM === 'object' && Object.keys(data.DKIM).length > 0) {
            Object.entries(data.DKIM).forEach(([selector, record]) => {
                html += `<div style="margin-bottom: 8px;"><strong style="color: var(--success-color);">✓ ${escapeHtml(selector)}:</strong><br>`;
                html += `<span style="font-size: 0.9em; word-break: break-all;">${escapeHtml(typeof record === 'string' ? record : JSON.stringify(record))}</span></div>`;
            });
        }

        html += 'Check DKIM with common selectors:<br><br>';
        const safeDomain = domain.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        html += `<button onclick="checkDKIMSelector('${safeDomain}', 'default')" style="margin: 4px; padding: 8px 12px; font-size: 0.85em;">default</button>`;
        html += `<button onclick="checkDKIMSelector('${safeDomain}', 'google')" style="margin: 4px; padding: 8px 12px; font-size: 0.85em;">google</button>`;
        html += `<button onclick="checkDKIMSelector('${safeDomain}', 'k1')" style="margin: 4px; padding: 8px 12px; font-size: 0.85em;">k1</button>`;
        html += `<button onclick="checkDKIMSelector('${safeDomain}', 's1')" style="margin: 4px; padding: 8px 12px; font-size: 0.85em;">s1</button>`;
        html += `<button onclick="checkDKIMSelector('${safeDomain}', 's2')" style="margin: 4px; padding: 8px 12px; font-size: 0.85em;">s2</button>`;
        html += `<button onclick="checkDKIMSelector('${safeDomain}', 'selector1')" style="margin: 4px; padding: 8px 12px; font-size: 0.85em;">selector1</button>`;
        html += `<button onclick="checkDKIMSelector('${safeDomain}', 'selector2')" style="margin: 4px; padding: 8px 12px; font-size: 0.85em;">selector2</button>`;
        html += '</div>';
        html += '<div id="dkimResults" style="margin-top: 10px;"></div>';
        html += '</div>';

        if (!hasAnyResults) {
            html += '<div class="error">No DNS records found for this domain.</div>';
        }

        html += '</div>';
        resultsDiv.innerHTML = html;

    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// Check specific DKIM selector
async function checkDKIMSelector(domain, selector) {
    const dkimResults = document.getElementById('dkimResults');
    if (!dkimResults) return;
    
    dkimResults.innerHTML = `<div class="success">Checking DKIM selector: ${selector}...</div>`;
    
    try {
        const dkimDomain = `${selector}._domainkey.${domain}`;
        const data = await callWorker('dns', { domain: dkimDomain, recordType: 'TXT' });
        
        // Handle both formats: new backend (data.TXT) and legacy (data.Answer)
        let records = [];
        if (data && data.TXT && data.TXT.length > 0) {
            records = data.TXT.map(txt => Array.isArray(txt) ? txt.join('') : txt);
        } else if (data && data.Answer && data.Answer.length > 0) {
            records = data.Answer.map(r => r.data);
        }

        if (records.length > 0) {
            let html = `<div style="margin-top: 10px; padding: 10px; background: var(--success-bg); border-left: 3px solid var(--success-color); border-radius: 4px;">`;
            html += `<strong style="color: var(--success-color);">✓ DKIM Found (${selector}):</strong><br>`;
            html += `<div style="margin-top: 8px; font-size: 0.9em; word-break: break-all; color: var(--text-primary); font-family: var(--font-mono); line-height: 1.6;">`;
            records.forEach(txt => {
                html += `<span style="color: var(--text-secondary);">${escapeHtml(txt)}</span><br>`;
            });
            html += `</div></div>`;
            dkimResults.innerHTML = html;
        } else {
            dkimResults.innerHTML = `<div style="margin-top: 10px; color: var(--text-secondary);">No DKIM record found for selector: ${selector}</div>`;
        }
    } catch (error) {
        dkimResults.innerHTML = `<div style="margin-top: 10px; color: var(--text-secondary);">No DKIM record found for selector: ${selector}</div>`;
    }
}

// ============================================
// WHOIS / IP LOOKUP (Uses Worker)
// ============================================
async function lookupWhois() {
    let input = document.getElementById('whoisInput').value.trim();
    const resultsDiv = document.getElementById('whoisResults');

    // If blank, get user's IP automatically
    if (!input) {
        resultsDiv.innerHTML = '<div class="success">Detecting your IP address...</div>';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            input = ipData.ip;
            if (CONFIG.DEBUG) console.log('Auto-detected IP:', input);
        } catch (error) {
            resultsDiv.innerHTML = '<div class="error">Could not detect your IP. Please enter a domain or IP manually.</div>';
            return;
        }
    }

    if (!workerAvailable) {
        resultsDiv.innerHTML = '<div class="error">Backend service unavailable. Please try again later.</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="success">Looking up information...</div>';

    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(input);

    try {
        if (isIP) {
            // IP Lookup
            const data = await callWorker('isp', { ip: input });

            let rows = '';
            rows += resultRow('🌐', 'IP', escapeHtml(input));
            rows += resultRow('📡', 'ISP / Organization', escapeHtml(data.org || 'Unknown'));
            rows += resultRow('🏢', 'ASN', escapeHtml(data.asn || 'Unknown'));
            rows += resultRow('🌍', 'Country', escapeHtml(data.country_name || data.country || 'Unknown'));
            rows += resultRow('📍', 'Region', escapeHtml(data.region || 'Unknown'));
            rows += resultRow('🏙️', 'City', escapeHtml(data.city || 'Unknown'));
            rows += resultRow('🕐', 'Timezone', escapeHtml(data.timezone || 'Unknown'));

            resultsDiv.innerHTML = resultHeading('IP Information for ' + escapeHtml(input)) + resultWrap(rows);
        } else {
            // Domain WHOIS
            const data = await callWorker('whois', { domain: input });

            let rows = '';
            if (data.registrar) {
                rows += resultRow('🏛️', 'Registrar', escapeHtml(data.registrar));
            }
            const fmtWhoisDate = (d) => {
                const t = new Date(d);
                return isNaN(t) ? escapeHtml(d) : t.toLocaleDateString();
            };
            if (data.createdDate) {
                rows += resultRow('📅', 'Registered', fmtWhoisDate(data.createdDate));
            }
            if (data.expiryDate) {
                rows += resultRow('📅', 'Expires', fmtWhoisDate(data.expiryDate));
            }
            if (data.updatedDate) {
                rows += resultRow('🔄', 'Last Updated', fmtWhoisDate(data.updatedDate));
            }
            if (data.nameServers && data.nameServers.length > 0) {
                rows += resultRow('🌐', 'Name Servers', data.nameServers.map(ns => escapeHtml(ns)).join('<br>'));
            }
            if (data.status && data.status.length > 0) {
                rows += resultRow('📋', 'Status', data.status.map(s => escapeHtml(s)).join('<br>'));
            }

            let html = resultHeading('WHOIS Information for ' + escapeHtml(input)) + resultWrap(rows);
            html += resultNote('For more details: <a href="https://who.is/whois/' + encodeURIComponent(input) + '" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color);">View full WHOIS</a>');
            resultsDiv.innerHTML = html;
        }
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// ============================================
// SSL CERTIFICATE CHECKER (Uses Worker)
// ============================================
async function checkSSL() {
    await runTool({
        inputId: 'sslDomain',
        resultsId: 'sslResults',
        tool: 'ssl',
        validate: validateDomainInput,
        loadingMsg: 'Checking SSL certificate...',
        errorPrefix: 'Error',
        getPayload: (domain) => ({ domain }),
        render: (data, domain) => {
            const isValid = !data.isExpired && data.validTo;
            const statusIcon = isValid ? '✅' : '❌';
            const expiryWarning = data.isExpiringSoon ? ' ⚠️ Expiring soon!' : '';

            let rows = '';
            rows += resultRow(statusIcon, 'Status', (isValid ? 'Valid' : 'Invalid / Expired') + expiryWarning, isValid ? 'text-success' : 'text-error');
            rows += resultRow('📜', 'Subject', escapeHtml(data.subject || 'N/A'));
            rows += resultRow('🏛️', 'Issuer', escapeHtml(data.issuer || 'N/A'));
            rows += resultRow('📅', 'Valid From', escapeHtml(data.validFrom || 'N/A'));
            rows += resultRow('📅', 'Valid To', escapeHtml(data.validTo || 'N/A'));
            rows += resultRow('⏳', 'Days Remaining', data.daysRemaining !== null ? data.daysRemaining + ' days' : 'N/A');
            rows += resultRow('🔢', 'Serial', '<span style="word-break: break-all;">' + escapeHtml(data.serial || 'N/A') + '</span>');
            rows += resultRow('🔏', 'Fingerprint', '<span style="word-break: break-all;">' + escapeHtml(data.fingerprint || 'N/A') + '</span>');

            return resultHeading('SSL Certificate for ' + escapeHtml(data.domain || domain)) + resultWrap(rows);
        }
    });
}
// ============================================
// PORT SCANNER (Uses Worker)
// ============================================

// Helper function to set port number
function setPort(port, serviceName) {
    const portInput = document.getElementById('portNumber');
    if (portInput) {
        portInput.value = port;
    }
}

async function scanPort(specificPort = null) {
    const host = document.getElementById('portScanHost').value.trim();
    const resultsDiv = document.getElementById('portResults');
    
    // Use specific port if provided, otherwise get from input field
    const port = specificPort !== null ? specificPort : parseInt(document.getElementById('portNumber').value);

    if (!host) {
        resultsDiv.innerHTML = '<div class="error">Please enter a host!</div>';
        return;
    }

    if (!workerAvailable) {
        resultsDiv.innerHTML = '<div class="error">Backend service unavailable. Please try again later.</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="success">Scanning port...</div>';

    try {
        const data = await callWorker('port', { host, port: parseInt(port) });

        let statusIcon, statusText, statusColor;
        if (data.state === 'open') {
            statusIcon = '✅'; statusText = 'Open'; statusColor = 'text-success';
        } else if (data.state === 'closed') {
            statusIcon = '❌'; statusText = 'Closed (connection refused)'; statusColor = 'text-error';
        } else if (data.state === 'filtered') {
            statusIcon = '🛡️'; statusText = 'Filtered (no response — a firewall may be dropping probes)'; statusColor = 'text-warning';
        } else {
            statusIcon = '⚠️'; statusText = 'Unknown (' + escapeHtml(String(data.state)) + ')'; statusColor = 'text-warning';
        }

        let rows = '';
        rows += resultRow('🖥️', 'Host', escapeHtml(host));
        rows += resultRow('🔌', 'Port', String(data.port) + (data.service ? ' (' + escapeHtml(data.service) + ')' : ''));
        rows += resultRow(statusIcon, 'Status', statusText, statusColor);

        let html = resultHeading('Port Scan Results') + resultWrap(rows);

        if (parseInt(port) === 25) {
            html += infoNote('<strong>Port 25 caveat:</strong> Our scanning server\'s hosting provider blocks outbound port 25 (a standard anti-spam policy), so this result is not meaningful. Test port 25 from your own network, e.g. <code>telnet ' + escapeHtml(host) + ' 25</code>.');
        } else if (data.state === 'filtered') {
            html += infoNote('<strong>Filtered ≠ down:</strong> some providers silently drop scan probes from data-center IPs. The service may still be reachable from your own network.');
        }

        resultsDiv.innerHTML = html;
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// Add custom port number
function addCustomPort() {
    const input = document.getElementById('customPortNumber');
    const portNumber = parseInt(input.value);
    const customPortsList = document.getElementById('customPortsList');
    
    // Validate port number
    if (!portNumber || portNumber < 1 || portNumber > 65535) {
        showToast('Please enter a valid port number (1-65535)', 'error');
        return;
    }
    
    // Check if port already exists in checkboxes
    const existingCheckbox = document.querySelector(`.port-checkbox[value="${portNumber}"]`);
    if (existingCheckbox) {
        showToast(`Port ${portNumber} is already in the list above!`, 'error');
        input.value = '';
        return;
    }
    
    // Check if custom port already added
    const existingCustom = document.querySelector(`.custom-port-tag[data-port="${portNumber}"]`);
    if (existingCustom) {
        showToast(`Port ${portNumber} is already added!`, 'error');
        input.value = '';
        return;
    }
    
    // Create custom port tag
    const portTag = document.createElement('span');
    portTag.className = 'custom-port-tag';
    portTag.setAttribute('data-port', portNumber);
    portTag.setAttribute('data-name', `Port ${portNumber}`);
    portTag.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
        color: #000000;
        border-radius: 6px;
        font-size: 0.85em;
        font-weight: 600;
    `;
    portTag.innerHTML = `
        ${portNumber}
        <span onclick="removeCustomPort(${portNumber})" style="cursor: pointer; font-weight: bold; margin-left: 2px;">×</span>
    `;
    
    customPortsList.appendChild(portTag);
    input.value = '';
}

function removeCustomPort(portNumber) {
    const portTag = document.querySelector(`.custom-port-tag[data-port="${portNumber}"]`);
    if (portTag) {
        portTag.remove();
    }
}

// Scan all common ports at once
async function scanSelectedPorts() {
    const host = document.getElementById('portScanHost').value.trim();
    const resultsDiv = document.getElementById('portResults');
    
    if (!host) {
        resultsDiv.innerHTML = '<div class="error">Please enter a host!</div>';
        return;
    }

    if (!workerAvailable) {
        resultsDiv.innerHTML = '<div class="error">Backend service unavailable. Please try again later.</div>';
        return;
    }

    // Get selected ports from checkboxes
    const checkboxes = document.querySelectorAll('.port-checkbox:checked');
    
    // Get custom ports
    const customPortTags = document.querySelectorAll('.custom-port-tag');
    const customPorts = Array.from(customPortTags).map(tag => ({
        port: parseInt(tag.getAttribute('data-port')),
        name: tag.getAttribute('data-name')
    }));
    
    // Combine checkbox ports and custom ports
    const checkboxPorts = Array.from(checkboxes).map(cb => ({
        port: parseInt(cb.value),
        name: cb.getAttribute('data-name')
    }));
    
    const selectedPorts = [...checkboxPorts, ...customPorts];
    
    if (selectedPorts.length === 0) {
        resultsDiv.innerHTML = '<div class="error">Please select at least one port to scan or add a custom port!</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="success">🔍 Scanning ' + selectedPorts.length + ' port' + (selectedPorts.length > 1 ? 's' : '') + '... This may take a moment.</div>';

    try {
        let html = sectionHeading('Port Scan Results for ' + host);
        html += '<div class="dns-results">';

        let scannedCount = 0;
        let openCount = 0;

        for (const portInfo of selectedPorts) {
            try {
                const data = await callWorker('port', { host, port: portInfo.port });
                scannedCount++;

                let statusIcon = '';
                let statusText = '';
                let statusColor = '';

                if (data.open === null) {
                    statusIcon = '⚠️'; statusText = 'Cannot scan'; statusColor = 'text-warning';
                } else if (data.open) {
                    statusIcon = '✅'; statusText = 'OPEN'; statusColor = 'text-success';
                    openCount++;
                } else {
                    statusIcon = '❌'; statusText = 'Closed'; statusColor = 'text-muted';
                }

                html += resultRow(statusIcon, 'Port ' + portInfo.port + ' - ' + portInfo.name, statusText, statusColor);

                // Update progress
                const progress = `<div class="success">🔍 Scanning... ${scannedCount}/${selectedPorts.length} ports checked (${openCount} open)</div>`;
                resultsDiv.innerHTML = progress + html + '</div>';

                // Small delay to prevent overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.error(`Error scanning port ${portInfo.port}:`, error);
                html += resultRow('⚠️', 'Port ' + portInfo.port + ' - ' + portInfo.name, 'Error scanning', 'text-error');
            }
        }

        html += '</div>';

        // Summary
        html += resultSummary(
            '<strong>📊 Scan Summary</strong><br>' +
            '<strong>' + scannedCount + '</strong> ports scanned<br>' +
            '<strong class="text-success">' + openCount + '</strong> ports open<br>' +
            '<strong>' + (scannedCount - openCount) + '</strong> ports closed/filtered'
        );

        // Note about limitations
        html += infoNote('<strong>Note:</strong> Due to browser security limitations, only HTTP/HTTPS ports (80, 443, 8080, 8443) can be directly tested. Other ports show estimated status based on connection attempts. For accurate scanning of all ports, use dedicated tools like Nmap.');

        resultsDiv.innerHTML = html;

    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error during port scan: ${error.message}</div>`;
    }
}

// ============================================
// PING / LATENCY CHECKER (Uses Worker)
// ============================================
async function checkPing() {
    const host = document.getElementById('pingHost').value.trim();
    const resultsDiv = document.getElementById('pingResults');
    const modeEl = document.getElementById('pingMode');
    const mode = modeEl ? modeEl.value : 'icmp';

    if (!host) {
        resultsDiv.innerHTML = '<div class="error">Please enter a host!</div>';
        return;
    }

    if (!workerAvailable) {
        resultsDiv.innerHTML = '<div class="error">Backend service unavailable. Please try again later.</div>';
        return;
    }

    if (mode === 'icmp') {
        resultsDiv.innerHTML = '<div class="success">Sending ICMP ping (4 packets)...</div>';
        try {
            const data = await callWorker('ping', { host });
            if (CONFIG.DEBUG) console.log('ICMP ping data:', data);

            let rows = '';
            rows += resultRow('🖥️', 'Host', escapeHtml(data.host));

            if (data.error) {
                rows += resultRow('❌', 'Error', escapeHtml(data.error), 'text-error');
            } else {
                const loss = data.packetLoss ?? 0;
                const lossColor = loss === 0 ? 'text-success' : loss < 50 ? 'text-warning' : 'text-error';
                rows += resultRow('📦', 'Packet Loss', loss + '%', lossColor);
                if (data.avg != null) {
                    rows += resultRow('⏱️', 'Avg Latency', data.avg + ' ms');
                    rows += resultRow('📊', 'Min / Max', data.min + ' ms / ' + data.max + ' ms');
                } else {
                    rows += resultRow('❌', 'Response', 'No response — host may be blocking ICMP or is unreachable.', 'text-error');
                }
            }

            resultsDiv.innerHTML = resultHeading('ICMP Ping Results') + resultWrap(rows);
        } catch (error) {
            resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    } else {
        resultsDiv.innerHTML = '<div class="success">Checking HTTP response time...</div>';
        try {
            const data = await callWorker('http-latency', { host });
            if (CONFIG.DEBUG) console.log('HTTP latency data:', data);

            let rows = '';
            rows += resultRow('🖥️', 'Host', escapeHtml(data.host));
            rows += resultRow('🔗', 'URL', escapeHtml(data.url));

            if (data.error) {
                rows += resultRow('❌', 'Error', escapeHtml(data.error), 'text-error');
            } else {
                const statusIcon = data.statusCode >= 200 && data.statusCode < 300 ? '✅'
                    : data.statusCode >= 300 && data.statusCode < 400 ? '🔄' : '❌';
                const statusColor = data.statusCode >= 200 && data.statusCode < 300 ? 'text-success'
                    : data.statusCode >= 300 && data.statusCode < 400 ? 'text-warning' : 'text-error';
                rows += resultRow(statusIcon, 'Status', data.statusCode + ' ' + escapeHtml(data.statusText), statusColor);
                rows += resultRow('⏱️', 'Response Time', data.latency + ' ms');
                if (data.contentType) {
                    rows += resultRow('📄', 'Content-Type', escapeHtml(data.contentType));
                }
            }

            resultsDiv.innerHTML = resultHeading('HTTP Latency Results') + resultWrap(rows);
        } catch (error) {
            resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }
}

// ============================================
// ISP CHECKER (Uses Worker)
// ============================================
async function checkISP() {
    let ip = document.getElementById('ispInput').value.trim();
    const resultsDiv = document.getElementById('ispResults');

    // If blank, get user's IP automatically
    if (!ip) {
        resultsDiv.innerHTML = '<div class="success">Detecting your IP address...</div>';
        try {
            let ipData;
            try {
                const res = await fetch('https://api.ipify.org?format=json');
                ipData = await res.json();
            } catch (_) {
                const res = await fetch('https://jsonip.com');
                ipData = await res.json();
            }
            ip = ipData.ip;
            if (CONFIG.DEBUG) console.log('Auto-detected IP:', ip);
        } catch (error) {
            resultsDiv.innerHTML = '<div class="error">Could not detect your IP. Please enter one manually.</div>';
            return;
        }
    }

    if (!workerAvailable) {
        resultsDiv.innerHTML = '<div class="error">Backend service unavailable. Please try again later.</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="success">Checking ISP...</div>';

    try {
        const data = await callWorker('isp', { ip });

        if (CONFIG.DEBUG) console.log('ISP data received:', data);

        let rows = '';
        rows += resultRow('🌐', 'IP', escapeHtml(ip));
        rows += resultRow('📡', 'ISP / Organization', escapeHtml(data.org || 'Unknown'));
        rows += resultRow('🏢', 'ASN', escapeHtml(data.asn || 'Unknown'));
        rows += resultRow('🌍', 'Country', escapeHtml(data.country_name || data.country || 'Unknown'));
        rows += resultRow('📍', 'Region', escapeHtml(data.region || 'Unknown'));
        rows += resultRow('🏙️', 'City', escapeHtml(data.city || 'Unknown'));

        resultsDiv.innerHTML = resultHeading('ISP Information') + resultWrap(rows);
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// ============================================
// MAC ADDRESS LOOKUP (Uses Worker)
// ============================================
async function lookupMAC() {
    await runTool({
        inputId: 'macInput',
        resultsId: 'macResults',
        tool: 'mac',
        loadingMsg: 'Looking up vendor...',
        errorPrefix: 'Error',
        getPayload: (mac) => ({ mac }),
        render: (data, mac) => {
            let rows = '';
            rows += resultRow('🔗', 'MAC', escapeHtml(mac));
            rows += resultRow('🏭', 'Vendor', escapeHtml(data.vendor || 'Unknown'));
            return resultHeading('MAC Address Lookup') + resultWrap(rows);
        }
    });
}

// Generate random MAC address
function generateRandomMAC() {
    const hexDigits = '0123456789ABCDEF';
    let mac = '';
    
    // Generate 6 octets (12 hex digits, formatted as XX:XX:XX:XX:XX:XX)
    for (let i = 0; i < 6; i++) {
        if (i > 0) mac += ':';
        mac += hexDigits[Math.floor(Math.random() * 16)];
        mac += hexDigits[Math.floor(Math.random() * 16)];
    }
    
    // Set the first octet's second-least significant bit to 0 (unicast)
    // and the least significant bit to 1 (locally administered)
    const firstOctet = parseInt(mac.substr(0, 2), 16);
    const modifiedFirstOctet = (firstOctet & 0xFE) | 0x02;
    mac = modifiedFirstOctet.toString(16).toUpperCase().padStart(2, '0') + mac.substr(2);
    
    // Put it in the input field
    document.getElementById('macInput').value = mac;
    
    // Optionally auto-lookup
    lookupMAC();
}

// ============================================
// TRACEROUTE (Uses Worker)
// ============================================
async function runTraceroute() {
    const host = document.getElementById('tracerouteHost').value.trim();
    const resultsDiv = document.getElementById('tracerouteResults');

    if (!host) {
        resultsDiv.innerHTML = '<div class="error">Please enter a host!</div>';
        return;
    }

    if (!workerAvailable) {
        resultsDiv.innerHTML = '<div class="error">Backend service unavailable. Please try again later.</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="success">🛤️ Running traceroute... This may take up to 30 seconds.</div>';

    try {
        const data = await callWorker('traceroute', { host });

        let html = sectionHeading('Traceroute to ' + escapeHtml(data.host || host));
        html += '<div class="dns-results">';

        if (data.hops && data.hops.length > 0) {
            // Collapse runs of consecutive timed-out hops into a single row —
            // our server's network filters ICMP time-exceeded replies, so long
            // timeout runs are routine and not individually informative.
            let i = 0;
            while (i < data.hops.length) {
                const hop = data.hops[i];

                if (hop.timeout) {
                    let j = i;
                    while (j + 1 < data.hops.length && data.hops[j + 1].timeout) j++;
                    const label = i === j ? `Hop ${hop.hop}` : `Hops ${hop.hop}–${data.hops[j].hop}`;
                    html += `<div class="dns-record">`;
                    html += `<strong>⏳ ${label}</strong>`;
                    html += `<div class="dns-record-value" style="color: var(--warning-color);">* * * (no response)</div>`;
                    html += `</div>`;
                    i = j + 1;
                    continue;
                }

                html += `<div class="dns-record">`;
                html += `<strong>✅ Hop ${hop.hop}</strong>`;
                html += `<div class="dns-record-value" style="color: var(--text-secondary);">`;
                if (hop.hostname && hop.hostname !== hop.ip) {
                    html += `<strong>Host:</strong> ${escapeHtml(hop.hostname)}<br>`;
                }
                if (hop.ip) {
                    html += `<strong>IP:</strong> ${hop.ip}<br>`;
                }
                if (hop.times && hop.times.length > 0) {
                    const avg = (hop.times.reduce((a, b) => a + b, 0) / hop.times.length).toFixed(1);
                    html += `<strong>RTT:</strong> ${hop.times.map(t => t + 'ms').join(' / ')} (avg: ${avg}ms)`;
                }
                html += `</div></div>`;
                i++;
            }
        } else {
            html += '<div class="error">No hops returned. Host may be unreachable.</div>';
        }

        html += '</div>';

        // Summary
        if (data.hops && data.hops.length > 0) {
            const totalHops = data.hops.length;
            const timeoutHops = data.hops.filter(h => h.timeout).length;
            html += resultSummary('<strong>Summary:</strong> ' + totalHops + ' hops total, ' + timeoutHops + ' timed out');

            const lastHop = data.hops[data.hops.length - 1];
            if (!lastHop.timeout && timeoutHops >= totalHops - 1) {
                html += infoNote('<strong>Why are the intermediate hops hidden?</strong> Our server\'s network filters the ICMP "time exceeded" replies that traceroute uses to discover routers along the path. The destination\'s reachability and round-trip time are still accurate.');
            }
        }

        resultsDiv.innerHTML = html;
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// ============================================
// REVERSE DNS LOOKUP (Uses Worker)
// ============================================
async function lookupReverseDns() {
    await runTool({
        inputId: 'reverseDnsInput',
        resultsId: 'reverseDnsResults',
        tool: 'reversedns',
        validate: validateIpInput,
        loadingMsg: '🔄 Looking up reverse DNS...',
        errorPrefix: 'Error',
        getPayload: (ip) => ({ ip }),
        render: (data, ip) => {
            let val = '';
            if (data.hostnames && data.hostnames.length > 0) {
                val += '<strong>Hostname(s):</strong><br>';
                data.hostnames.forEach(hostname => { val += '✅ ' + escapeHtml(hostname) + '<br>'; });
            } else {
                val += '<span class="text-warning">⚠️ No reverse DNS (PTR) record found for this IP.</span>';
                if (data.error) val += '<br><small class="text-muted">' + escapeHtml(data.error) + '</small>';
            }

            let rows = resultRow('🔍', 'Reverse DNS for ' + escapeHtml(data.ip || ip), val);
            return resultHeading('Reverse DNS Lookup') + resultWrap(rows)
                + infoNote('<strong>What is Reverse DNS?</strong> A PTR record maps an IP address back to a hostname. It\'s commonly used to verify mail server identity and for security auditing.');
        }
    });
}

// ============================================
// SUBNET CALCULATOR (Uses Worker)
// ============================================
async function calculateSubnet() {
    const ip = document.getElementById('subnetIp').value.trim();
    const cidr = document.getElementById('subnetCidr').value.trim();
    const resultsDiv = document.getElementById('subnetResults');

    if (!ip) {
        resultsDiv.innerHTML = '<div class="error">Please enter an IP address!</div>';
        return;
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
        resultsDiv.innerHTML = '<div class="error">Invalid IP format! Use format: 192.168.1.0</div>';
        return;
    }

    const cidrNum = parseInt(cidr);
    if (isNaN(cidrNum) || cidrNum < 0 || cidrNum > 32) {
        resultsDiv.innerHTML = '<div class="error">CIDR must be between 0 and 32!</div>';
        return;
    }

    if (!workerAvailable) {
        resultsDiv.innerHTML = '<div class="error">Backend service unavailable. Please try again later.</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="success">🔢 Calculating subnet...</div>';

    try {
        const data = await callWorker('subnet', { ip, cidr: cidrNum });

        let rows = '';
        rows += resultRow('🌐', 'Network Address', escapeHtml(data.network));
        rows += resultRow('📡', 'Broadcast Address', escapeHtml(data.broadcast));
        rows += resultRow('🎭', 'Subnet Mask', escapeHtml(data.netmask));
        rows += resultRow('🃏', 'Wildcard Mask', escapeHtml(data.wildcardMask));
        rows += resultRow('⬆️', 'First Usable Host', escapeHtml(data.firstHost));
        rows += resultRow('⬇️', 'Last Usable Host', escapeHtml(data.lastHost));
        rows += resultRow('📊', 'Total Usable Hosts', data.totalHosts.toLocaleString());
        rows += resultRow('🔢', 'CIDR Notation', '/' + data.cidr);
        rows += resultRow('🏷️', 'IP Class', escapeHtml(data.ipClass));
        rows += resultRow('🔒', 'Private Address', data.isPrivate ? '✅ Yes (RFC 1918)' : '❌ No (Public)');

        let html = resultHeading('Subnet Details for ' + escapeHtml(ip) + '/' + cidrNum) + resultWrap(rows);

        resultsDiv.innerHTML = html;
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// ============================================
// SMTP CHECKER
// ============================================

async function checkSMTP() {
    const host = document.getElementById('smtpHost').value.trim();
    const resultsDiv = document.getElementById('smtpResults');
    
    if (!host) {
        resultsDiv.innerHTML = '<div class="error">Please enter a mail server or domain!</div>';
        return;
    }

    if (!workerAvailable) {
        resultsDiv.innerHTML = `
            <div class="error">
                <strong>⚠️ Backend Service Required</strong><br><br>
                The SMTP checker requires a backend service to test mail server connections. 
                Browsers cannot directly connect to SMTP ports due to security restrictions.<br><br>
                <strong>Alternative Tools:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li><a href="https://mxtoolbox.com/SuperTool.aspx" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color);">MXToolbox</a> - Free SMTP diagnostics</li>
                    <li><a href="https://www.whatsmyip.org/port-scanner/" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color);">Port Scanner</a> - Check if ports are open</li>
                    <li>Use command line: <code style="background: var(--input-background); padding: 2px 6px; border-radius: 3px;">telnet mail.example.com 25</code></li>
                </ul>
            </div>`;
        return;
    }

    // Port checkboxes only exist on the utility hub page; the standalone
    // /smtp-checker/ page has none, so default to the submission ports.
    // Port 25 is never scanned: outbound 25 is blocked at our server.
    const PORT_NAMES = { 465: 'SMTPS (implicit TLS)', 587: 'Submission (STARTTLS)', 2525: 'Alternate submission' };
    const checked = Array.from(document.querySelectorAll('.smtp-port-checkbox:checked')).map(cb => parseInt(cb.value));
    const portsToCheck = (checked.length ? checked : [465, 587]).filter(p => p !== 25);

    resultsDiv.innerHTML = '<div class="success">🔍 Resolving mail servers for ' + escapeHtml(host) + '...</div>';

    try {
        let html = sectionHeading('SMTP Check Results for ' + escapeHtml(host));
        html += '<div class="dns-results">';

        // 1. Resolve MX records; fall back to the input host (user may have
        // entered an MX hostname directly).
        let target = host;
        let mxRecords = [];
        try {
            const dnsData = await callWorker('dns', { domain: host });
            mxRecords = (dnsData.MX || []).filter(mx => mx.exchange).sort((a, b) => a.priority - b.priority);
        } catch (e) { /* no MX — treat input as a mail host */ }

        if (mxRecords.length) {
            target = mxRecords[0].exchange;
            let mxVal = '';
            mxRecords.slice(0, 5).forEach(mx => { mxVal += '• ' + escapeHtml(mx.exchange) + ' (priority ' + mx.priority + ')<br>'; });
            mxVal += 'Testing the primary server: <strong>' + escapeHtml(target) + '</strong>';
            html += `<div class="dns-record"><strong>📬 Mail Servers (MX)</strong><div class="dns-record-value">${mxVal}</div></div>`;
        } else {
            html += `<div class="dns-record"><strong>📬 Mail Servers (MX)</strong><div class="dns-record-value">No MX records found — testing <strong>${escapeHtml(target)}</strong> directly</div></div>`;
        }

        resultsDiv.innerHTML = html + '</div><div class="success">Checking submission ports...</div>';

        // 2. Check submission ports on the mail server
        let totalChecked = 0;
        let totalOpen = 0;
        let anyFiltered = false;

        for (const port of portsToCheck) {
            const portName = PORT_NAMES[port] || 'SMTP';
            try {
                const data = await callWorker('port', { host: target, port });
                totalChecked++;

                let statusIcon, statusText, statusColor;
                if (data.state === 'open') {
                    statusIcon = '✅'; statusText = 'OPEN - Server is accessible'; statusColor = 'var(--success-color)';
                    totalOpen++;
                } else if (data.state === 'closed') {
                    statusIcon = '❌'; statusText = 'CLOSED - Connection refused'; statusColor = 'var(--text-secondary)';
                } else {
                    statusIcon = '🛡️'; statusText = 'FILTERED - No response to probes'; statusColor = 'var(--warning-color)';
                    anyFiltered = true;
                }

                html += `<div class="dns-record">`;
                html += `<strong>${statusIcon} Port ${port} - ${portName}</strong>`;
                html += `<div class="dns-record-value" style="color: ${statusColor};">${statusText}</div>`;
                html += `</div>`;

            } catch (error) {
                console.error(`Error checking port ${port}:`, error);
                html += `<div class="dns-record">`;
                html += `<strong>⚠️ Port ${port} - ${portName}</strong>`;
                html += `<div class="dns-record-value" style="color: var(--error-color);">Error checking</div>`;
                html += `</div>`;
                totalChecked++;
            }
        }

        // 3. Port 25 cannot be tested from our server — say so instead of lying
        html += `<div class="dns-record">`;
        html += `<strong>ℹ️ Port 25 - Server-to-server relay</strong>`;
        html += `<div class="dns-record-value" style="color: var(--text-secondary);">Not testable from our server (hosting providers block outbound port 25 to prevent spam). Test from your own network: <code>telnet ${escapeHtml(target)} 25</code></div>`;
        html += `</div>`;

        html += '</div>';

        // Summary
        html += resultSummary('<strong>Summary:</strong> <span class="text-success">' + totalOpen + '</span> of ' + totalChecked + ' submission ports are accessible on ' + escapeHtml(target));

        if (anyFiltered) {
            html += infoNote('<strong>Filtered ≠ down:</strong> some providers (e.g. Google) silently drop scan probes from data-center IPs, so a filtered port may still work from your own network or email client.');
        }
        html += infoNote('<strong>Note:</strong> This checks MX records and whether submission ports accept connections — not whether the server accepts mail for a specific address. For full delivery testing, send a real message or use <code>telnet</code>/<code>openssl s_client</code> from your own machine.');

        resultsDiv.innerHTML = html;

    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error checking SMTP server: ${error.message}</div>`;
    }
}

// ============================================
