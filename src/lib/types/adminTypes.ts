// --- Type Definitions ---\r\n
export const AVAILABLE_PAGES = [
  { id: "watermark", name: "Watermark V4", category: "Edit" },
  { id: "bgremover", name: "BG Remover", category: "Edit" },
  { id: "logomaker", name: "Logo Maker", category: "Edit" },
  { id: "faq", name: "FAQ", category: "Notes" },
  { id: "remarks", name: "Remarks", category: "Notes" },
  { id: "pdf", name: "PDF", category: "Notes" },
  { id: "matcher", name: "Matcher", category: "Main" },
  { id: "evaluation", name: "Evaluation", category: "Main" },
] as const;

// Export the types as well for external consumption
export type PageId = (typeof AVAILABLE_PAGES)[number]["id"];

// Note: Do NOT include 'use client'; in this file.

export interface UserProfile {
  uid: string;
  name: string;
  profilePic: string | null;
  email: string;
  isAdmin: boolean;
  canChat: boolean;
  // allowedPages can be an empty array or undefined (if never configured)
  allowedPages: PageId[] | undefined;
}

export interface UserCardProps {
  user: UserProfile;
  isOnline: boolean;
  lastOnlineTimestamp: number | null;
  currentUserId: string;
  handleToggleCanChat: (
    userId: string,
    currentCanChatStatus: boolean
  ) => Promise<void>;
  handleToggleAdmin: (
    userId: string,
    currentAdminStatus: boolean
  ) => Promise<void>;
  handleOpenPermissions: (user: UserProfile) => void;
  formatLastOnline: (timestamp: number) => string;
}

export interface PermissionsModalProps {
  user: UserProfile;
  onClose: () => void;
  onSave: (userId: string, allowedPages: PageId[]) => Promise<void>;
}
