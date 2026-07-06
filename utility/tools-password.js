// ============================================
// QUACKTOOLS — Password & Encrypted Notes
// ============================================

// PASSWORD GENERATOR (Client-side, no worker needed)
// ============================================

// Password length control functions
function updatePasswordLength(value) {
    // Ensure value is within bounds
    value = Math.max(8, Math.min(64, parseInt(value) || 16));
    
    // Update display
    document.getElementById('lengthValue').textContent = value;
    
    // Update input field
    const inputField = document.getElementById('passwordLengthInput');
    if (inputField) {
        inputField.value = value;
    }
    
    return value;
}

function setPasswordLength(length) {
    updatePasswordLength(length);
}

function updateLengthFromInput(value) {
    // Parse the value
    let numValue = parseInt(value);
    
    // If empty or invalid, don't update
    if (value === '' || isNaN(numValue)) {
        return;
    }
    
    // Clamp to valid range
    numValue = Math.max(8, Math.min(64, numValue));
    
    // Only update the display label, not the input field itself
    document.getElementById('lengthValue').textContent = numValue;
}

function generatePassword() {
    const inputField = document.getElementById('passwordLengthInput');
    const length = parseInt(inputField.value) || 16;
    const includeUppercase = document.getElementById('includeUppercase').checked;
    const includeLowercase = document.getElementById('includeLowercase').checked;
    const includeNumbers = document.getElementById('includeNumbers').checked;
    const includeSymbols = document.getElementById('includeSymbols').checked;

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*_+-';

    if (charset === '') {
        showToast('Please select at least one character type!', 'error');
        return;
    }

    // Guarantee at least one character from each selected type
    const required = [];
    const sets = [];
    if (includeUppercase) sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (includeLowercase) sets.push('abcdefghijklmnopqrstuvwxyz');
    if (includeNumbers) sets.push('0123456789');
    if (includeSymbols) sets.push('!@#$%^&*_+-');

    const seedArray = new Uint32Array(length);
    crypto.getRandomValues(seedArray);

    for (let i = 0; i < sets.length; i++) {
        required.push(sets[i][seedArray[i] % sets[i].length]);
    }

    // Fill remaining slots from full charset
    let password = '';
    for (let i = sets.length; i < length; i++) {
        password += charset[seedArray[i] % charset.length];
    }

    // Insert required characters at random positions
    password = required.join('') + password;
    const shuffled = password.split('');
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = seedArray[i] % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    password = shuffled.join('');

    document.getElementById('passwordText').textContent = password;
    document.getElementById('passwordOutput').classList.add('show');

    // Show strength analysis if the panel exists (standalone page)
    var analysisEl = document.getElementById('pwStrengthAnalysis');
    if (analysisEl) {
        var pool = charset.length;
        var entropy = password.length * Math.log2(pool);
        var pct = Math.min(100, (entropy / 128) * 100);
        var color, label;
        if (entropy < 28) { color = '#ef4444'; label = 'Very Weak'; }
        else if (entropy < 36) { color = '#f97316'; label = 'Weak'; }
        else if (entropy < 60) { color = '#eab308'; label = 'Fair'; }
        else if (entropy < 128) { color = '#22c55e'; label = 'Strong'; }
        else { color = '#06b6d4'; label = 'Very Strong'; }

        document.getElementById('pwStrengthFill').style.width = pct + '%';
        document.getElementById('pwStrengthFill').style.background = color;
        document.getElementById('pwStrengthLabel').textContent = label;
        document.getElementById('pwStrengthLabel').style.color = color;

        var sc = function(t, v) { return '<div style="padding:10px;background:var(--input-background);border:1px solid var(--border-color);border-radius:8px;text-align:center;"><div style="font-size:1.3em;font-weight:700;color:var(--primary-color);">' + v + '</div><div style="font-size:0.78em;color:var(--text-secondary);">' + t + '</div></div>'; };
        document.getElementById('pwStatCards').innerHTML = sc('Entropy', entropy.toFixed(1) + ' bits') + sc('Pool Size', pool + ' chars') + sc('Length', password.length + ' chars');

        var combos = Math.pow(2, entropy - 1);
        // Use 1 trillion guesses/sec as the reference (massive GPU cluster)
        var crackSeconds = combos / 1e12;
        var crackYears = crackSeconds / 31536000;

        // Human-scale comparisons
        var comparison;
        if (crackSeconds < 1) comparison = 'about as long as a blink';
        else if (crackSeconds < 60) comparison = 'less time than it takes to microwave popcorn';
        else if (crackSeconds < 3600) comparison = 'shorter than a lunch break';
        else if (crackYears < 1) comparison = 'less than a year — not great';
        else if (crackYears < 80) comparison = 'within a human lifetime';
        else if (crackYears < 5000) comparison = 'longer than recorded human history';
        else if (crackYears < 4.5e9) comparison = 'longer than the Earth has existed';
        else if (crackYears < 1.4e10) comparison = 'longer than the age of the universe';
        else comparison = 'multiple universe lifetimes — good luck';

        var fmtTime;
        if (crackSeconds < 1) fmtTime = 'Instant';
        else if (crackSeconds < 60) fmtTime = Math.round(crackSeconds) + ' seconds';
        else if (crackSeconds < 3600) fmtTime = Math.round(crackSeconds / 60) + ' minutes';
        else if (crackSeconds < 86400) fmtTime = Math.round(crackSeconds / 3600) + ' hours';
        else if (crackYears < 1) fmtTime = Math.round(crackSeconds / 86400) + ' days';
        else if (crackYears < 1000) fmtTime = Math.round(crackYears).toLocaleString() + ' years';
        else if (crackYears < 1e6) fmtTime = Math.round(crackYears / 1000).toLocaleString() + ' thousand years';
        else if (crackYears < 1e9) fmtTime = Math.round(crackYears / 1e6).toLocaleString() + ' million years';
        else if (crackYears < 1e12) fmtTime = Math.round(crackYears / 1e9).toLocaleString() + ' billion years';
        else fmtTime = Math.round(crackYears / 1e12).toLocaleString() + ' trillion years';

        var h = '<h4 style="color:var(--primary-color);margin-bottom:10px;">How long to crack?</h4>';
        h += '<div style="text-align:center;padding:10px 0;"><span style="font-size:1.4em;font-weight:700;color:var(--text-primary);">' + fmtTime + '</span>';
        h += '<div style="font-size:0.85em;color:var(--text-secondary);margin-top:4px;">at 1 trillion guesses per second</div></div>';
        h += '<div style="text-align:center;padding:8px 12px;margin-top:8px;border-radius:6px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.15);font-size:0.92em;color:var(--text-secondary);">That\'s <strong style="color:var(--primary-color);">' + comparison + '</strong>.</div>';
        document.getElementById('pwCrackTimes').innerHTML = h;

        analysisEl.style.display = 'block';
    }
}

function copyPassword() {
    const password = document.getElementById('passwordText').textContent;
    navigator.clipboard.writeText(password).then(() => {
        showToast('✓ Password copied!');
    });
}

function copyLink() {
    const link = document.getElementById('encryptedLink').textContent;
    navigator.clipboard.writeText(link).then(() => {
        showToast('✓ Link copied!');
    }).catch(err => {
        showToast('Failed to copy link', 'error');
    });
}

function togglePasswordField() {
    const requirePassword = document.getElementById('requirePassword').checked;
    const passwordFieldGroup = document.getElementById('passwordFieldGroup');
    
    if (requirePassword) {
        passwordFieldGroup.style.display = 'block';
    } else {
        passwordFieldGroup.style.display = 'none';
    }
}

// ============================================
// ENCRYPTED NOTE SENDER
// ============================================

function initializeEncryptedNotes() {
    const urlParams = new URLSearchParams(window.location.search);
    const messageId = urlParams.get('id');

    if (messageId) {
        document.getElementById('encryptView').style.display = 'none';
        document.getElementById('decryptView').style.display = 'block';
    }
}

// "Create New Message" from the decrypt view: back to a clean encrypt view
function resetNoteApp() {
    document.getElementById('decryptView').style.display = 'none';
    document.getElementById('encryptView').style.display = 'block';
    const pw = document.getElementById('decryptPassword');
    if (pw) pw.value = '';
    const out = document.getElementById('decryptedText');
    if (out) out.textContent = '';
    // Drop ?id=... so a refresh doesn't reopen the decrypt view
    window.history.replaceState(null, '', window.location.pathname);
}

async function encryptNote() {
    const message = document.getElementById('noteMessage').value;
    const requirePassword = document.getElementById('requirePassword').checked;
    const password = requirePassword ? document.getElementById('encryptPassword').value : 'no-password';

    if (!message) {
        showToast('Please enter a message!', 'error');
        return;
    }

    if (requirePassword && !password) {
        showToast('Please enter a password or uncheck "Require Password"!', 'error');
        return;
    }

    const createBtn = document.getElementById('createLinkBtn');
    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';

    try {
        const encoder = new TextEncoder();
        
        // Get expiration time in hours (clamp 1-8760)
        const expirationHours = Math.max(1, Math.min(8760, parseInt(document.getElementById('expirationTime').value) || 24));

        // Get max opens, 0 = unlimited (clamp 0-999)
        const maxOpens = Math.max(0, Math.min(999, parseInt(document.getElementById('expirationOpens')?.value) || 1));

        // Add expiration timestamp
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + expirationHours);
        const expirationTimestamp = expirationDate.getTime();

        // Combine message with expiration: "TIMESTAMP|MAXOPENS|||MESSAGE"
        const messageWithExpiration = `${expirationTimestamp}|${maxOpens}|||${message}`;
        const data = encoder.encode(messageWithExpiration);
        
        // Derive key from password
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );

        // Combine salt + iv + encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        // Convert to base64 URL-safe
        const encryptedBase64 = btoa(String.fromCharCode(...combined))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        // Generate unique message ID (optional for future backend tracking)
        const messageId = generateId();
        
        // Create link to separate note viewer page
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        const pwdParam = requirePassword ? '1' : '0';
        const shareLink = `${baseUrl}note.html?pwd=${pwdParam}#${encryptedBase64}`;
        
        document.getElementById('encryptedLink').textContent = shareLink;
        document.getElementById('encryptOutput').classList.add('show');
        
        // Get expiration info for display
        const expirationLabels = {
            '1': '1 hour',
            '24': '1 day',
            '72': '3 days',
            '168': '7 days',
            '720': '30 days'
        };
        const expirationLabel = expirationLabels[expirationHours.toString()] || `${expirationHours} hours`;
        const opensLabel = maxOpens === 0 ? 'unlimited opens' : (maxOpens === 1 ? '1 open' : `${maxOpens} opens`);

        // Show appropriate info box
        if (requirePassword) {
            document.getElementById('passwordInfo').innerHTML = `
                <strong>🔒 Password Protected</strong><br>
                <span style="font-size: 0.88em;">Share the password separately (via phone, in person, etc.) for maximum security.</span><br>
                <small>⏱️ Expires in ${expirationLabel} or after ${opensLabel}.</small>
            `;
            document.getElementById('passwordInfo').classList.remove('hidden');
        } else {
            document.getElementById('passwordInfo').classList.add('hidden');
        }
        document.getElementById('noPasswordInfo').classList.add('hidden');

    } catch (error) {
        showToast('Encryption failed: ' + error.message, 'error');
    } finally {
        createBtn.disabled = false;
        createBtn.textContent = 'Create Encrypted Link';
    }
}

async function decryptNote() {
    const password = document.getElementById('decryptPassword').value;
    
    if (!password) {
        showToast('Please enter the password!', 'error');
        return;
    }

    const decryptBtn = document.getElementById('decryptBtn');
    decryptBtn.disabled = true;
    decryptBtn.textContent = 'Decrypting...';

    try {
        // Get encrypted data from URL hash
        const encryptedBase64 = window.location.hash.substring(1);
        
        if (!encryptedBase64) {
            throw new Error('No encrypted message found in URL');
        }

        // Convert from base64 URL-safe
        const base64 = encryptedBase64.replace(/-/g, '+').replace(/_/g, '/');
        const combined = new Uint8Array(
            atob(base64).split('').map(c => c.charCodeAt(0))
        );

        // Extract salt, iv, and encrypted data
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const encryptedData = combined.slice(28);

        // Derive key from password
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encryptedData
        );

        const decoder = new TextDecoder();
        const decryptedText = decoder.decode(decrypted);

        // Handle expiration format: "TIMESTAMP|MAXOPENS|||MESSAGE" or legacy "TIMESTAMP|||MESSAGE"
        let displayMessage = decryptedText;
        if (decryptedText.includes('|||')) {
            const parts = decryptedText.split('|||');
            const metaParts = parts[0].split('|');
            const expirationTimestamp = parseInt(metaParts[0]);
            const maxOpens = metaParts.length > 1 ? parseInt(metaParts[1]) : 0;
            displayMessage = parts.slice(1).join('|||');
            
            // Check if expired
            if (Date.now() > expirationTimestamp) {
                const expiredDate = new Date(expirationTimestamp);
                showToast('This message has expired on ' + expiredDate.toLocaleString(), 'error', 5000);
                document.getElementById('decryptBtn').disabled = false;
                document.getElementById('decryptBtn').textContent = 'Decrypt Message';
                return;
            }
        }

        document.getElementById('decryptedText').textContent = displayMessage;
        document.getElementById('decryptOutput').classList.add('show');

    } catch (error) {
        showToast('Decryption failed. Wrong password or corrupted message.', 'error');
    } finally {
        decryptBtn.disabled = false;
        decryptBtn.textContent = 'Decrypt Message';
    }
}

function copyEncryptedLink() {
    const link = document.getElementById('encryptedLink').textContent;
    navigator.clipboard.writeText(link).then(() => {
        showToast('✓ Link copied!');
    });
}

function copyDecryptedMessage() {
    const message = document.getElementById('decryptedText').textContent;
    navigator.clipboard.writeText(message).then(() => {
        showToast('✓ Message copied!');
    });
}

function generateId() {
    const arr = new Uint8Array(12);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(36).padStart(2, '0')).join('').slice(0, 16);
}

// ============================================
// PASSWORD BREACH CHECKER (Uses Worker)
// ============================================
function toggleBreachPasswordVisibility() {
    const input = document.getElementById('breachPassword');
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

async function checkPasswordBreach() {
    const password = document.getElementById('breachPassword').value;
    const resultsDiv = document.getElementById('breachResults');

    if (!password) {
        resultsDiv.innerHTML = '<div class="error">Please enter a password to check!</div>';
        return;
    }

    if (!workerAvailable) {
        resultsDiv.innerHTML = '<div class="error">Backend service unavailable. Please try again later.</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="success">🔓 Checking password against breach databases...</div>';

    try {
        const data = await callWorker('breachcheck', { password });

        let html = '<div class="dns-results">';

        if (data.breached) {
            html += resultRow('🚨', 'Password Compromised!', escapeHtml(data.message), 'text-error');
            html += infoNote('<strong style="color: var(--error-color);">⚠️ Action Required</strong><br>This password has been exposed in data breaches and is not safe to use. Attackers use lists of breached passwords in automated attacks. If you use this password anywhere, change it immediately and use a unique password for each account.', 'error');
        } else {
            html += resultRow('✅', 'Password Not Found in Breaches', escapeHtml(data.message), 'text-success');
            html += infoNote('Good news! This doesn\'t guarantee the password is strong — it just means it hasn\'t appeared in known breaches. Always use long, unique passwords for each account.', 'success');
        }

        html += '</div>';
        resultsDiv.innerHTML = html;

    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error checking breach database: ${error.message}</div>`;
    }
}

// ============================================
