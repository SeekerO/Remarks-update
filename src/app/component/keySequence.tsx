import { useEffect, useRef } from "react";

type KeySequenceCallback = () => void;

export function useKeySequence(callback: KeySequenceCallback) {
    const pressedKeysRef = useRef<string[]>([]);
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Read and parse sequences from environment variable
    const rawSequences = process.env.NEXT_PUBLIC_KEY_SEQUENCES || "";
    const targetSequences = rawSequences
        .split("|")
        .map(seq => seq.split(",").map(k => k.trim().toLowerCase()))
        .filter(seq => seq.length > 0);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Skip modifier keys
            if (event.metaKey || event.ctrlKey || event.altKey) return;

            const key = event.key.toLowerCase();
            pressedKeysRef.current.push(key);

            // Reset timeout on every key press
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = setTimeout(() => {
                pressedKeysRef.current = [];
            }, 1500); // reset after 1.5s

            // Limit the length of the recorded keys
            const maxLength = Math.max(...targetSequences.map(seq => seq.length));
            if (pressedKeysRef.current.length > maxLength) {
                pressedKeysRef.current.shift();
            }

            // Check all target sequences
            for (const sequence of targetSequences) {
                if (
                    pressedKeysRef.current.join(",") === sequence.join(",")
                ) {
                    callback();
                    pressedKeysRef.current = [];
                    break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        };
    }, [callback, rawSequences]);
}
