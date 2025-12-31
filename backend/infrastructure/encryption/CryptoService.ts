import * as aesjs from 'aes-js';
import * as crypto from 'crypto';

export class CryptoService {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly KEY_LENGTH = 32; // 256 bits
    private static readonly IV_LENGTH = 16;
    private static readonly SALT_LENGTH = 64;
    private static readonly TAG_LENGTH = 16;

    /**
     * Derive a key from a password using PBKDF2
     */
    private static deriveKey(password: string, salt: Buffer): Buffer {
        return crypto.pbkdf2Sync(password, salt, 100000, this.KEY_LENGTH, 'sha256');
    }

    /**
     * Encrypt data with AES-256-GCM
     */
    static encrypt(data: string | Buffer, password: string): Buffer {
        const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

        // Generate random salt and IV
        const salt = crypto.randomBytes(this.SALT_LENGTH);
        const iv = crypto.randomBytes(this.IV_LENGTH);

        // Derive key from password
        const key = this.deriveKey(password, salt);

        // Encrypt
        const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
        const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
        const tag = cipher.getAuthTag();

        // Combine: salt + iv + tag + encrypted data
        return Buffer.concat([salt, iv, tag, encrypted]);
    }

    /**
     * Decrypt data encrypted with AES-256-GCM
     */
    static decrypt(encryptedData: Buffer, password: string): Buffer {
        // Extract components
        const salt = encryptedData.slice(0, this.SALT_LENGTH);
        const iv = encryptedData.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
        const tag = encryptedData.slice(
            this.SALT_LENGTH + this.IV_LENGTH,
            this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
        );
        const encrypted = encryptedData.slice(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);

        // Derive key from password
        const key = this.deriveKey(password, salt);

        // Decrypt
        const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }

    /**
     * Encrypt JSON object
     */
    static encryptJSON(obj: any, password: string): Buffer {
        const json = JSON.stringify(obj);
        return this.encrypt(json, password);
    }

    /**
     * Decrypt to JSON object
     */
    static decryptJSON<T = any>(encryptedData: Buffer, password: string): T {
        const decrypted = this.decrypt(encryptedData, password);
        return JSON.parse(decrypted.toString('utf8'));
    }

    /**
     * Generate a random encryption key
     */
    static generateKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Hash data with SHA-256
     */
    static hash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generate a secure random token
     */
    static generateToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }
}
