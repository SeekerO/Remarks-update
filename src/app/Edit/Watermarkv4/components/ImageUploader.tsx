// app/components/ImageUploader.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */


import React, { useRef, useState } from "react";
import { useImageEditor } from "./ImageEditorContext";

import { FaImage } from "react-icons/fa6";

// import Logo from "@/lib/image/COMELEC.png"
// import Footer from "@/lib/image/FOOTER.png"
// // import ConfirmationModal from "./ConfirmationModal";

export default function ImageUploader() {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const footerInputRef = useRef<HTMLInputElement>(null);

    // NEW: Refs for individual logo/footer input elements
    const individualLogoInputRef = useRef<HTMLInputElement>(null);
    const individualFooterInputRef = useRef<HTMLInputElement>(null);

    const [isImageDragOver, setIsImageDragOver] = useState(false);
    const [isLogoDragOver, setIsLogoDragOver] = useState(false);
    const [isFooterDragOver, setIsFooterDragOver] = useState(false);

    const [isIndividualLogoDragOver, setIsIndividualLogoDragOver] = useState(false);
    const [isIndividualFooterDragOver, setIsIndividualFooterDragOver] = useState(false);

    // const [openConfirmationModal, setOpenConfirmationModal] = useState<boolean>(false)

    const {
        setImages,
        setLogo,
        setFooter,
        images,
        setSelectedImageIndex,
        selectedImageIndex,
        setIndividualLogo,
        setIndividualFooter,
    } = useImageEditor();

    // ADDED: Logic to determine if individual settings are active for the selected image
    const isIndividual = selectedImageIndex !== null && !images[selectedImageIndex].useGlobalSettings;


    // useEffect(() => {
    //     if (images.length > 0)
    //         return setOpenConfirmationModal(true)
    // }, [images])

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filesArray = Array.from(event.target.files);
            const newImages = filesArray.map(file => ({
                file,
                url: URL.createObjectURL(file),
                useGlobalSettings: true,
            }));
            setImages(prevImages => [...prevImages, ...newImages]);
            setSelectedImageIndex(images.length === 0 ? 0 : null);
        }
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const url = URL.createObjectURL(file);
            setLogo(url);
        }
    };

    const handleFooterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const url = URL.createObjectURL(file);
            setFooter(url);
        }
    };

    const handleIndividualLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0] && selectedImageIndex !== null) {
            const file = event.target.files[0];
            const url = URL.createObjectURL(file);
            setIndividualLogo(selectedImageIndex, url);
        }
    };

    const handleIndividualFooterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0] && selectedImageIndex !== null) {
            const file = event.target.files[0];
            const url = URL.createObjectURL(file);
            setIndividualFooter(selectedImageIndex, url);
        }
    };


    const handleDragOver = (event: React.DragEvent, type: 'image' | 'logo' | 'footer' | 'individualLogo' | 'individualFooter') => {
        event.preventDefault();
        if (type === 'image') setIsImageDragOver(true);
        else if (type === 'logo') setIsLogoDragOver(true);
        else if (type === 'footer') setIsFooterDragOver(true);
        else if (type === 'individualLogo') setIsIndividualLogoDragOver(true);
        else if (type === 'individualFooter') setIsIndividualFooterDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent, type: 'image' | 'logo' | 'footer' | 'individualLogo' | 'individualFooter') => {
        event.preventDefault();
        if (type === 'image') setIsImageDragOver(false);
        else if (type === 'logo') setIsLogoDragOver(false);
        else if (type === 'footer') setIsFooterDragOver(false);
        else if (type === 'individualLogo') setIsIndividualLogoDragOver(false);
        else if (type === 'individualFooter') setIsIndividualFooterDragOver(false);
    };

    const handleDrop = (event: React.DragEvent, type: 'image' | 'logo' | 'footer' | 'individualLogo' | 'individualFooter') => {
        event.preventDefault();
        if (type === 'image') setIsImageDragOver(false);
        else if (type === 'logo') setIsLogoDragOver(false);
        else if (type === 'footer') setIsFooterDragOver(false);
        else if (type === 'individualLogo') setIsIndividualLogoDragOver(false);
        else if (type === 'individualFooter') setIsIndividualFooterDragOver(false);

        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const files = Array.from(event.dataTransfer.files);

            if (type === 'image') {
                const newImages = files.map(file => ({
                    file,
                    url: URL.createObjectURL(file),
                    useGlobalSettings: true,
                }));
                setImages(prevImages => [...prevImages, ...newImages]);
                setSelectedImageIndex(images.length === 0 ? 0 : null);
            } else if (type === 'logo') {
                const file = files[0];
                const url = URL.createObjectURL(file);
                setLogo(url);
            } else if (type === 'footer') {
                const file = files[0];
                const url = URL.createObjectURL(file);
                setFooter(url);
            } else if (type === 'individualLogo') {
                const file = files[0];
                const url = URL.createObjectURL(file);
                if (selectedImageIndex !== null) {
                    setIndividualLogo(selectedImageIndex, url);
                }
            } else if (type === 'individualFooter') {
                const file = files[0];
                const url = URL.createObjectURL(file);
                if (selectedImageIndex !== null) {
                    setIndividualFooter(selectedImageIndex, url);
                }
            }
        }
    };

    const triggerImageInput = () => imageInputRef.current?.click();
    const triggerLogoInput = () => logoInputRef.current?.click();
    const triggerFooterInput = () => footerInputRef.current?.click();

    const triggerIndividualLogoInput = () => individualLogoInputRef.current?.click();
    const triggerIndividualFooterInput = () => individualFooterInputRef.current?.click();

    // const handleDefault = (event: React.MouseEvent<HTMLButtonElement>) => {
    //     event.preventDefault();
    //     setLogo(Logo.src);
    //     setFooter(Footer.src);
    // }

    // const closeConfirmationModal = () => {
    //     return setOpenConfirmationModal(!openConfirmationModal)
    // }

    // const UsePreview = () => {

    //     // const previewSettings = window.localStorage.getItem("PreviewSettings")
    //     return alert(true)
    // }

    return (
        <div className="space-y-6">
            {/* <ConfirmationModal open={openConfirmationModal} setOpen={closeConfirmationModal} UsePreivew={UsePreview} /> */}

            <div>
                <input
                    type="file"
                    multiple
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                />
                <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                        ${isImageDragOver
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                        }`}
                    onDragOver={(e) => handleDragOver(e, 'image')}
                    onDragLeave={(e) => handleDragLeave(e, 'image')}
                    onDrop={(e) => handleDrop(e, 'image')}
                    onClick={triggerImageInput}
                >
                    <FaImage className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Upload Your Images</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">(Drag & drop or click to browse)</p>
                    <span
                        className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                    >
                        Select Images
                    </span>
                </label>
            </div>

            {!isIndividual && (
                <>
                    <div>
                        <input
                            type="file"
                            ref={logoInputRef}
                            onChange={handleLogoChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <label
                            htmlFor="logo-upload"
                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                                ${isLogoDragOver
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                                }`}
                            onDragOver={(e) => handleDragOver(e, 'logo')}
                            onDragLeave={(e) => handleDragLeave(e, 'logo')}
                            onDrop={(e) => handleDrop(e, 'logo')}
                            onClick={triggerLogoInput}
                        >
                            <FaImage className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Upload Your Global Logo</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">(Optional) Drag & drop or click to browse</p>
                            <span
                                className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                Select Logo
                            </span>
                        </label>
                    </div>

                    <div>
                        <input
                            type="file"
                            ref={footerInputRef}
                            onChange={handleFooterChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <label
                            htmlFor="footer-upload"
                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                                ${isFooterDragOver
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                                }`}
                            onDragOver={(e) => handleDragOver(e, 'footer')}
                            onDragLeave={(e) => handleDragLeave(e, 'footer')}
                            onDrop={(e) => handleDrop(e, 'footer')}
                            onClick={triggerFooterInput}
                        >
                            <FaImage className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Upload Your Global Footer Image</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">(Optional) Drag & drop or click to browse</p>
                            <span
                                className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                            >
                                Select Footer
                            </span>
                        </label>
                    </div>
                </>
            )}


            {isIndividual && (
                <>
                    <div>
                        <input
                            type="file"
                            ref={individualLogoInputRef}
                            onChange={handleIndividualLogoChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <label
                            htmlFor="individual-logo-upload"
                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                                ${isIndividualLogoDragOver
                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                    : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                                }`}
                            onDragOver={(e) => handleDragOver(e, 'individualLogo')}
                            onDragLeave={(e) => handleDragLeave(e, 'individualLogo')}
                            onDrop={(e) => handleDrop(e, 'individualLogo')}
                            onClick={triggerIndividualLogoInput}
                        >
                            <FaImage className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Upload Individual Logo for Selected Image</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">(Optional) Drag & drop or click to browse</p>
                            <span
                                className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                            >
                                Select Individual Logo
                            </span>
                        </label>
                    </div>

                    <div>
                        <input
                            type="file"
                            ref={individualFooterInputRef}
                            onChange={handleIndividualFooterChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <label
                            htmlFor="individual-footer-upload"
                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                                ${isIndividualFooterDragOver
                                    ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
                                    : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                                }`}
                            onDragOver={(e) => handleDragOver(e, 'individualFooter')}
                            onDragLeave={(e) => handleDragLeave(e, 'individualFooter')}
                            onDrop={(e) => handleDrop(e, 'individualFooter')}
                            onClick={triggerIndividualFooterInput}
                        >
                            <FaImage className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Upload Individual Footer for Selected Image</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">(Optional) Drag & drop or click to browse</p>
                            <span
                                className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors duration-200"
                            >
                                Select Individual Footer
                            </span>
                        </label>
                    </div>
                </>
            )}



        </div>
    );
}