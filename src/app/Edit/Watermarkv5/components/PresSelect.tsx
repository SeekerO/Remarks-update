import React, { useState, useMemo, useCallback } from "react";
import { useImageEditor } from "./ImageEditorContext";
import { X, ImageIcon, Layers } from "lucide-react";

//FOOTER
import BlackShadow from "../../images/00-BLACK-SHADOW-FOOTER.png";
import WhiteShadow from "../../images/01-WHITE-SHADOW-FOOTER.png";


//LOGO
import WhiteLogoEID from "../../images/WHITE-EID.png";
import BlackLogoEID from "../../images/BLACK-EID.png"
import BlackLogoEIDandCOMELEC from "../../images/BLACK-EID-W-COMELEC.png"
import WHITELogoEIDandCOMELEC from "../../images/WHITE-EID-W-COMELEC.png"
import COMELEClogo from "../../images/COMELEC.png";
import KKKlogo from "../../images/KKK.png";

const PRESET_IMAGES = [
    // Logos
    { id: 1, url: WhiteLogoEID.src, name: "WHITE EID LOGO", type: "logo" },
    { id: 2, url: BlackLogoEID.src, name: "BLACK EID LOGO", type: "logo" },
    { id: 3, url: WHITELogoEIDandCOMELEC.src, name: "WHITE EID & COMELEC LOGO", type: "logo" },
    { id: 4, url: BlackLogoEIDandCOMELEC.src, name: "BLACK EID & COMELEC LOGO", type: "logo" },
    { id: 5, url: COMELEClogo.src, name: "COMELEC LOGO", type: "logo" },
    { id: 6, url: KKKlogo.src, name: "KKK LOGO", type: "logo" },

    // Footers
    { id: 7, url: BlackShadow.src, name: "Black Shadow Footer", type: "footer" },
    { id: 8, url: WhiteShadow.src, name: "White Shadow Footer", type: "footer" },
];

const PresSelect = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    const {
        selectedImageIndex,
        images,
        addGlobalLogo,
        addIndividualLogo,
        addGlobalFooter,
        addIndividualFooter,
    } = useImageEditor();

    const isIndividual = selectedImageIndex !== null && !images[selectedImageIndex]?.useGlobalSettings;

    const handleImageSelect = useCallback((imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
    }, []);

    const selectedImage = useMemo(() => {
        if (!selectedImageUrl) return null;
        return PRESET_IMAGES.find(img => img.url === selectedImageUrl) || null;
    }, [selectedImageUrl]);

    const handleAddAsLogo = useCallback(() => {
        if (!selectedImage) return;

        if (isIndividual && selectedImageIndex !== null) {
            addIndividualLogo(selectedImageIndex, selectedImage.url);
        } else {
            addGlobalLogo(selectedImage.url);
        }

        setSelectedImageUrl(null);
        setShowModal(false);
    }, [selectedImage, isIndividual, selectedImageIndex, addIndividualLogo, addGlobalLogo]);

    const handleAddAsFooter = useCallback(() => {
        if (!selectedImage) return;

        if (isIndividual && selectedImageIndex !== null) {
            addIndividualFooter(selectedImageIndex, selectedImage.url);
        } else {
            addGlobalFooter(selectedImage.url);
        }

        setSelectedImageUrl(null);
        setShowModal(false);
    }, [selectedImage, isIndividual, selectedImageIndex, addIndividualFooter, addGlobalFooter]);

    const Modal = () => {
        if (!showModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Select Preset Image
                        </h2>
                        <button
                            onClick={() => {
                                setShowModal(false);
                                setSelectedImageUrl(null);
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Logos Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                                Logos
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {PRESET_IMAGES.filter(item => item.type === "logo").map((item) => {
                                    const isSelected = selectedImageUrl === item.url;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleImageSelect(item.url)}
                                            className={`h-fit cursor-pointer group relative overflow-hidden rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${isSelected
                                                ? "border-indigo-500 dark:border-indigo-400 shadow-lg"
                                                : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                                                }`}
                                        >
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="w-full h-auto object-cover"
                                            />
                                            <div className={`absolute inset-0 transition-all duration-200 flex items-center justify-center ${isSelected
                                                ? "bg-indigo-500 bg-opacity-30"
                                                : "bg-black bg-opacity-0 group-hover:bg-opacity-40"
                                                }`}>
                                                <span className={`text-white font-semibold transition-opacity duration-200 ${isSelected
                                                    ? "opacity-100"
                                                    : "opacity-0 group-hover:opacity-100"
                                                    }`}>
                                                    {isSelected ? "✓ Selected" : "Select"}
                                                </span>
                                            </div>
                                            <div className="p-2 bg-gray-50 dark:bg-gray-900">
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center truncate">
                                                    {item.name}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footers Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                                <Layers className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                                Footers
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {PRESET_IMAGES.filter(item => item.type === "footer").map((item) => {
                                    const isSelected = selectedImageUrl === item.url;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleImageSelect(item.url)}
                                            className={`h-fit cursor-pointer group relative overflow-hidden rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${isSelected
                                                ? "border-indigo-500 dark:border-indigo-400 shadow-lg"
                                                : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                                                }`}
                                        >
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="w-full h-auto object-cover"
                                            />
                                            <div className={`absolute inset-0 transition-all duration-200 flex items-center justify-center ${isSelected
                                                ? "bg-indigo-500 bg-opacity-30"
                                                : "bg-black bg-opacity-0 group-hover:bg-opacity-40"
                                                }`}>
                                                <span className={`text-white font-semibold transition-opacity duration-200 ${isSelected
                                                    ? "opacity-100"
                                                    : "opacity-0 group-hover:opacity-100"
                                                    }`}>
                                                    {isSelected ? "✓ Selected" : "Select"}
                                                </span>
                                            </div>
                                            <div className="p-2 bg-gray-50 dark:bg-gray-900">
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center truncate">
                                                    {item.name}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
                        {selectedImage ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Selected:</span>
                                    <span className="ml-2 text-indigo-600 dark:text-indigo-400">{selectedImage.name}</span>
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleAddAsLogo}
                                        className="flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200"
                                    >
                                        <ImageIcon className="w-5 h-5 mr-2" />
                                        Add as {isIndividual ? "Individual" : "Global"} Logo
                                    </button>
                                    <button
                                        onClick={handleAddAsFooter}
                                        className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                                    >
                                        <Layers className="w-5 h-5 mr-2" />
                                        Add as {isIndividual ? "Individual" : "Global"} Footer
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400">
                                Select an image above to add it as a logo or footer
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (PRESET_IMAGES.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Or Choose from Presets
            </h3>

            <button
                onClick={() => setShowModal(true)}
                className="w-full flex items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200"
            >
                <Layers className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium text-gray-700 dark:text-gray-200">
                    Browse Preset Images
                </span>
            </button>

            <Modal />
        </div>
    );
};

export default PresSelect;