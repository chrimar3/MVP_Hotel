/**
 * Crypto Utilities
 * Handles encryption, HMAC, token generation, and cryptographic operations
 */

class CryptoUtils {
    constructor() {
        // Initialize crypto configuration
        this.config = {
            defaultKeyLength: 32,
            defaultIvLength: 12,
            defaultAlgorithm: 'AES-GCM',
            hashAlgorithm: 'SHA-256'
        };
    }

    /**
     * OWASP A02: Cryptographic Failures Prevention
     */
    async encryptSensitiveData(data, key) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));

            // Generate IV
            const iv = crypto.getRandomValues(new Uint8Array(this.config.defaultIvLength));

            // Import key
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                key,
                { name: this.config.defaultAlgorithm },
                false,
                ['encrypt']
            );

            // Encrypt
            const encrypted = await crypto.subtle.encrypt(
                { name: this.config.defaultAlgorithm, iv },
                cryptoKey,
                dataBuffer
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);

            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            throw new Error('Encryption failed');
        }
    }

    /**
     * Decrypt sensitive data
     */
    async decryptSensitiveData(encryptedData, key) {
        try {
            // Decode from base64
            const combined = new Uint8Array(
                atob(encryptedData).split('').map(char => char.charCodeAt(0))
            );

            // Extract IV and encrypted data
            const iv = combined.slice(0, this.config.defaultIvLength);
            const encrypted = combined.slice(this.config.defaultIvLength);

            // Import key
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                key,
                { name: this.config.defaultAlgorithm },
                false,
                ['decrypt']
            );

            // Decrypt
            const decrypted = await crypto.subtle.decrypt(
                { name: this.config.defaultAlgorithm, iv },
                cryptoKey,
                encrypted
            );

            // Decode result
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            throw new Error('Decryption failed');
        }
    }

    /**
     * Generate cryptographic key
     */
    async generateKey(algorithm = 'AES-GCM', keySize = 256) {
        return crypto.subtle.generateKey(
            { name: algorithm, length: keySize },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Export key to raw format
     */
    async exportKey(key) {
        const exported = await crypto.subtle.exportKey('raw', key);
        return new Uint8Array(exported);
    }

    /**
     * OWASP A08: Software and Data Integrity Failures
     */
    async computeHMAC(data, secretKey) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));

        let key = secretKey;
        if (!key) {
            // Generate a key if none provided
            key = await crypto.subtle.generateKey(
                { name: 'HMAC', hash: this.config.hashAlgorithm },
                true,
                ['sign', 'verify']
            );
        } else if (typeof key === 'string') {
            // Import string key
            const keyBuffer = encoder.encode(key);
            key = await crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'HMAC', hash: this.config.hashAlgorithm },
                false,
                ['sign', 'verify']
            );
        }

        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            dataBuffer
        );

        return {
            signature: btoa(String.fromCharCode(...new Uint8Array(signature))),
            key: await this.exportKey(key)
        };
    }

    /**
     * Verify HMAC signature
     */
    async verifyHMAC(data, signature, key) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));

            // Import key
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                key,
                { name: 'HMAC', hash: this.config.hashAlgorithm },
                false,
                ['verify']
            );

            // Decode signature
            const signatureBuffer = new Uint8Array(
                atob(signature).split('').map(char => char.charCodeAt(0))
            );

            return await crypto.subtle.verify(
                'HMAC',
                cryptoKey,
                signatureBuffer,
                dataBuffer
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * Hash data using SHA-256
     */
    async hashData(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));

        const hashBuffer = await crypto.subtle.digest(this.config.hashAlgorithm, dataBuffer);
        const hashArray = new Uint8Array(hashBuffer);

        return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate secure random token
     */
    generateToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate secure random bytes
     */
    generateRandomBytes(length = 32) {
        return crypto.getRandomValues(new Uint8Array(length));
    }

    /**
     * Generate UUID v4
     */
    generateUUID() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);

        // Set version (4) and variant bits
        array[6] = (array[6] & 0x0f) | 0x40;
        array[8] = (array[8] & 0x3f) | 0x80;

        const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }

    /**
     * Generate nonce for CSP
     */
    generateNonce(length = 16) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array));
    }

    /**
     * Generate secure password
     */
    generateSecurePassword(length = 16, includeSymbols = true) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let charset = lowercase + uppercase + numbers;
        if (includeSymbols) {
            charset += symbols;
        }

        let password = '';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            password += charset[array[i] % charset.length];
        }

        return password;
    }

    /**
     * Derive key from password using PBKDF2
     */
    async deriveKeyFromPassword(password, salt, iterations = 100000) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        // Import password as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey']
        );

        // Derive key
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: iterations,
                hash: this.config.hashAlgorithm
            },
            keyMaterial,
            { name: this.config.defaultAlgorithm, length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Generate salt for key derivation
     */
    generateSalt(length = 16) {
        return crypto.getRandomValues(new Uint8Array(length));
    }

    /**
     * Constant time string comparison to prevent timing attacks
     */
    constantTimeCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }

        return result === 0;
    }

    /**
     * Generate fingerprint for data
     */
    async generateFingerprint(data) {
        const hash = await this.hashData(data);
        return hash.substring(0, 16); // First 16 characters as fingerprint
    }

    /**
     * Encrypt object with automatic key generation
     */
    async encryptObject(obj) {
        const key = this.generateRandomBytes(32);
        const encrypted = await this.encryptSensitiveData(obj, key);
        const keyString = btoa(String.fromCharCode(...key));

        return {
            data: encrypted,
            key: keyString
        };
    }

    /**
     * Decrypt object
     */
    async decryptObject(encryptedData, keyString) {
        const key = new Uint8Array(
            atob(keyString).split('').map(char => char.charCodeAt(0))
        );
        return this.decryptSensitiveData(encryptedData, key);
    }

    /**
     * Check if Web Crypto API is available
     */
    isWebCryptoSupported() {
        return typeof crypto !== 'undefined' &&
               typeof crypto.subtle !== 'undefined' &&
               typeof crypto.getRandomValues !== 'undefined';
    }

    /**
     * Get crypto capabilities
     */
    getCryptoCapabilities() {
        if (!this.isWebCryptoSupported()) {
            return { supported: false };
        }

        return {
            supported: true,
            algorithms: {
                encryption: [this.config.defaultAlgorithm],
                hashing: [this.config.hashAlgorithm],
                keyDerivation: ['PBKDF2'],
                signing: ['HMAC']
            },
            keyLengths: {
                encryption: [128, 192, 256],
                hmac: [256, 384, 512]
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptoUtils;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.CryptoUtils = CryptoUtils;
}