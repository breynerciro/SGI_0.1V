import * as crypto from 'crypto';
import * as os from 'os';

export class MachineIdGenerator {
    /**
     * Generate a unique machine identifier (Simplified for ease of use)
     * Combines hostname and username to be stable but easy to replicate in scripts
     */
    static generate(): string {
        try {
            // Use hostname + platform + arch as a stable unique identifier for the machine
            // This avoids external dependencies like node-machine-id which can fail or differ
            const combined = `${os.hostname()}-${os.platform()}-${os.arch()}`;
            return crypto.createHash('sha256').update(combined).digest('hex');
        } catch (error) {
            console.error('Error generating machine ID:', error);
            // Fallback
            return 'fallback-id-' + os.hostname();
        }
    }

    /**
     * Get machine info for display
     */
    static getMachineInfo(): any {
        return {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            username: os.userInfo().username
        };
    }
}
