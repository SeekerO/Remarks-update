

import React, { useState } from 'react';
import { PermissionsModalProps, AVAILABLE_PAGES, PageId } from '@/lib/types/adminTypes';
import { Lock, Unlock } from 'lucide-react';

const PermissionsModal: React.FC<PermissionsModalProps> = ({ user, onClose, onSave }) => {
    // If allowedPages is undefined (never configured), default to ALL pages
    const initialPages = Array.isArray(user.allowedPages)
        ? user.allowedPages
        : [];


    const [selectedPages, setSelectedPages] = useState<PageId[]>(initialPages);
    const [isSaving, setIsSaving] = useState(false);

    // Group pages by category for cleaner UI
    const groupedPages = AVAILABLE_PAGES.reduce((acc, page) => {
        if (!acc[page.category]) {
            acc[page.category] = [];
        }
        acc[page.category].push(page);
        return acc;
    }, {} as Record<string, typeof AVAILABLE_PAGES[number][]>);

    const togglePage = (pageId: PageId) => {
        setSelectedPages(prev =>
            prev.includes(pageId)
                ? prev.filter(id => id !== pageId)
                : [...prev, pageId]
        );
    };

    const selectAll = () => {
        setSelectedPages(AVAILABLE_PAGES.map(p => p.id));
    };

    const deselectAll = () => {
        setSelectedPages([]);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Note: Saving an empty array is fine and signals "no access"
            await onSave(user.uid, selectedPages);
            onClose();
        } catch (error) {
            console.error("Error saving permissions:", error);
            alert("Failed to save permissions. Check console for details.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 w-screen h-screen justify-center items-center flex backdrop-blur-sm bg-black/50 z-[999]">
            <div className="w-[600px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Lock className="w-6 h-6 mr-3 text-purple-500" />
                        Page Access Control
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Managing permissions for: <span className="font-semibold text-gray-700 dark:text-gray-300">{user.displayName}</span>
                    </p>
                    {!Array.isArray(user.allowedPages) && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                            {` ℹ️ Permissions have not been set for this user yet. All access is currently disabled.`}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Quick Actions */}
                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={selectAll}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                        >
                            Select All
                        </button>
                        <button
                            onClick={deselectAll}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                            Deselect All
                        </button>
                    </div>

                    {/* Pages by Category */}
                    <div className="space-y-6">
                        {Object.entries(groupedPages).map(([category, pages]) => (
                            <div key={category}>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                    {category}
                                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                        ({pages.filter(p => selectedPages.includes(p.id)).length}/{pages.length})
                                    </span>
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {pages.map((page) => (
                                        <label
                                            key={page.id}
                                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedPages.includes(page.id)
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPages.includes(page.id)}
                                                onChange={() => togglePage(page.id)}
                                                className="form-checkbox h-5 w-5 text-purple-600 rounded border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {page.name}
                                            </span>
                                            {selectedPages.includes(page.id) && (
                                                <Unlock className="ml-auto w-4 h-4 text-purple-500" />
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Admin Notice */}
                    {user.isAdmin && (
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Note:</strong> This user is an Admin and will have access to all pages regardless of these settings.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center"
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default PermissionsModal;