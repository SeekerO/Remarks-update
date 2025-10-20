// src/hooks/useTemplateActions.js
"use client";

import { useImageEditor } from "./ImageEditorContext";

// This is a custom hook. Its name starts with 'use'.
// It's a reusable piece of logic that can be used inside components.
export function useTemplateActions() {
  const {
    logo,
    footer,
    globalLogoSettings,
    globalFooterSettings,
    globalShadowSettings,
    globalShadowTarget,
  } = useImageEditor();

  const saveTemplate = () => {
    const settingsToSave = {
      logo,
      footer,
      globalLogoSettings,
      globalFooterSettings,
      globalShadowSettings,
      globalShadowTarget,
    };
    window.localStorage.setItem(
      "previewTemplate",
      JSON.stringify(settingsToSave)
    );
  };

  const loadTemplate = () => {
    const savedData = localStorage.getItem("previewTemplate");
    if (savedData) {
      return JSON.parse(savedData);
    }
    return null;
  };

  // The custom hook returns the functions you can call.
  return { saveTemplate, loadTemplate };
}
