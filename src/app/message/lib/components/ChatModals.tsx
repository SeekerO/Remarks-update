// ChatModals.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { X, Save, Users, Edit3, Check } from 'lucide-react';

interface UserProfile {
    uid: string;
    name: string;
    email: string;
    photoURL: string | null;
    canChat?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
//  NICKNAME MODAL (for 1-on-1 chats)
// ═══════════════════════════════════════════════════════════════════
export const NicknameModal = ({
    isOpen,
    onClose,
    targetUserName,
    currentNickname,
    onSave,
    loading,
    error,
}: {
    isOpen: boolean;
    onClose: () => void;
    targetUserName: string;
    currentNickname: string | null;
    onSave: (nickname: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}) => {
    const [nickname, setNickname] = useState(currentNickname || targetUserName);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        setNickname(currentNickname || targetUserName);
        setLocalError(null);
    }, [isOpen, currentNickname, targetUserName]);

    const handleSave = async () => {
        if (!nickname.trim()) {
            setLocalError('Nickname cannot be empty');
            return;
        }
        try {
            setLocalError(null);
            await onSave(nickname.trim());
            onClose();
        } catch (err) {
            setLocalError((err as any).message || 'Failed to save nickname');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#13132b] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Edit3 className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-white/85">Set Nickname</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white/60 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-xs text-white/50 mb-4">
                    Give <span className="font-medium text-white/70">{targetUserName}</span> a custom nickname (only visible to you)
                </p>

                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                        setNickname(e.target.value);
                        setLocalError(null);
                    }}
                    placeholder="Enter nickname..."
                    maxLength={30}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white/85 placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-colors mb-4"
                    disabled={loading}
                    autoFocus
                />

                {(localError || error) && (
                    <p className="text-xs text-red-400 mb-4">{localError || error}</p>
                )}

                <div className="flex gap-2.5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/50 text-xs hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !nickname.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5" />
                                Save
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════
//  GROUP NAME MODAL
// ═══════════════════════════════════════════════════════════════════
export const GroupNameModal = ({
    isOpen,
    onClose,
    currentGroupName,
    onSave,
    loading,
    error,
}: {
    isOpen: boolean;
    onClose: () => void;
    currentGroupName: string | null;
    onSave: (name: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}) => {
    const [groupName, setGroupName] = useState(currentGroupName || '');
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        setGroupName(currentGroupName || '');
        setLocalError(null);
    }, [isOpen, currentGroupName]);

    const handleSave = async () => {
        if (!groupName.trim()) {
            setLocalError('Group name cannot be empty');
            return;
        }
        try {
            setLocalError(null);
            await onSave(groupName.trim());
            onClose();
        } catch (err) {
            setLocalError((err as any).message || 'Failed to update group name');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#13132b] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Edit3 className="w-4 h-4 text-blue-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-white/85">Edit Group Name</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white/60 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-xs text-white/50 mb-4">
                    Update the group chat name
                </p>

                <input
                    type="text"
                    value={groupName}
                    onChange={(e) => {
                        setGroupName(e.target.value);
                        setLocalError(null);
                    }}
                    placeholder="Enter group name..."
                    maxLength={50}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white/85 placeholder-white/25 focus:outline-none focus:border-blue-500/50 transition-colors mb-4"
                    disabled={loading}
                    autoFocus
                />

                {(localError || error) && (
                    <p className="text-xs text-red-400 mb-4">{localError || error}</p>
                )}

                <div className="flex gap-2.5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/50 text-xs hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !groupName.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5" />
                                Save
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════
//  ADD MEMBERS MODAL
// ═══════════════════════════════════════════════════════════════════
export const AddMembersModal = ({
    isOpen,
    onClose,
    availableUsers,
    currentMembers,
    onAdd,
    loading,
    error,
}: {
    isOpen: boolean;
    onClose: () => void;
    availableUsers: UserProfile[];
    currentMembers: Record<string, boolean>;
    onAdd: (userIds: string[]) => Promise<void>;
    loading: boolean;
    error: string | null;
}) => {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        setSelectedUsers([]);
        setSearchTerm('');
        setLocalError(null);
    }, [isOpen]);

    const filteredUsers = availableUsers.filter(
        (user) =>
            !currentMembers[user.uid] && // Exclude current members
            (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleUser = (uid: string) => {
        setSelectedUsers((prev) =>
            prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
        );

    };

    const handleAdd = async () => {
        if (selectedUsers.length === 0) {
            setLocalError('Please select at least one user');
            return;
        }
        try {
            setLocalError(null);
            await onAdd(selectedUsers);
            onClose();
        } catch (err) {
            setLocalError((err as any).message || 'Failed to add members');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#13132b] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-white/85">Add Members</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white/60 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white/85 placeholder-white/25 focus:outline-none focus:border-green-500/50 transition-colors mb-4"
                    disabled={loading}
                />

                <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2">
                    {filteredUsers.length === 0 ? (
                        <p className="text-xs text-white/40 text-center py-6">
                            No users available to add
                        </p>
                    ) : (
                        filteredUsers.map((user) => (
                            <label
                                key={user.uid}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.05] cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.uid)}
                                    onChange={() => toggleUser(user.uid)}
                                    disabled={loading}
                                    className="w-4 h-4 rounded border-white/[0.08] accent-green-500"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-white/85 truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-white/40 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </label>
                        ))
                    )}
                </div>

                {(localError || error) && (
                    <p className="text-xs text-red-400 mb-4">{localError || error}</p>
                )}

                {selectedUsers.length > 0 && (
                    <p className="text-xs text-green-400 mb-4">
                        {selectedUsers.length} user(s) selected
                    </p>
                )}

                <div className="flex gap-2.5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/50 text-xs hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={loading || selectedUsers.length === 0}
                        className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <Check className="w-3.5 h-3.5" />
                                Add
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};