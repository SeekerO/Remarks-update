// app/watermark/components/ImageEditorContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

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
}

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
    const [images, setImages] = useState<ImageData[]>([]);
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

    // NEW: Multiple logos methods
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
            return prev.filter(l => l.id !== logoId);
        });
        if (selectedLogoId === logoId) {
            setSelectedLogoId(globalLogos.length > 1 ? globalLogos[0]?.id || null : null);
        }
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
            return prev.filter(f => f.id !== footerId);
        });
        if (selectedFooterId === footerId) {
            setSelectedFooterId(globalFooters.length > 1 ? globalFooters[0]?.id || null : null);
        }
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