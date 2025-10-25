import { useEffect } from "react";

interface ShortcutConfig {
  onSave?: () => void;
  onDownload?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
}

export const useKeyboardShortcuts = (config: ShortcutConfig) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save template
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        config.onSave?.();
      }

      // Ctrl/Cmd + D: Download
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        config.onDownload?.();
      }

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        config.onUndo?.();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if (
        (e.ctrlKey || e.metaKey) &&
        ((e.shiftKey && e.key === "z") || e.key === "y")
      ) {
        e.preventDefault();
        config.onRedo?.();
      }

      // Ctrl/Cmd + A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        config.onSelectAll?.();
      }

      // Delete key: Delete selected
      if (e.key === "Delete") {
        config.onDelete?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config]);
};
