// --- Type Definitions ---\r\n
export const AVAILABLE_PAGES = [
  { id: "watermarkv4", name: "Watermark V4", category: "Edit" },
  { id: "watermarkv5", name: "Watermark V5", category: "Edit" },
  { id: "bgremover", name: "BG Remover", category: "Edit" },
  { id: "logomaker", name: "Logo Maker", category: "Edit" },
  { id: "faq", name: "FAQ", category: "Document" },
  { id: "remarks", name: "Remarks", category: "Document" },
  { id: "pdf", name: "PDF", category: "Document" },
  { id: "matcher", name: "Matcher", category: "Main" },
  { id: "evaluation", name: "Evaluation", category: "Main" },
  { id: "csc", name: "CSC Reveiwer", category: "Main" },
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


import { Search, Settings } from "lucide-react";
import { IoLogoBuffer, IoIosColorWand } from "react-icons/io";
import { FaRegFileImage, FaFileAlt, FaYoutube } from "react-icons/fa";
import { FaRegNoteSticky, FaFilePen, FaWandMagicSparkles } from "react-icons/fa6";
import { GiCardExchange } from "react-icons/gi";
import { IoWater } from "react-icons/io5";
import { RiAdminFill } from "react-icons/ri";
import { SiYoutubestudio } from "react-icons/si";
import { MdOutlineAdminPanelSettings, MdOpacity } from "react-icons/md";

export type UserRole = "admin" | "standard";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
  requiredRole?: UserRole;
  pagePermissionId?: string; // Links to permission system
  sublinks: NavItem[];
}

export const navItems: NavItem[] = [
  {
    name: "Edit",
    href: "",
    icon: FaRegFileImage,
    active: false,
    sublinks: [
      {
        name: "Watermark V4",
        href: "/Edit/Watermarkv4",
        icon: IoWater,
        active: true,
        pagePermissionId: "watermarkv4",
        requiredRole: "admin",
        sublinks: [],
      },
      {
        name: "Watermark V5",
        href: "/Edit/Watermarkv5",
        icon: IoWater,
        active: true,
        pagePermissionId: "watermarkv5",
        sublinks: [],
      },
      {
        name: "BG Remover",
        href: "/Edit/Backgroundremover",
        icon: IoIosColorWand,
        active: true,
        pagePermissionId: "bgremover",
        sublinks: [],
      },
      {
        name: "Logo Maker",
        href: "/Edit/LogoMaker",
        icon: IoLogoBuffer,
        active: true,
        pagePermissionId: "logomaker",
        sublinks: [],
      },
      {
        name: "Resolution Adjuster",
        href: "/Edit/ResolutionAdjuster",
        icon: MdOpacity,
        active: true,
        pagePermissionId: "logomaker",
        sublinks: [],
      },
    ],
  },
  {
    name: "Document",
    href: "",
    icon: FaRegNoteSticky,
    active: false,
    sublinks: [
      {
        name: "FAQ",
        href: "/Documents/Faq",
        icon: FaFileAlt,
        active: true,
        pagePermissionId: "faq",
        sublinks: [],
      },
      {
        name: "Remarks",
        href: "/Documents/Remarks",
        icon: FaFilePen,
        active: true,
        pagePermissionId: "remarks",
        sublinks: [],
      },
      {
        name: "PDF",
        href: "/Documents/Pdf",
        icon: GiCardExchange,
        active: true,
        pagePermissionId: "pdf",
        sublinks: [],
      },
    ],
  },
  {
    name: "Matcher",
    href: "/Matcher",
    icon: Search,
    active: true,
    pagePermissionId: "matcher",
    sublinks: [],
  },
  {
    name: "Evaluation",
    href: "/Evaluation",
    icon: Settings,
    active: true,
    pagePermissionId: "evaluation",
    sublinks: [],
  },
  {
    name: "CSC Reveiwer",
    href: "/csc",
    icon: Settings,
    active: true,
    pagePermissionId: "csc",
    sublinks: [],
  },
  {
    name: "Admin",
    href: "",
    icon: MdOutlineAdminPanelSettings,
    active: false,
    requiredRole: "admin",
    sublinks: [
      {
        name: "Admin Panel",
        href: "/admin/panel",
        icon: RiAdminFill,
        active: true,
        requiredRole: "admin",
        sublinks: [],
      },
      {
        name: "Youtube Validator",
        href: "/admin/YoutubeLinkValidator",
        icon: SiYoutubestudio,
        active: true,
        requiredRole: "admin",
        sublinks: [],
      },
      {
        name: "Youtube Config",
        href: "/admin/Youtube",
        icon: FaYoutube,
        active: true,
        requiredRole: "admin",
        sublinks: [],
      },
    ],
  },
];
