import { useState, useCallback, useRef } from "react";

const MAX_HISTORY = 30;

export function useHistory<T>(initialState: T) {
    const [current, setCurrent] = useState<T>(initialState);
    // past[past.length - 1] is the most recent snapshot before current
    const past = useRef<T[]>([]);
    const future = useRef<T[]>([]);

    const set = useCallback((newState: T | ((prev: T) => T), recordHistory = true) => {
        setCurrent(prev => {
            const next = typeof newState === "function"
                ? (newState as (prev: T) => T)(prev)
                : newState;

            if (recordHistory) {
                past.current = [...past.current.slice(-MAX_HISTORY), prev];
                future.current = []; // Clear redo stack on new action
            }

            return next;
        });
    }, []);

    const undo = useCallback(() => {
        if (past.current.length === 0) return;

        setCurrent(prev => {
            const previous = past.current[past.current.length - 1];
            past.current = past.current.slice(0, -1);
            future.current = [prev, ...future.current.slice(0, MAX_HISTORY - 1)];
            return previous;
        });
    }, []);

    const redo = useCallback(() => {
        if (future.current.length === 0) return;

        setCurrent(prev => {
            const next = future.current[0];
            future.current = future.current.slice(1);
            past.current = [...past.current.slice(-MAX_HISTORY), prev];
            return next;
        });
    }, []);

    const canUndo = past.current.length > 0;
    const canRedo = future.current.length > 0;

    return { current, set, undo, redo, canUndo, canRedo };
}