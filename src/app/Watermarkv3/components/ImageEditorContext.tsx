// app/components/ImageEditorContext.tsx
"use client";


import React, { createContext, useContext, useState, ReactNode } from "react";

// Defines the structure for logo and footer settings
interface WatermarkSettings {
    position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
    width: number;
    height: number;
    paddingX: number;
    paddingY: number;
}

interface FooterSettings {
    opacity: number;
    scale: number;
    offsetX: number;
    offsetY: number;
}

// NEW: Defines the structure for shadow settings
interface ShadowSettings {
    color: string; // e.g., "#000000"
    opacity: number; // 0-1
    offsetX: number; // pixels
    offsetY: number; // pixels
    blur: number; // Blur radius for the shadow
}

// NEW: Defines the target for the shadow
type ShadowTarget = "none" | "footer" | "whole-image";


// Defines the structure for image data, including a flag for global settings
// and optional individual settings.
interface ImageData {
    file: File;
    url: string;
    // New: Flag to determine if this image uses global settings
    useGlobalSettings: boolean;
    // Optional: Individual settings, only used if useGlobalSettings is false
    individualLogoSettings?: WatermarkSettings;
    individualFooterSettings?: FooterSettings;
    individualShadowSettings?: ShadowSettings; // NEW: Individual shadow settings

    // NEW: Individual logo and footer image URLs
    individualLogo?: string;
    individualFooter?: string;
}

// Defines the shape of the context values that will be provided.
interface ImageEditorContextType {
    images: ImageData[];
    setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
    logo: string | null;
    setLogo: (url: string | null) => void;
    footer: string | null;
    setFooter: (url: string | null) => void;
    selectedImageIndex: number | null;
    setSelectedImageIndex: React.Dispatch<React.SetStateAction<number | null>>;
    globalLogoSettings: WatermarkSettings;
    setGlobalLogoSettings: React.Dispatch<React.SetStateAction<WatermarkSettings>>;
    globalFooterSettings: FooterSettings;
    setGlobalFooterSettings: React.Dispatch<React.SetStateAction<FooterSettings>>;
    globalShadowSettings: ShadowSettings; // NEW: Add global shadow settings
    setGlobalShadowSettings: React.Dispatch<React.SetStateAction<ShadowSettings>>;
    globalShadowTarget: ShadowTarget; // NEW: Add global shadow target
    setGlobalShadowTarget: React.Dispatch<React.SetStateAction<ShadowTarget>>;
    removeAllImages: () => void;

    // NEW: Functions to update individual logo/footer for the selected image
    setIndividualLogo: (url: string | null) => void;
    setIndividualFooter: (url: string | null) => void;

    // NEW: Function to toggle useGlobalSettings for selected image
    toggleUseGlobalSettings: () => void;

    // NEW: Function to update individual settings for selected image
    updateIndividualLogoSettings: (settings: Partial<WatermarkSettings>) => void;
    updateIndividualFooterSettings: (settings: Partial<FooterSettings>) => void;
    updateIndividualShadowSettings: (settings: Partial<ShadowSettings>) => void;
}

// Default settings for the logo watermark.
const defaultLogoSettings: WatermarkSettings = {
    position: "bottom-right",
    width: 100,
    height: 100,
    paddingX: 20,
    paddingY: 20,
};

// Default settings for the footer.
const defaultFooterSettings: FooterSettings = {
    opacity: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
};

// Default settings for the shadow.
const defaultShadowSettings: ShadowSettings = {
    color: "#000000",
    opacity: 0.5,
    offsetX: 5,
    offsetY: 5,
    blur: 5,
};


// Create the context with a default undefined value.
const ImageEditorContext = createContext<ImageEditorContextType | undefined>(undefined);

// Provider component to encapsulate the state and provide it to children.
export const ImageEditorProvider = ({ children }: { children: ReactNode }) => {
    const [images, setImages] = useState<ImageData[]>([]);
    const [logo, setLogoUrl] = useState<string | null>(null);
    const [footer, setFooterUrl] = useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    // Global settings for logo and footer
    const [globalLogoSettings, setGlobalLogoSettings] = useState<WatermarkSettings>(defaultLogoSettings);
    const [globalFooterSettings, setGlobalFooterSettings] = useState<FooterSettings>(defaultFooterSettings);

    // NEW: Global shadow settings and target
    const [globalShadowSettings, setGlobalShadowSettings] = useState<ShadowSettings>(defaultShadowSettings);
    const [globalShadowTarget, setGlobalShadowTarget] = useState<ShadowTarget>("none");


    const removeAllImages = () => {
        // Revoke object URLs to prevent memory leaks
        images.forEach(image => {
            URL.revokeObjectURL(image.url);
            if (image.individualLogo) URL.revokeObjectURL(image.individualLogo);
            if (image.individualFooter) URL.revokeObjectURL(image.individualFooter);
        });
        setImages([]);
        setSelectedImageIndex(null); // Deselect any image when all are removed
    };

    // NEW: Function to set individual logo for the selected image
    const setIndividualLogo = (url: string | null) => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                if (newImages[selectedImageIndex]?.individualLogo) {
                    URL.revokeObjectURL(newImages[selectedImageIndex].individualLogo!);
                }
                newImages[selectedImageIndex] = {
                    ...newImages[selectedImageIndex],
                    individualLogo: url,
                    useGlobalSettings: false, // Automatically switch to individual settings
                };
                return newImages;
            });
        }
    };

    // NEW: Function to set individual footer for the selected image
    const setIndividualFooter = (url: string | null) => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                if (newImages[selectedImageIndex]?.individualFooter) {
                    URL.revokeObjectURL(newImages[selectedImageIndex].individualFooter!);
                }
                newImages[selectedImageIndex] = {
                    ...newImages[selectedImageIndex],
                    individualFooter: url,
                    useGlobalSettings: false, // Automatically switch to individual settings
                };
                return newImages;
            });
        }
    };

    // NEW: Function to toggle useGlobalSettings for the selected image
    const toggleUseGlobalSettings = () => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                const currentImage = newImages[selectedImageIndex];
                if (currentImage) {
                    newImages[selectedImageIndex] = {
                        ...currentImage,
                        useGlobalSettings: !currentImage.useGlobalSettings,
                        // Initialize individual settings if switching from global and they don't exist
                        individualLogoSettings: currentImage.individualLogoSettings || { ...defaultLogoSettings },
                        individualFooterSettings: currentImage.individualFooterSettings || { ...defaultFooterSettings },
                        individualShadowSettings: currentImage.individualShadowSettings || { ...defaultShadowSettings },
                    };
                }
                return newImages;
            });
        }
    };

    // NEW: Function to update individual logo settings for the selected image
    const updateIndividualLogoSettings = (settings: Partial<WatermarkSettings>) => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                newImages[selectedImageIndex] = {
                    ...newImages[selectedImageIndex],
                    individualLogoSettings: {
                        ...newImages[selectedImageIndex].individualLogoSettings,
                        ...settings
                    } as WatermarkSettings, // Type assertion as we know it's being initialized above
                    useGlobalSettings: false, // Ensure individual settings are active
                };
                return newImages;
            });
        }
    };

    // NEW: Function to update individual footer settings for the selected image
    const updateIndividualFooterSettings = (settings: Partial<FooterSettings>) => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                newImages[selectedImageIndex] = {
                    ...newImages[selectedImageIndex],
                    individualFooterSettings: {
                        ...newImages[selectedImageIndex].individualFooterSettings,
                        ...settings
                    } as FooterSettings, // Type assertion
                    useGlobalSettings: false, // Ensure individual settings are active
                };
                return newImages;
            });
        }
    };

    // NEW: Function to update individual shadow settings for the selected image
    const updateIndividualShadowSettings = (settings: Partial<ShadowSettings>) => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                newImages[selectedImageIndex] = {
                    ...newImages[selectedImageIndex],
                    individualShadowSettings: {
                        ...newImages[selectedImageIndex].individualShadowSettings,
                        ...settings
                    } as ShadowSettings, // Type assertion
                    useGlobalSettings: false, // Ensure individual settings are active
                };
                return newImages;
            });
        }
    };


    return (
        <ImageEditorContext.Provider
            value={{
                images,
                setImages,
                logo,
                setLogo: setLogoUrl,
                footer,
                setFooter: setFooterUrl,
                selectedImageIndex,
                setSelectedImageIndex,
                globalLogoSettings,
                setGlobalLogoSettings,
                globalFooterSettings,
                setGlobalFooterSettings,
                // NEW: Add global shadow settings to context
                globalShadowSettings,
                setGlobalShadowSettings,
                globalShadowTarget,
                setGlobalShadowTarget,
                removeAllImages,
                // NEW: Add individual logo/footer setters to context
                setIndividualLogo,
                setIndividualFooter,
                // NEW: Add toggle and individual settings updaters
                toggleUseGlobalSettings,
                updateIndividualLogoSettings,
                updateIndividualFooterSettings,
                updateIndividualShadowSettings,
            }}
        >
            {children}
        </ImageEditorContext.Provider>
    );
};

// Custom hook to easily consume the Image Editor Context.
export const useImageEditor = () => {
    const context = useContext(ImageEditorContext);
    if (!context) {
        throw new Error("useImageEditor must be used within an ImageEditorProvider");
    }
    return context;
};