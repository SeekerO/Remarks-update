// app/context/ImageEditorContext.tsx
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
}

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
}

// Defines the props for the Image Editor Context.
interface ImageEditorContextProps {
    images: ImageData[];
    setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
    logo: string | null;
    setLogo: (url: string) => void;
    footer: string | null;
    setFooter: (url: string) => void;
    selectedImageIndex: number | null;
    setSelectedImageIndex: (index: number | null) => void;

    // New: Global settings that can be applied to all images
    globalLogoSettings: WatermarkSettings;
    setGlobalLogoSettings: React.Dispatch<React.SetStateAction<WatermarkSettings>>;
    globalFooterSettings: FooterSettings;
    setGlobalFooterSettings: React.Dispatch<React.SetStateAction<FooterSettings>>;
}

// Create the context with a null default value.
const ImageEditorContext = createContext<ImageEditorContextProps | null>(null);

// Provider component to wrap the application and provide context values.
export const ImageEditorProvider = ({ children }: { children: ReactNode }) => {
    const [images, setImages] = useState<ImageData[]>([]);
    const [logo, setLogoUrl] = useState<string | null>(null);
    const [footer, setFooterUrl] = useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    // Initial default global settings
    const [globalLogoSettings, setGlobalLogoSettings] = useState<WatermarkSettings>({
        position: "top-left",
        width: 100,
        height: 100,
        paddingX: 0,
        paddingY: 0,
    });
    const [globalFooterSettings, setGlobalFooterSettings] = useState<FooterSettings>({
        opacity: 1,
        scale: 1,
        offsetX: 0,
    });

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

