import React, { useState } from "react";
import { useImageEditor } from "./ImageEditorContext";
import { X, ImageIcon } from "lucide-react";

//FOOOTER
import BlackShadow from "../../images/00-BLACK-SHADOW.png";
import WhiteShadow from "../../images/01-WHITE-SHADOW.png";
import WhiteLOGO from "../../images/02-WHITE-LOGO.png"
import BlackLOGO from "../../images/03-BLACK-LOGO.png"
import BlackLOGOeidCOMELEC from "../../images/04-BLACK-LOGO-EID.png"
import WHITELOGOeidCOMELEC from "../../images/05-WHITE-LOGO-EID.png"

//LOGO
import WhiteLogoEID from "../../images/WHITE-EID.png";
import BlackLogoEID from "../../images/BLACK-EID.png"
import BlackLogoEIDandCOMELEC from "../../images/BLACK-EID-W-COMELEC.png"
import WHITELogoEIDandCOMELEC from "../../images/WHITE-EID-W-COMELEC.png"
import COMELEClogo from "../../images/COMELEC.png";
import KKKlogo from "../../images/KKK.png";


const PRESET_LOGOS = [
    { id: 1, url: WhiteLogoEID.src, name: "WHITE EID LOGO" },
    { id: 2, url: BlackLogoEID.src, name: "BLACK EID LOGO" },
    { id: 3, url: WHITELogoEIDandCOMELEC.src, name: "BLACK EID & COMELEC LOGO" },
    { id: 4, url: BlackLogoEIDandCOMELEC.src, name: "BLACK EID & COMELEC LOGO" },
    { id: 5, url: COMELEClogo.src, name: "COMELEC LOGO" },
    { id: 6, url: KKKlogo.src, name: "KKK LOGO" }
];

const PRESET_FOOTERS = [
    { id: 1, url: BlackShadow.src, name: "Black Shadow" },
    { id: 2, url: WhiteShadow.src, name: "White Shadow" },
    { id: 3, url: WhiteLOGO.src, name: "WHITE EID FOOTER" },
    { id: 4, url: BlackLOGO.src, name: "BLACK EID FOOTER" },
    { id: 5, url: BlackLOGOeidCOMELEC.src, name: "BLACK EID & COMELEC FOOTER" },
    { id: 6, url: WHITELOGOeidCOMELEC.src, name: "BLACK EID & COMELEC FOOTER" },
];

const PresSelect = () => {
    const [showLogoModal, setShowLogoModal] = useState(false);
    const [showFooterModal, setShowFooterModal] = useState(false);

    const {
        selectedImageIndex,
        images,
        addGlobalLogo,
        addIndividualLogo,
        addGlobalFooter,
        addIndividualFooter,
    } = useImageEditor();

    const isIndividual = selectedImageIndex !== null && !images[selectedImageIndex]?.useGlobalSettings;

    const handleLogoSelect = (logoUrl: string) => {
        if (isIndividual && selectedImageIndex !== null) {
            addIndividualLogo(selectedImageIndex, logoUrl);
        } else {
            addGlobalLogo(logoUrl);
        }
        setShowLogoModal(false);
    };

    const handleFooterSelect = (footerUrl: string) => {
        if (isIndividual && selectedImageIndex !== null) {
            addIndividualFooter(selectedImageIndex, footerUrl);
        } else {
            addGlobalFooter(footerUrl);
        }
        setShowFooterModal(false);
    };

    const Modal = ({
        show,
        onClose,
        title,
        items,
        onSelect
    }: {
        show: boolean;
        onClose: () => void;
        title: string;
        items: typeof PRESET_LOGOS;
        onSelect: (url: string) => void;
    }) => {
        if (!show) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                        {items.length === 0 ? (
                            <div className="text-center py-12">
                                <ImageIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No preset images available</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                    Add images to the PRESET array in PresSelect.tsx
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => onSelect(item.url)}
                                        className="h-fit cursor-pointer group relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-200 hover:shadow-lg"
                                    >
                                        <img
                                            src={item.url}
                                            alt={item.name}
                                            className="w-full h-auto object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                                            <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                Select
                                            </span>
                                        </div>
                                        <div className="p-2 bg-gray-50 dark:bg-gray-900">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                                                {item.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Don't show the buttons if there are no presets available
    const hasPresets = PRESET_LOGOS.length > 0 || PRESET_FOOTERS.length > 0;

    if (!hasPresets) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Or Choose from Presets
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Logo Presets Button */}
                {PRESET_LOGOS.length > 0 && (
                    <button
                        onClick={() => setShowLogoModal(true)}
                        className="flex items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 group"
                    >
                        <ImageIcon className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                            {isIndividual ? "Choose Individual Logo Preset" : "Choose Global Logo Preset"}
                        </span>
                    </button>
                )}

                {/* Footer Presets Button */}
                {PRESET_FOOTERS.length > 0 && (
                    <button
                        onClick={() => setShowFooterModal(true)}
                        className="flex items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 group"
                    >
                        <ImageIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                            {isIndividual ? "Choose Individual Footer Preset" : "Choose Global Footer Preset"}
                        </span>
                    </button>
                )}
            </div>

            {/* Modals */}
            <Modal
                show={showLogoModal}
                onClose={() => setShowLogoModal(false)}
                title={isIndividual ? "Select Individual Logo" : "Select Global Logo"}
                items={PRESET_LOGOS}
                onSelect={handleLogoSelect}
            />

            <Modal
                show={showFooterModal}
                onClose={() => setShowFooterModal(false)}
                title={isIndividual ? "Select Individual Footer" : "Select Global Footer"}
                items={PRESET_FOOTERS}
                onSelect={handleFooterSelect}
            />
        </div>
    );
};

export default PresSelect;