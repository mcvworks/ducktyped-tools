// ============================================
// QUACKTOOLS — Email Tools
// Email Validator, Email Header Analyzer
// ============================================

// EMAIL ADDRESS VALIDATOR
// ============================================

async function validateEmail() {
    const email = document.getElementById('emailToValidate').value.trim();
    const resultsDiv = document.getElementById('emailValidationResults');
    
    if (!email) {
        resultsDiv.innerHTML = '<div class="error">Please enter an email address!</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="success">🔍 Validating email address...</div>';

    try {
        let html = sectionHeading('Validation Results');
        html += '<div class="dns-results">';

        // 1. Format/Syntax Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidFormat = emailRegex.test(email);

        html += resultRow(isValidFormat ? '✅' : '❌', 'Email Format', isValidFormat ? 'Valid syntax' : 'Invalid format', isValidFormat ? 'text-success' : 'text-error');

        if (!isValidFormat) {
            html += '</div>';
            resultsDiv.innerHTML = html;
            return;
        }

        // Extract domain
        const domain = email.split('@')[1];
        const username = email.split('@')[0];

        html += resultRow('📧', 'Email Parts', 'Username: <strong>' + escapeHtml(username) + '</strong><br>Domain: <strong>' + escapeHtml(domain) + '</strong>', 'text-muted');

        // 2. Disposable Email Detection (common patterns)
        const disposableDomains = [
            'tempmail', 'throwaway', 'guerrillamail', 'mailinator', 'maildrop',
            '10minutemail', 'fakeinbox', 'trashmail', 'yopmail', 'temp-mail'
        ];
        const isDisposable = disposableDomains.some(d => domain.toLowerCase().includes(d));

        html += resultRow(isDisposable ? '⚠️' : '✅', 'Disposable Email Check', isDisposable ? 'Likely disposable/temporary email' : 'Not a known disposable service', isDisposable ? 'text-warning' : 'text-success');

        // 3. Domain DNS Check
        if (workerAvailable) {
            try {
                const dnsData = await callWorker('dns', { domain });

                const mxRecords = (dnsData.MX || []).slice().sort((a, b) => a.priority - b.priority);
                // RFC 7505 null MX: a single record with an empty exchange means
                // the domain explicitly does not accept email.
                const isNullMX = mxRecords.length === 1 && !mxRecords[0].exchange;
                const hasMX = mxRecords.length > 0 && !isNullMX;
                let mxVal = '';
                if (hasMX) {
                    mxVal = 'Found ' + mxRecords.length + ' mail server(s):<br>';
                    mxRecords.slice(0, 3).forEach(mx => { mxVal += '• ' + escapeHtml(mx.exchange) + ' (priority ' + mx.priority + ')<br>'; });
                } else if (isNullMX) {
                    mxVal = 'Null MX record - Domain explicitly rejects email';
                } else {
                    mxVal = 'No MX records found - Domain cannot receive email';
                }
                html += resultRow(hasMX ? '✅' : '❌', 'MX Records', mxVal, hasMX ? 'text-success' : 'text-error');

                // 4. A/AAAA Record Check
                const aRecords = (dnsData.A && dnsData.A.length ? dnsData.A : dnsData.AAAA) || [];
                const hasA = aRecords.length > 0;
                html += resultRow(hasA ? '✅' : '❌', 'Domain Exists', hasA ? 'Domain resolves to IP: ' + escapeHtml(aRecords[0]) : 'Domain does not exist', hasA ? 'text-success' : 'text-error');

            } catch (error) {
                html += resultRow('⚠️', 'DNS Check', 'Could not verify domain DNS', 'text-warning');
            }
        } else {
            html += resultRow('⚠️', 'DNS Check', 'Backend unavailable - Cannot verify MX records', 'text-warning');
        }

        html += '</div>';

        // Summary
        html += infoNote('<strong>Note:</strong> This validator checks format, domain existence, and MX records. It cannot verify if the specific email address exists on the mail server. For that, you would need SMTP verification which requires connecting to the mail server.');

        resultsDiv.innerHTML = html;

    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error validating email: ${error.message}</div>`;
    }
}

// ============================================
// EMAIL HEADER ANALYZER
// ============================================
async function analyzeEmailHeaders() {
    const headers = document.getElementById('emailHeaders').value.trim();
    const resultsDiv = document.getElementById('emailHeaderResults');

    if (!headers) {
        resultsDiv.innerHTML = '<div class="output error">Please paste email headers!</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="output success">Analyzing headers...</div>';

    try {
        // Parse headers into key-value pairs
        const lines = headers.split('\n');
        const parsedHeaders = {};
        let currentKey = '';
        
        // Handle multi-line headers (continuation lines start with whitespace)
        lines.forEach(line => {
            if (line.match(/^\s+/) && currentKey) {
                // Continuation of previous header
                parsedHeaders[currentKey] += ' ' + line.trim();
            } else {
                const match = line.match(/^([^:]+):\s*(.*)$/);
                if (match) {
                    currentKey = match[1].trim();
                    const value = match[2].trim();
                    
                    // Store multiple values for headers that can appear multiple times
                    if (parsedHeaders[currentKey]) {
                        if (Array.isArray(parsedHeaders[currentKey])) {
                            parsedHeaders[currentKey].push(value);
                        } else {
                            parsedHeaders[currentKey] = [parsedHeaders[currentKey], value];
                        }
                    } else {
                        parsedHeaders[currentKey] = value;
                    }
                }
            }
        });

        let html = sectionHeading('📧 Email Header Analysis');
        html += '<div class="dns-results">';

        // Basic Information
        html += '<div class="dns-record"><strong>📬 Basic Information</strong><div class="dns-record-value">';
        if (parsedHeaders['From']) {
            html += `<strong>From:</strong> ${escapeHtml(parsedHeaders['From'])}<br>`;
        }
        if (parsedHeaders['To']) {
            html += `<strong>To:</strong> ${escapeHtml(parsedHeaders['To'])}<br>`;
        }
        if (parsedHeaders['Subject']) {
            html += `<strong>Subject:</strong> ${escapeHtml(parsedHeaders['Subject'])}<br>`;
        }
        if (parsedHeaders['Date']) {
            html += `<strong>Date:</strong> ${escapeHtml(parsedHeaders['Date'])}<br>`;
        }
        if (parsedHeaders['Message-ID']) {
            html += `<strong>Message-ID:</strong> ${escapeHtml(parsedHeaders['Message-ID'])}<br>`;
        }
        html += '</div></div>';

        // Authentication Results
        html += '<div class="dns-record"><strong>🔐 Authentication</strong><div class="dns-record-value">';
        
        // SPF
        if (parsedHeaders['Received-SPF']) {
            const spfResult = parsedHeaders['Received-SPF'];
            const spfIcon = spfResult.toLowerCase().includes('pass') ? '✅' : 
                           spfResult.toLowerCase().includes('fail') ? '❌' : '⚠️';
            html += `<strong>${spfIcon} SPF:</strong> ${escapeHtml(spfResult.substring(0, 100))}<br>`;
        }
        
        // DKIM & DMARC from Authentication-Results
        if (parsedHeaders['Authentication-Results']) {
            const authResults = Array.isArray(parsedHeaders['Authentication-Results']) 
                ? parsedHeaders['Authentication-Results'][0] 
                : parsedHeaders['Authentication-Results'];
            
            const dkimMatch = authResults.match(/dkim=(\w+)/);
            const dmarcMatch = authResults.match(/dmarc=(\w+)/);
            
            if (dkimMatch) {
                const dkimIcon = dkimMatch[1] === 'pass' ? '✅' : '❌';
                html += `<strong>${dkimIcon} DKIM:</strong> ${dkimMatch[1]}<br>`;
            }
            if (dmarcMatch) {
                const dmarcIcon = dmarcMatch[1] === 'pass' ? '✅' : '❌';
                html += `<strong>${dmarcIcon} DMARC:</strong> ${dmarcMatch[1]}<br>`;
            }
        }
        
        // ARC
        if (parsedHeaders['ARC-Authentication-Results']) {
            html += `<strong>🔄 ARC:</strong> Present (email forwarded/modified)<br>`;
        }
        
        html += '</div></div>';

        // Routing Path (Received headers)
        const receivedHeaders = parsedHeaders['Received'];
        if (receivedHeaders) {
            html += '<div class="dns-record"><strong>🌐 Email Routing Path</strong><div class="dns-record-value">';
            
            const receivedArray = Array.isArray(receivedHeaders) ? receivedHeaders : [receivedHeaders];
            receivedArray.forEach((received, index) => {
                const serverMatch = received.match(/from\s+([^\s]+)/i);
                const ipMatch = received.match(/\[([0-9.]+)\]/);
                const timeMatch = received.match(/;\s*(.+)$/);
                
                html += `<strong>Hop ${index + 1}:</strong><br>`;
                if (serverMatch) html += `&nbsp;&nbsp;Server: ${escapeHtml(serverMatch[1])}<br>`;
                if (ipMatch) html += `&nbsp;&nbsp;IP: ${ipMatch[1]}<br>`;
                if (timeMatch) html += `&nbsp;&nbsp;Time: ${escapeHtml(timeMatch[1])}<br>`;
                html += '<br>';
            });
            
            html += `<em>Total hops: ${receivedArray.length}</em>`;
            html += '</div></div>';
        }

        // Return Path & Reply-To
        html += '<div class="dns-record"><strong>↩️ Return Information</strong><div class="dns-record-value">';
        if (parsedHeaders['Return-Path']) {
            html += `<strong>Return-Path:</strong> ${escapeHtml(parsedHeaders['Return-Path'])}<br>`;
        }
        if (parsedHeaders['Reply-To']) {
            html += `<strong>Reply-To:</strong> ${escapeHtml(parsedHeaders['Reply-To'])}<br>`;
        }
        if (parsedHeaders['List-Unsubscribe']) {
            html += `<strong>Unsubscribe:</strong> Available<br>`;
        }
        html += '</div></div>';

        // MIME & Content Info
        html += '<div class="dns-record"><strong>📄 Content Information</strong><div class="dns-record-value">';
        if (parsedHeaders['Content-Type']) {
            html += `<strong>Content-Type:</strong> ${escapeHtml(parsedHeaders['Content-Type'].substring(0, 80))}<br>`;
        }
        if (parsedHeaders['MIME-Version']) {
            html += `<strong>MIME-Version:</strong> ${escapeHtml(parsedHeaders['MIME-Version'])}<br>`;
        }
        if (parsedHeaders['Content-Transfer-Encoding']) {
            html += `<strong>Encoding:</strong> ${escapeHtml(parsedHeaders['Content-Transfer-Encoding'])}<br>`;
        }
        html += '</div></div>';

        // Sender Infrastructure
        if (parsedHeaders['X-Mailer'] || parsedHeaders['User-Agent'] || parsedHeaders['X-Originating-IP']) {
            html += '<div class="dns-record"><strong>🖥️ Sender Infrastructure</strong><div class="dns-record-value">';
            if (parsedHeaders['X-Mailer']) {
                html += `<strong>Mailer:</strong> ${escapeHtml(parsedHeaders['X-Mailer'])}<br>`;
            }
            if (parsedHeaders['User-Agent']) {
                html += `<strong>User-Agent:</strong> ${escapeHtml(parsedHeaders['User-Agent'])}<br>`;
            }
            if (parsedHeaders['X-Originating-IP']) {
                html += `<strong>Originating IP:</strong> ${escapeHtml(parsedHeaders['X-Originating-IP'])}<br>`;
            }
            html += '</div></div>';
        }

        html += '</div>';

        // Summary
        html += '<div class="result-note" style="margin-top: 20px;">';
        html += '<strong style="color: var(--primary-color);">📊 Summary</strong><br>';
        html += '<div style="margin-top: 10px;" class="text-muted">';
        
        // Count authentications passed
        let authPassed = 0;
        if (parsedHeaders['Received-SPF'] && parsedHeaders['Received-SPF'].toLowerCase().includes('pass')) authPassed++;
        if (parsedHeaders['Authentication-Results']) {
            const auth = Array.isArray(parsedHeaders['Authentication-Results']) 
                ? parsedHeaders['Authentication-Results'][0] 
                : parsedHeaders['Authentication-Results'];
            if (auth.includes('dkim=pass')) authPassed++;
            if (auth.includes('dmarc=pass')) authPassed++;
        }
        
        html += `<strong>Authentication Status:</strong> ${authPassed}/3 checks passed<br>`;
        if (receivedHeaders) {
            const hops = Array.isArray(receivedHeaders) ? receivedHeaders.length : 1;
            html += `<strong>Routing Hops:</strong> ${hops} server(s)<br>`;
        }
        html += `<strong>Total Headers:</strong> ${Object.keys(parsedHeaders).length}`;
        html += '</div></div>';

        resultsDiv.innerHTML = html;
        
    } catch (error) {
        resultsDiv.innerHTML = `<div class="output error"><strong>Error:</strong> ${error.message}</div>`;
        console.error('Email header parsing error:', error);
    }
}

// escapeHtml is defined in core.js

// ============================================
// BLACKLIST / RBL CHECKER (Uses Worker)
// ============================================
async function checkBlacklist() {
    await runTool({
        inputId: 'blacklistIp',
        resultsId: 'blacklistResults',
        tool: 'blacklist',
        validate: validateIpInput,
        loadingMsg: '📋 Checking against blacklists... This may take a moment.',
        errorPrefix: 'Error checking blacklists',
        getPayload: (ip) => ({ ip }),
        render: (data, ip) => {
            const listedCount = data.listedCount || 0;
            const totalChecked = data.totalChecked || 0;
            const variant = listedCount === 0 ? 'success' : listedCount <= 2 ? 'warning' : 'error';
            const statusIcon = listedCount === 0 ? '✅' : '🚨';

            let html = resultHeading(`Blacklist Check for ${escapeHtml(data.ip || ip)}`);
            html += resultNote(`<strong style="font-size: 1.1em;">${statusIcon} ${listedCount === 0 ? 'Clean — Not Blacklisted' : listedCount + ' Blacklist(s) Found'}</strong><br><span class="text-muted" style="font-size: 0.9em;">Checked ${totalChecked} blacklist databases</span>`, variant === 'success' ? '' : variant);

            let rows = '';
            if (data.results && data.results.length > 0) {
                data.results.forEach(rbl => {
                    const icon = rbl.listed ? '🚨' : '✅';
                    const cls = rbl.listed ? 'text-error' : 'text-success';
                    const status = rbl.listed ? 'LISTED' : 'Clean';
                    rows += resultRow(icon, rbl.name, `<span class="${cls}">${status}</span>${rbl.zone ? ` <small class="text-muted">(${escapeHtml(rbl.zone)})</small>` : ''}`);
                });
            }
            html += resultWrap(rows);

            if (listedCount > 0) {
                html += resultSummary(`<p><strong>⚠️ What to do if listed:</strong> Contact the blacklist operator for delisting procedures. Common causes include spam complaints, open relays, or compromised servers. Fix the underlying issue first, then request removal.</p>`, 'warning');
            }
            return html;
        }
    });
}

// ============================================
