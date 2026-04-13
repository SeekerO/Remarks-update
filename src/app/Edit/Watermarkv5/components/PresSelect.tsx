import React, { useState, useMemo, useCallback } from "react";
import { useImageEditor } from "./ImageEditorContext";
import { X, ImageIcon, Layers, CheckCircle2 } from "lucide-react";

import BlackShadow from "../images/00-BLACK-SHADOW-FOOTER.png";
import WhiteShadow from "../images/01-WHITE-SHADOW-FOOTER.png";
import WhiteLogoEID from "../images/WHITE-EID.png";
import BlackLogoEID from "../images/BLACK-EID.png";
import BlackLogoEIDandCOMELEC from "../images/BLACK-EID-W-COMELEC.png";
import WHITELogoEIDandCOMELEC from "../images/WHITE-EID-W-COMELEC.png";
import COMELEClogo from "../images/COMELEC.png";
import KKKlogo from "../images/KKK.png";

const PRESET_IMAGES = [
    { id: 1, url: WhiteLogoEID.src, name: "White EID Logo", type: "logo" },
    { id: 2, url: BlackLogoEID.src, name: "Black EID Logo", type: "logo" },
    { id: 3, url: WHITELogoEIDandCOMELEC.src, name: "White EID & COMELEC", type: "logo" },
    { id: 4, url: BlackLogoEIDandCOMELEC.src, name: "Black EID & COMELEC", type: "logo" },
    { id: 5, url: COMELEClogo.src, name: "COMELEC Logo", type: "logo" },
    { id: 6, url: KKKlogo.src, name: "KKK Logo", type: "logo" },
    { id: 7, url: BlackShadow.src, name: "Black Shadow Footer", type: "footer" },
    { id: 8, url: WhiteShadow.src, name: "White Shadow Footer", type: "footer" },
];

// Shared card used in both sections
function PresetCard({
    item,
    isSelected,
    onSelect,
}: {
    item: typeof PRESET_IMAGES[number];
    isSelected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className={`group relative w-full rounded-xl overflow-hidden border-2 transition-all duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                ${isSelected
                    ? "border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                }`}
        >
            {/* Image area — unified bg in both modes */}
            <div className="bg-gray-100 dark:bg-gray-700/60 p-3 flex items-center justify-center min-h-[80px]">
                <img
                    src={item.url}
                    alt={item.name}
                    className="max-h-16 w-full object-contain"
                />
            </div>

            {/* Name strip — unified surface */}
            <div className="px-2 py-1.5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate text-center">
                    {item.name}
                </p>
            </div>

            {/* Selected checkmark overlay */}
            {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shadow">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
            )}
        </button>
    );
}

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

    const isIndividual = selectedImageIndex !== null
        && !images[selectedImageIndex]?.useGlobalSettings;

    const selectedPreset = useMemo(
        () => PRESET_IMAGES.find(img => img.url === selectedImageUrl) ?? null,
        [selectedImageUrl]
    );

    const closeModal = useCallback(() => {
        setShowModal(false);
        setSelectedImageUrl(null);
    }, []);

    const handleAddAsLogo = useCallback(() => {
        if (!selectedPreset) return;
        if (isIndividual && selectedImageIndex !== null) {
            addIndividualLogo(selectedImageIndex, selectedPreset.url);
        } else {
            addGlobalLogo(selectedPreset.url);
        }
        closeModal();
    }, [selectedPreset, isIndividual, selectedImageIndex, addIndividualLogo, addGlobalLogo, closeModal]);

    const handleAddAsFooter = useCallback(() => {
        if (!selectedPreset) return;
        if (isIndividual && selectedImageIndex !== null) {
            addIndividualFooter(selectedImageIndex, selectedPreset.url);
        } else {
            addGlobalFooter(selectedPreset.url);
        }
        closeModal();
    }, [selectedPreset, isIndividual, selectedImageIndex, addIndividualFooter, addGlobalFooter, closeModal]);

    const logos = PRESET_IMAGES.filter(i => i.type === "logo");
    const footers = PRESET_IMAGES.filter(i => i.type === "footer");

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="w-full pb-10 flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-150 group"
            >
                <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Browse Preset Images
                </span>
            </button>

            {showModal && (
                // Backdrop
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    {/* Modal panel — single consistent surface */}
                    <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    Preset Images
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Select an image then choose how to add it
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7 bg-white dark:bg-gray-900">

                            {/* Logos */}
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <ImageIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        Logos
                                    </h3>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        ({logos.length})
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {logos.map(item => (
                                        <PresetCard
                                            key={item.id}
                                            item={item}
                                            isSelected={selectedImageUrl === item.url}
                                            onSelect={() => setSelectedImageUrl(
                                                selectedImageUrl === item.url ? null : item.url
                                            )}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Footers */}
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <Layers className="w-4 h-4 text-green-500 dark:text-green-400" />
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        Footers
                                    </h3>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        ({footers.length})
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {footers.map(item => (
                                        <PresetCard
                                            key={item.id}
                                            item={item}
                                            isSelected={selectedImageUrl === item.url}
                                            onSelect={() => setSelectedImageUrl(
                                                selectedImageUrl === item.url ? null : item.url
                                            )}
                                        />
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Footer action bar — unified surface, no bg jump */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                            {selectedPreset ? (
                                <div className="flex items-center gap-3">
                                    {/* Mini preview of selection */}
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-600">
                                        <img
                                            src={selectedPreset.url}
                                            alt={selectedPreset.name}
                                            className="w-full h-full object-contain p-1"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                                            {selectedPreset.name}
                                        </p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                            Add as {isIndividual ? "individual" : "global"} asset
                                        </p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={handleAddAsLogo}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            Logo
                                        </button>
                                        <button
                                            onClick={handleAddAsFooter}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors shadow-sm"
                                        >
                                            <Layers className="w-3.5 h-3.5" />
                                            Footer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-1">
                                    Select an image above to continue
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PresSelect;