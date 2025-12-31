import { useEffect, useRef } from 'react';

/**
 * Custom hook to listen for barcode scanner input (rapid keyboard events).
 * @param onScan Callback function when a code is scanned
 * @param minLength Minimum length of the scanned code
 * @param delay Maximum delay between keystrokes in ms (typically 30-50ms for scanners)
 */
export function useBarcodeScanner(
    onScan: (code: string) => void,
    minLength: number = 3,
    delay: number = 50
) {
    const bufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore modifier keys
            if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
                return;
            }

            const currentTime = Date.now();

            // If the delay between keys is too long, it's probably manual typing
            // Scanners send keys very rapidly.
            if (currentTime - lastKeyTimeRef.current > delay) {
                bufferRef.current = '';
            }

            lastKeyTimeRef.current = currentTime;

            if (e.key === 'Enter') {
                if (bufferRef.current.length >= minLength) {
                    onScan(bufferRef.current);
                    bufferRef.current = '';
                }
            } else if (e.key.length === 1) {
                bufferRef.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onScan, minLength, delay]);
}
