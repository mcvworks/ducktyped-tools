// ============================================
// DUCKTYPED — Device Lookup Library
// IMEI/TAC decoder with client-side database lookup.
// Pure functions with no DOM dependencies.
// ============================================

var DT = window.DT || {};

DT.device = {

    _tacDb: null,
    _tacDbLoading: null,
    _appleDb: null,
    _appleDbLoading: null,

    /**
     * Load the TAC database JSON. Caches after first load.
     * @returns {Promise<object>} The TAC database object
     */
    loadTacDb: function () {
        if (this._tacDb) return Promise.resolve(this._tacDb);
        if (this._tacDbLoading) return this._tacDbLoading;

        var self = this;
        this._tacDbLoading = fetch('/utility/data/tac-db.json')
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to load TAC database');
                return res.json();
            })
            .then(function (data) {
                self._tacDb = data;
                self._tacDbLoading = null;
                return data;
            })
            .catch(function (err) {
                self._tacDbLoading = null;
                throw err;
            });

        return this._tacDbLoading;
    },

    /**
     * Validate Luhn checksum for a digit string.
     * @param {string} digits - String of digits to validate
     * @returns {boolean} True if valid
     */
    luhnCheck: function (digits) {
        var sum = 0;
        var alt = false;
        for (var i = digits.length - 1; i >= 0; i--) {
            var n = parseInt(digits[i], 10);
            if (alt) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alt = !alt;
        }
        return sum % 10 === 0;
    },

    /**
     * Decode an IMEI number.
     * @param {string} imei - The IMEI string (14 or 15 digits)
     * @returns {object} { valid, luhnValid, tac, brand, model, serial, checkDigit, is14Digit }
     */
    decodeIMEI: function (imei) {
        // Strip spaces and dashes for flexible input
        var cleaned = imei.replace(/[\s\-]/g, '');

        var result = {
            valid: false,
            luhnValid: false,
            tac: null,
            brand: null,
            model: null,
            serial: null,
            checkDigit: null,
            is14Digit: false
        };

        // Accept 14-digit IMEIs (older devices without check digit)
        if (/^\d{14}$/.test(cleaned)) {
            result.is14Digit = true;
            result.tac = cleaned.substring(0, 8);
            result.serial = cleaned.substring(8, 14);
            result.valid = true;

            if (this._tacDb && this._tacDb[result.tac]) {
                var entry = this._tacDb[result.tac];
                result.brand = entry.b;
                result.model = entry.m;
            }
            return result;
        }

        // Standard 15-digit IMEI
        if (!/^\d{15}$/.test(cleaned)) {
            return result;
        }

        result.tac = cleaned.substring(0, 8);
        result.serial = cleaned.substring(8, 14);
        result.checkDigit = cleaned.substring(14, 15);
        result.luhnValid = this.luhnCheck(cleaned);
        result.valid = result.luhnValid;

        // Look up TAC in the loaded database
        if (this._tacDb && this._tacDb[result.tac]) {
            var entry = this._tacDb[result.tac];
            result.brand = entry.b;
            result.model = entry.m;
        }

        return result;
    },

    /**
     * Load the Apple serial database JSON. Caches after first load.
     * @returns {Promise<object>} The Apple serial database object
     */
    loadAppleDb: function () {
        if (this._appleDb) return Promise.resolve(this._appleDb);
        if (this._appleDbLoading) return this._appleDbLoading;

        var self = this;
        this._appleDbLoading = fetch('/utility/data/apple-serials.json')
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to load Apple serial database');
                return res.json();
            })
            .then(function (data) {
                self._appleDb = data;
                self._appleDbLoading = null;
                return data;
            })
            .catch(function (err) {
                self._appleDbLoading = null;
                throw err;
            });

        return this._appleDbLoading;
    },

    /**
     * Decode an Apple pre-2021 serial number (12 characters).
     * @param {string} serial - The Apple serial string
     * @returns {object} { valid, format, factory, year, week, modelCode, model, message }
     */
    decodeAppleSerial: function (serial) {
        var cleaned = serial.replace(/[\s\-]/g, '').toUpperCase();

        var result = {
            valid: false,
            format: null,
            factory: null,
            factoryCode: null,
            year: null,
            half: null,
            week: null,
            weekApprox: null,
            modelCode: null,
            model: null,
            message: null
        };

        // Post-2021 randomized serial (10 characters)
        if (/^[A-Z0-9]{10}$/.test(cleaned)) {
            result.format = 'post-2021';
            result.message = 'This appears to be a post-2021 randomized Apple serial number. ' +
                'Apple switched to randomized 10-character serials in late 2021, which cannot be decoded. ' +
                'Try using IMEI lookup instead to identify this device.';
            return result;
        }

        // Pre-2021 serial must be exactly 12 alphanumeric characters
        if (!/^[A-Z0-9]{12}$/.test(cleaned)) {
            result.message = 'Invalid Apple serial format. Pre-2021 serials are 12 alphanumeric characters.';
            return result;
        }

        result.format = 'pre-2021';
        result.valid = true;

        // Positions 1-3: Manufacturing location (2 or 3 char prefix)
        var factoryCode3 = cleaned.substring(0, 3);
        var factoryCode2 = cleaned.substring(0, 2);
        var factoryCode1 = cleaned.substring(0, 1);

        if (this._appleDb) {
            // Try 2-char factory code first (most common), then 1-char
            if (this._appleDb.factories[factoryCode2]) {
                result.factoryCode = factoryCode2;
                result.factory = this._appleDb.factories[factoryCode2];
            } else if (this._appleDb.factories[factoryCode1]) {
                result.factoryCode = factoryCode1;
                result.factory = this._appleDb.factories[factoryCode1];
            }

            // Position 4: Year + half (character at index 3)
            var yearChar = cleaned.charAt(3);
            if (this._appleDb.years[yearChar]) {
                result.year = this._appleDb.years[yearChar].year;
                result.half = this._appleDb.years[yearChar].half;
            }

            // Position 5: Week within half (character at index 4)
            var weekChar = cleaned.charAt(4);
            if (this._appleDb.weeks[weekChar] !== undefined) {
                var weekInHalf = this._appleDb.weeks[weekChar];
                // Calculate approximate overall week of year
                if (result.half === 2) {
                    result.week = weekInHalf + 26;
                } else {
                    result.week = weekInHalf;
                }
                result.weekApprox = 'Week ' + result.week + ' of ' + result.year;
            }

            // Last 4 characters: Model identifier
            result.modelCode = cleaned.substring(8, 12);
            if (this._appleDb.models[result.modelCode]) {
                result.model = this._appleDb.models[result.modelCode];
            }
        }

        return result;
    },

    /**
     * Look up a Dell service tag via the backend proxy.
     * @param {string} serial - The Dell service tag (5-7 alphanumeric chars)
     * @returns {Promise<object>} { model, warranty: [{ type, start, end }] }
     */
    lookupDell: function (serial) {
        var cleaned = serial.replace(/[\s\-]/g, '').toUpperCase();
        return callWorker('device/dell', { serial: cleaned });
    },

    /**
     * Detect the type of device identifier input.
     * @param {string} input - The user input string
     * @returns {object} { type, cleaned } where type is 'imei', 'apple-serial-pre2021', 'apple-serial-post2021', 'dell-service-tag', or 'unknown'
     */
    detectInputType: function (input) {
        var cleaned = input.replace(/[\s\-]/g, '');

        // 14 or 15-digit number → IMEI
        if (/^\d{14,15}$/.test(cleaned)) {
            return { type: 'imei', cleaned: cleaned };
        }

        // 12 alphanumeric characters → Apple pre-2021 serial
        if (/^[A-Za-z0-9]{12}$/.test(cleaned)) {
            return { type: 'apple-serial-pre2021', cleaned: cleaned };
        }

        // 10 alphanumeric characters → Apple post-2021 serial
        if (/^[A-Za-z0-9]{10}$/.test(cleaned)) {
            return { type: 'apple-serial-post2021', cleaned: cleaned };
        }

        // 5-7 alphanumeric characters (with at least one letter) → Dell service tag
        // Dell tags are alphanumeric but always contain letters (pure digits would be ambiguous)
        if (/^[A-Za-z0-9]{5,7}$/.test(cleaned) && /[A-Za-z]/.test(cleaned)) {
            return { type: 'dell-service-tag', cleaned: cleaned };
        }

        return { type: 'unknown', cleaned: cleaned };
    }
};

window.DT = DT;
