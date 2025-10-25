// app/watermark/components/ImageEditorContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Defines the structure for logo and footer settings
interface WatermarkSettings {
    position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
    width: number;
    height: number;
    paddingX: number;
    paddingY: number;
    opacity?: number;
    rotation?: number;
}

interface FooterSettings {
    opacity: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation?: number;
}

interface ShadowSettings {
    color: string;
    opacity: number;
    offsetX: number;
    offsetY: number;
    blur: number;
}

type ShadowTarget = "none" | "footer" | "whole-image";

interface ImageData {
    file: File;
    url: string;
    useGlobalSettings: boolean;
    individualLogoSettings?: WatermarkSettings;
    individualFooterSettings?: FooterSettings;
    individualShadowSettings?: ShadowSettings;
    individualLogo?: string | null;
    individualFooter?: string | null;
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
    globalShadowSettings: ShadowSettings;
    setGlobalShadowSettings: React.Dispatch<React.SetStateAction<ShadowSettings>>;
    globalShadowTarget: ShadowTarget;
    setGlobalShadowTarget: React.Dispatch<React.SetStateAction<ShadowTarget>>;
    removeAllImages: () => void;

    setIndividualLogo: (index: number, url: string | null) => void;
    setIndividualFooter: (index: number, url: string | null) => void;

    toggleUseGlobalSettings: () => void;

    updateIndividualLogoSettings: (settings: Partial<WatermarkSettings>) => void;
    updateIndividualFooterSettings: (settings: Partial<FooterSettings>) => void;
    updateIndividualShadowSettings: (settings: Partial<ShadowSettings>) => void;

    // ============================================
    // NEW: BATCH SELECTION STATE AND METHODS
    // ============================================
    selectedImages: number[];
    toggleImageSelection: (index: number) => void;
    selectAllImages: () => void;
    deselectAllImages: () => void;
    removeSelectedImages: () => void;
    isImageSelected: (index: number) => boolean;
}

// Default settings for the logo watermark.
const defaultLogoSettings: WatermarkSettings = {
    position: "bottom-right",
    width: 100,
    height: 100,
    paddingX: 20,
    paddingY: 20,
    opacity: 1,
    rotation: 0,
};

// Default settings for the footer.
const defaultFooterSettings: FooterSettings = {
    opacity: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
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

    // Global shadow settings and target
    const [globalShadowSettings, setGlobalShadowSettings] = useState<ShadowSettings>(defaultShadowSettings);
    const [globalShadowTarget, setGlobalShadowTarget] = useState<ShadowTarget>("none");

    // ============================================
    // NEW: BATCH SELECTION STATE
    // ============================================
    const [selectedImages, setSelectedImages] = useState<number[]>([]);

    const removeAllImages = () => {
        // Revoke object URLs to prevent memory leaks
        images.forEach(image => {
            URL.revokeObjectURL(image.url);
            if (image.individualLogo) URL.revokeObjectURL(image.individualLogo);
            if (image.individualFooter) URL.revokeObjectURL(image.individualFooter);
        });
        setImages([]);
        setSelectedImageIndex(null);
        setSelectedImages([]); // Clear batch selection
    };

    const setIndividualLogo = (index: number, url: string | null) => {
        setImages(prevImages => {
            const newImages = [...prevImages];
            if (newImages[index]?.individualLogo) {
                URL.revokeObjectURL(newImages[index].individualLogo!);
            }
            newImages[index] = {
                ...newImages[index],
                individualLogo: url,
                useGlobalSettings: false,
            };
            return newImages;
        });
    };

    const setIndividualFooter = (index: number, url: string | null) => {
        setImages(prevImages => {
            const newImages = [...prevImages];
            if (newImages[index]?.individualFooter) {
                URL.revokeObjectURL(newImages[index].individualFooter!);
            }
            newImages[index] = {
                ...newImages[index],
                individualFooter: url,
                useGlobalSettings: false,
            };
            return newImages;
        });
    };

    const toggleUseGlobalSettings = () => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                const currentImage = newImages[selectedImageIndex];
                if (currentImage) {
                    newImages[selectedImageIndex] = {
                        ...currentImage,
                        useGlobalSettings: !currentImage.useGlobalSettings,
                        individualLogoSettings: currentImage.individualLogoSettings || { ...defaultLogoSettings },
                        individualFooterSettings: currentImage.individualFooterSettings || { ...defaultFooterSettings },
                        individualShadowSettings: currentImage.individualShadowSettings || { ...defaultShadowSettings },
                    };
                }
                return newImages;
            });
        }
    };

    const updateIndividualLogoSettings = (settings: Partial<WatermarkSettings>) => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                newImages[selectedImageIndex] = {
                    ...newImages[selectedImageIndex],
                    individualLogoSettings: {
                        ...newImages[selectedImageIndex].individualLogoSettings,
                        ...settings
                    } as WatermarkSettings,
                    useGlobalSettings: false,
                };
                return newImages;
            });
        }
    };

    const updateIndividualFooterSettings = (settings: Partial<FooterSettings>) => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                newImages[selectedImageIndex] = {
                    ...newImages[selectedImageIndex],
                    individualFooterSettings: {
                        ...newImages[selectedImageIndex].individualFooterSettings,
                        ...settings
                    } as FooterSettings,
                    useGlobalSettings: false,
                };
                return newImages;
            });
        }
    };

    const updateIndividualShadowSettings = (settings: Partial<ShadowSettings>) => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                newImages[selectedImageIndex] = {
                    ...newImages[selectedImageIndex],
                    individualShadowSettings: {
                        ...newImages[selectedImageIndex].individualShadowSettings,
                        ...settings
                    } as ShadowSettings,
                    useGlobalSettings: false,
                };
                return newImages;
            });
        }
    };

    // ============================================
    // NEW: BATCH SELECTION METHODS
    // ============================================

    // Toggle selection of a single image
    const toggleImageSelection = (index: number) => {
        setSelectedImages(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    // Select all images
    const selectAllImages = () => {
        setSelectedImages(images.map((_, index) => index));
    };

    // Deselect all images
    const deselectAllImages = () => {
        setSelectedImages([]);
    };

    // Remove selected images
    const removeSelectedImages = () => {
        setImages(prevImages => {
            // Revoke URLs for selected images
            selectedImages.forEach(index => {
                const image = prevImages[index];
                if (image) {
                    URL.revokeObjectURL(image.url);
                    if (image.individualLogo) URL.revokeObjectURL(image.individualLogo);
                    if (image.individualFooter) URL.revokeObjectURL(image.individualFooter);
                }
            });

            // Filter out selected images
            const newImages = prevImages.filter((_, index) => !selectedImages.includes(index));

            // Clear selections
            setSelectedImages([]);
            setSelectedImageIndex(null);

            return newImages;
        });
    };

    // Check if an image is selected
    const isImageSelected = (index: number): boolean => {
        return selectedImages.includes(index);
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
                globalShadowSettings,
                setGlobalShadowSettings,
                globalShadowTarget,
                setGlobalShadowTarget,
                removeAllImages,
                setIndividualLogo,
                setIndividualFooter,
                toggleUseGlobalSettings,
                updateIndividualLogoSettings,
                updateIndividualFooterSettings,
                updateIndividualShadowSettings,
                // NEW: Batch selection exports
                selectedImages,
                toggleImageSelection,
                selectAllImages,
                deselectAllImages,
                removeSelectedImages,
                isImageSelected,
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