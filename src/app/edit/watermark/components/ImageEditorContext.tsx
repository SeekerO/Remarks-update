// app/watermark/components/ImageEditorContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useHistory } from "./hooks/useHistory";

// NEW: Logo item interface for multiple logos
interface LogoItem {
    id: string;
    url: string;
    settings: WatermarkSettings;
}

// NEW: Footer item interface for multiple footers
interface FooterItem {
    id: string;
    url: string;
    settings: FooterSettings;
}

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
    autoFit: boolean;
    fitScale: number;
}

interface ShadowSettings {
    color: string;
    opacity: number;
    offsetX: number;
    offsetY: number;
    blur: number;
}

interface PhotoAdjustments {
    exposure: number;        // -100 to 100 (affects brightness multiplicatively)
    brilliance: number;      // -100 to 100 (enhances mid-tones)
    highlights: number;      // -100 to 100 (bright area recovery)
    shadows: number;         // -100 to 100 (shadow enhancement)
    contrast: number;        // -100 to 100 (difference between light/dark)
    brightness: number;      // -100 to 100 (simple brightness)
    blackPoint: number;      // 0 to 100 (deepens blacks)
    saturation: number;      // -100 to 100 (color intensity)
    vibrance: number;        // -100 to 100 (smart saturation)
    warmth: number;          // -100 to 100 (temperature adjustment)
    tint: number;            // -100 to 100 (green/magenta balance)
    sharpness: number;       // 0 to 100 (edge enhancement)
    definition: number;      // 0 to 100 (local contrast)
    noiseReduction: number;  // 0 to 100 (smoothing)
    vignette: number;        // 0 to 100 (corner darkening)
}

interface ImageData {
    file: File;
    url: string;
    useGlobalSettings: boolean;
    individualLogoSettings?: WatermarkSettings;
    individualFooterSettings?: FooterSettings;
    individualShadowSettings?: ShadowSettings;
    individualLogo?: string | null;
    individualFooter?: string | null;
    individualLogos?: LogoItem[];
    individualFooters?: FooterItem[];
    // NEW: Photo adjustments
    photoAdjustments?: PhotoAdjustments;
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
    // NEW: Individual logos array
    individualLogos?: LogoItem[];
    // NEW: Individual footers array
    individualFooters?: FooterItem[];
}

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
    selectedImages: number[];
    toggleImageSelection: (index: number) => void;
    selectAllImages: () => void;
    deselectAllImages: () => void;
    removeSelectedImages: () => void;
    isImageSelected: (index: number) => boolean;

    // NEW: Multiple logos support
    globalLogos: LogoItem[];
    addGlobalLogo: (url: string) => string;
    removeGlobalLogo: (logoId: string) => void;
    updateGlobalLogoSettings: (logoId: string, settings: Partial<WatermarkSettings>) => void;
    selectedLogoId: string | null;
    setSelectedLogoId: React.Dispatch<React.SetStateAction<string | null>>;
    addIndividualLogo: (imageIndex: number, url: string) => string;
    removeIndividualLogo: (imageIndex: number, logoId: string) => void;
    updateIndividualImageLogoSettings: (imageIndex: number, logoId: string, settings: Partial<WatermarkSettings>) => void;

    // NEW: Multiple footers support
    globalFooters: FooterItem[];
    addGlobalFooter: (url: string) => string;
    removeGlobalFooter: (footerId: string) => void;
    updateGlobalFooterSettings: (footerId: string, settings: Partial<FooterSettings>) => void;
    selectedFooterId: string | null;
    setSelectedFooterId: React.Dispatch<React.SetStateAction<string | null>>;
    addIndividualFooter: (imageIndex: number, url: string) => string;
    removeIndividualFooter: (imageIndex: number, footerId: string) => void;
    updateIndividualImageFooterSettings: (imageIndex: number, footerId: string, settings: Partial<FooterSettings>) => void;

    reorderGlobalLogos: (newLogos: LogoItem[]) => void;
    reorderIndividualLogos: (imageIndex: number, newLogos: LogoItem[]) => void;
    reorderGlobalFooters: (newFooters: FooterItem[]) => void;
    reorderIndividualFooters: (imageIndex: number, newFooters: FooterItem[]) => void;

    globalPhotoAdjustments: PhotoAdjustments;
    setGlobalPhotoAdjustments: React.Dispatch<React.SetStateAction<PhotoAdjustments>>;
    updateIndividualPhotoAdjustments: (settings: Partial<PhotoAdjustments>) => void;
    resetPhotoAdjustments: () => void;

    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    copyGlobalToIndividual: () => void;
    reorderImages: (fromIndex: number, toIndex: number) => void;
}

export const defaultPhotoAdjustments: PhotoAdjustments = {
    exposure: 0,
    brilliance: 0,
    highlights: 0,
    shadows: 0,
    contrast: 0,
    brightness: 0,
    blackPoint: 0,
    saturation: 0,
    vibrance: 0,
    warmth: 0,
    tint: 0,
    sharpness: 0,
    definition: 0,
    noiseReduction: 0,
    vignette: 0,
};

const defaultLogoSettings: WatermarkSettings = {
    position: "bottom-right",
    width: 100,
    height: 100,
    paddingX: 20,
    paddingY: 20,
    opacity: 1,
    rotation: 0,
};

const defaultFooterSettings: FooterSettings = {
    opacity: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    autoFit: false,
    fitScale: 25,
};

const defaultShadowSettings: ShadowSettings = {
    color: "#000000",
    opacity: 0.5,
    offsetX: 5,
    offsetY: 5,
    blur: 5,
};

const ImageEditorContext = createContext<ImageEditorContextType | undefined>(undefined);

export const ImageEditorProvider = ({ children }: { children: ReactNode }) => {
    const {
        current: images,
        set: setImages,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useHistory<ImageData[]>([]);
    const [logo, setLogoUrl] = useState<string | null>(null);
    const [footer, setFooterUrl] = useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [globalLogoSettings, setGlobalLogoSettings] = useState<WatermarkSettings>(defaultLogoSettings);
    const [globalFooterSettings, setGlobalFooterSettings] = useState<FooterSettings>(defaultFooterSettings);
    const [globalShadowSettings, setGlobalShadowSettings] = useState<ShadowSettings>(defaultShadowSettings);
    const [globalShadowTarget, setGlobalShadowTarget] = useState<ShadowTarget>("none");
    const [selectedImages, setSelectedImages] = useState<number[]>([]);

    // NEW: Multiple logos state
    const [globalLogos, setGlobalLogos] = useState<LogoItem[]>([]);
    const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);

    // NEW: Multiple footers state
    const [globalFooters, setGlobalFooters] = useState<FooterItem[]>([]);
    const [selectedFooterId, setSelectedFooterId] = useState<string | null>(null);

    const [globalPhotoAdjustments, setGlobalPhotoAdjustments] = useState<PhotoAdjustments>(defaultPhotoAdjustments);

    const updateIndividualPhotoAdjustments = (settings: Partial<PhotoAdjustments>) => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                newImages[selectedImageIndex] = {
                    ...newImages[selectedImageIndex],
                    photoAdjustments: {
                        ...(newImages[selectedImageIndex].photoAdjustments || defaultPhotoAdjustments),
                        ...settings
                    },
                    useGlobalSettings: false,
                };
                return newImages;
            });
        }
    };

    const resetPhotoAdjustments = () => {
        if (selectedImageIndex !== null) {
            setImages(prevImages => {
                const newImages = [...prevImages];
                newImages[selectedImageIndex] = {
                    ...newImages[selectedImageIndex],
                    photoAdjustments: { ...defaultPhotoAdjustments },
                };
                return newImages;
            });
        } else {
            setGlobalPhotoAdjustments({ ...defaultPhotoAdjustments });
        }
    };

    const removeAllImages = () => {
        images.forEach(image => {
            URL.revokeObjectURL(image.url);
            if (image.individualLogo) URL.revokeObjectURL(image.individualLogo);
            if (image.individualFooter) URL.revokeObjectURL(image.individualFooter);
            image.individualLogos?.forEach(logo => URL.revokeObjectURL(logo.url));
            image.individualFooters?.forEach(footer => URL.revokeObjectURL(footer.url));
        });
        setImages([]);
        setSelectedImageIndex(null);
        setSelectedImages([]);

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

    const copyGlobalToIndividual = () => {
        if (selectedImageIndex === null) return;

        setImages(prevImages => {
            const newImages = [...prevImages];
            const current = newImages[selectedImageIndex];
            if (!current) return prevImages;

            // Deep-copy every global logo into individual logos
            const copiedLogos: LogoItem[] = globalLogos.map(logo => ({
                ...logo,
                id: `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                settings: { ...logo.settings },
            }));

            // Deep-copy every global footer into individual footers
            const copiedFooters: FooterItem[] = globalFooters.map(footer => ({
                ...footer,
                id: `footer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                settings: { ...footer.settings },
            }));

            newImages[selectedImageIndex] = {
                ...current,
                useGlobalSettings: false,
                individualLogos: copiedLogos,
                individualFooters: copiedFooters,
                individualLogoSettings: { ...globalLogoSettings },
                individualFooterSettings: { ...globalFooterSettings },
                individualShadowSettings: { ...globalShadowSettings },
                photoAdjustments: { ...globalPhotoAdjustments },
            };

            return newImages;
        });

        // Select first copied logo/footer so controls are immediately active
        if (globalLogos.length > 0) {
            setSelectedLogoId(globalLogos[0].id);
        }
        if (globalFooters.length > 0) {
            setSelectedFooterId(globalFooters[0].id);
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

    const toggleImageSelection = (index: number) => {
        setSelectedImages(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    const selectAllImages = () => {
        setSelectedImages(images.map((_, index) => index));
    };

    const deselectAllImages = () => {
        setSelectedImages([]);
    };

    const removeSelectedImages = () => {
        setImages(prevImages => {
            selectedImages.forEach(index => {
                const image = prevImages[index];
                if (image) {
                    URL.revokeObjectURL(image.url);
                    if (image.individualLogo) URL.revokeObjectURL(image.individualLogo);
                    if (image.individualFooter) URL.revokeObjectURL(image.individualFooter);
                    image.individualLogos?.forEach(logo => URL.revokeObjectURL(logo.url));
                    image.individualFooters?.forEach(footer => URL.revokeObjectURL(footer.url));
                }
            });

            const newImages = prevImages.filter((_, index) => !selectedImages.includes(index));
            setSelectedImages([]);
            setSelectedImageIndex(null);
            return newImages;
        });
    };

    const isImageSelected = (index: number): boolean => {
        return selectedImages.includes(index);
    };

    const addGlobalLogo = (url: string): string => {
        const logoId = `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newLogo: LogoItem = {
            id: logoId,
            url,
            settings: { ...defaultLogoSettings }
        };
        setGlobalLogos(prev => [...prev, newLogo]);
        setSelectedLogoId(logoId);
        return logoId;
    };

    const removeGlobalLogo = (logoId: string) => {
        setGlobalLogos(prev => {
            const logo = prev.find(l => l.id === logoId);
            if (logo) URL.revokeObjectURL(logo.url);
            const remaining = prev.filter(l => l.id !== logoId);
            if (logoId === selectedLogoId) {
                setSelectedLogoId(remaining[0]?.id ?? null);
            }
            return remaining;
        });
    };

    const updateGlobalLogoSettings = (logoId: string, settings: Partial<WatermarkSettings>) => {
        setGlobalLogos(prev => prev.map(logo =>
            logo.id === logoId
                ? { ...logo, settings: { ...logo.settings, ...settings } }
                : logo
        ));
    };

    const addIndividualLogo = (imageIndex: number, url: string): string => {
        const logoId = `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newLogo: LogoItem = {
            id: logoId,
            url,
            settings: { ...defaultLogoSettings }
        };

        setImages(prevImages => {
            const newImages = [...prevImages];
            newImages[imageIndex] = {
                ...newImages[imageIndex],
                individualLogos: [...(newImages[imageIndex].individualLogos || []), newLogo],
                useGlobalSettings: false,
            };
            return newImages;
        });

        return logoId;
    };

    const removeIndividualLogo = (imageIndex: number, logoId: string) => {
        setImages(prevImages => {
            const newImages = [...prevImages];
            if (!newImages[imageIndex]) return prevImages;

            const logos = newImages[imageIndex].individualLogos || [];
            const logo = logos.find(l => l.id === logoId);
            if (logo) URL.revokeObjectURL(logo.url);

            newImages[imageIndex] = {
                ...newImages[imageIndex],
                individualLogos: logos.filter(l => l.id !== logoId),
            };
            return newImages;
        });
    };

    const updateIndividualImageLogoSettings = (imageIndex: number, logoId: string, settings: Partial<WatermarkSettings>) => {
        setImages(prevImages => {
            const newImages = [...prevImages];
            if (!newImages[imageIndex]) return prevImages;

            const logos = newImages[imageIndex].individualLogos || [];

            newImages[imageIndex] = {
                ...newImages[imageIndex],
                individualLogos: logos.map(logo =>
                    logo.id === logoId
                        ? { ...logo, settings: { ...logo.settings, ...settings } }
                        : logo
                ),
            };
            return newImages;
        });
    };

    // NEW: Multiple footers methods
    const addGlobalFooter = (url: string): string => {
        const footerId = `footer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newFooter: FooterItem = {
            id: footerId,
            url,
            settings: { ...defaultFooterSettings }
        };
        setGlobalFooters(prev => [...prev, newFooter]);
        setSelectedFooterId(footerId);
        return footerId;
    };

    const removeGlobalFooter = (footerId: string) => {
        setGlobalFooters(prev => {
            const footer = prev.find(f => f.id === footerId);
            if (footer) URL.revokeObjectURL(footer.url);
            const remaining = prev.filter(f => f.id !== footerId);
            // Fix: same stale closure fix as logos
            if (footerId === selectedFooterId) {
                setSelectedFooterId(remaining[0]?.id ?? null);
            }
            return remaining;
        });
    };

    const updateGlobalFooterSettingsById = (footerId: string, settings: Partial<FooterSettings>) => {
        setGlobalFooters(prev => prev.map(footer =>
            footer.id === footerId
                ? { ...footer, settings: { ...footer.settings, ...settings } }
                : footer
        ));
    };

    const addIndividualFooter = (imageIndex: number, url: string): string => {
        const footerId = `footer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newFooter: FooterItem = {
            id: footerId,
            url,
            settings: { ...defaultFooterSettings }
        };

        setImages(prevImages => {
            const newImages = [...prevImages];
            newImages[imageIndex] = {
                ...newImages[imageIndex],
                individualFooters: [...(newImages[imageIndex].individualFooters || []), newFooter],
                useGlobalSettings: false,
            };
            return newImages;
        });

        return footerId;
    };

    const removeIndividualFooter = (imageIndex: number, footerId: string) => {
        setImages(prevImages => {
            const newImages = [...prevImages];
            const footers = newImages[imageIndex].individualFooters || [];
            const footer = footers.find(f => f.id === footerId);
            if (footer) URL.revokeObjectURL(footer.url);

            newImages[imageIndex] = {
                ...newImages[imageIndex],
                individualFooters: footers.filter(f => f.id !== footerId),
            };
            return newImages;
        });
    };

    const updateIndividualImageFooterSettings = (imageIndex: number, footerId: string, settings: Partial<FooterSettings>) => {
        setImages(prevImages => {
            const newImages = [...prevImages];
            const footers = newImages[imageIndex].individualFooters || [];

            newImages[imageIndex] = {
                ...newImages[imageIndex],
                individualFooters: footers.map(footer =>
                    footer.id === footerId
                        ? { ...footer, settings: { ...footer.settings, ...settings } }
                        : footer
                ),
            };
            return newImages;
        });
    };

    const reorderImages = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        setImages(prev => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
        // Keep selectedImageIndex tracking the same image after reorder
        setSelectedImageIndex(prev => {
            if (prev === null) return null;
            if (prev === fromIndex) return toIndex;
            if (fromIndex < toIndex) {
                if (prev > fromIndex && prev <= toIndex) return prev - 1;
            } else {
                if (prev >= toIndex && prev < fromIndex) return prev + 1;
            }
            return prev;
        });
    };


    // NEW: Reorder methods for logos
    const reorderGlobalLogos = (newLogos: LogoItem[]) => {
        setGlobalLogos(newLogos);
    };

    const reorderIndividualLogos = (imageIndex: number, newLogos: LogoItem[]) => {
        setImages(prevImages => {
            const newImages = [...prevImages];
            if (!newImages[imageIndex]) return prevImages;

            newImages[imageIndex] = {
                ...newImages[imageIndex],
                individualLogos: newLogos,
            };
            return newImages;
        });
    };

    // NEW: Reorder methods for footers
    const reorderGlobalFooters = (newFooters: FooterItem[]) => {
        setGlobalFooters(newFooters);
    };

    const reorderIndividualFooters = (imageIndex: number, newFooters: FooterItem[]) => {
        setImages(prevImages => {
            const newImages = [...prevImages];
            if (!newImages[imageIndex]) return prevImages;

            newImages[imageIndex] = {
                ...newImages[imageIndex],
                individualFooters: newFooters,
            };
            return newImages;
        });
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
                selectedImages,
                toggleImageSelection,
                selectAllImages,
                deselectAllImages,
                removeSelectedImages,
                isImageSelected,
                globalLogos,
                addGlobalLogo,
                removeGlobalLogo,
                updateGlobalLogoSettings,
                selectedLogoId,
                setSelectedLogoId,
                addIndividualLogo,
                removeIndividualLogo,
                updateIndividualImageLogoSettings,
                globalFooters,
                addGlobalFooter,
                removeGlobalFooter,
                updateGlobalFooterSettings: updateGlobalFooterSettingsById,
                selectedFooterId,
                setSelectedFooterId,
                addIndividualFooter,
                removeIndividualFooter,
                updateIndividualImageFooterSettings,
                reorderGlobalLogos,
                reorderIndividualLogos,
                reorderGlobalFooters,
                reorderIndividualFooters,
                globalPhotoAdjustments,
                setGlobalPhotoAdjustments,
                updateIndividualPhotoAdjustments,
                resetPhotoAdjustments,
                undo,
                redo,
                canUndo,
                canRedo,
                copyGlobalToIndividual,
                reorderImages
            }}
        >
            {children}
        </ImageEditorContext.Provider>
    );
};

export const useImageEditor = () => {
    const context = useContext(ImageEditorContext);
    if (!context) {
        throw new Error("useImageEditor must be used within an ImageEditorProvider");
    }
    return context;
};