import { useEffect } from "react";

interface ShortcutConfig {
  onSave?: () => void;
  onDownload?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onDeselect?: () => void;
}

export const useKeyboardShortcuts = (config: ShortcutConfig) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire when user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        config.onSave?.();
      }
      // Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        config.onDownload?.();
      }
      // Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        config.onUndo?.();
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === "z") || e.key === "y")) {
        e.preventDefault();
        config.onRedo?.();
      }
      // Ctrl/Cmd + A
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        config.onSelectAll?.();
      }
      // Delete
      if (e.key === "Delete") {
        config.onDelete?.();
      }
      // Arrow right / Arrow down — next image
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        config.onNext?.();
      }
      // Arrow left / Arrow up — previous image
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        config.onPrev?.();
      }
      // Escape — deselect
      if (e.key === "Escape") {
        config.onDeselect?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config]);
};