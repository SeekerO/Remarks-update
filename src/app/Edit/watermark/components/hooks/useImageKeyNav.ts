import { useEffect, useCallback } from "react";

export function useImageKeyNav(
    imageCount: number,
    selectedIndex: number | null,
    setSelectedIndex: (index: number | null) => void,
    gridColumns: number = 3   // ADD — pass in current gridSize
) {
    const goNext = useCallback(() => {
        if (imageCount === 0) return;
        setSelectedIndex(
            selectedIndex === null ? 0 : (selectedIndex + 1) % imageCount
        );
    }, [imageCount, selectedIndex, setSelectedIndex]);

    const goPrev = useCallback(() => {
        if (imageCount === 0) return;
        setSelectedIndex(
            selectedIndex === null
                ? imageCount - 1
                : (selectedIndex - 1 + imageCount) % imageCount
        );
    }, [imageCount, selectedIndex, setSelectedIndex]);

    // UP/DOWN jump a full row at a time
    const goNextRow = useCallback(() => {
        if (imageCount === 0) return;
        if (selectedIndex === null) { setSelectedIndex(0); return; }
        const next = selectedIndex + gridColumns;
        // If jumping past the end, wrap to first row equivalent
        setSelectedIndex(next >= imageCount ? selectedIndex % gridColumns : next);
    }, [imageCount, selectedIndex, setSelectedIndex, gridColumns]);

    const goPrevRow = useCallback(() => {
        if (imageCount === 0) return;
        if (selectedIndex === null) { setSelectedIndex(imageCount - 1); return; }
        const prev = selectedIndex - gridColumns;
        // If jumping before start, wrap to last row equivalent
        if (prev < 0) {
            const lastRowStart = Math.floor((imageCount - 1) / gridColumns) * gridColumns;
            const equivalent = lastRowStart + (selectedIndex % gridColumns);
            setSelectedIndex(equivalent >= imageCount ? imageCount - 1 : equivalent);
        } else {
            setSelectedIndex(prev);
        }
    }, [imageCount, selectedIndex, setSelectedIndex, gridColumns]);

    const deselect = useCallback(() => {
        setSelectedIndex(null);
    }, [setSelectedIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
            const active = document.activeElement;
            if (active && active.tagName === "CANVAS") return;

            switch (e.key) {
                case "ArrowRight":
                    e.preventDefault();
                    goNext();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    goPrev();
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    goNextRow();   // jumps a full row down
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    goPrevRow();   // jumps a full row up
                    break;
                case "Escape":
                    deselect();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goNext, goPrev, goNextRow, goPrevRow, deselect]);
}