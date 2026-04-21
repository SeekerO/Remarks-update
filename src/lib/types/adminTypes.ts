// --- Type Definitions ---\r\n
export const AVAILABLE_PAGES = [
  { id: "dashboard", name: "Dashboard", category: "Dashboard" },
  { id: "watermark", name: "Watermark", category: "Edit" },
  { id: "bgremover", name: "BG Remover", category: "Edit" },
  { id: "logoeditor", name: "Logo Editor", category: "Edit" },
  { id: "resadjuster", name: "Resolution Adjuster", category: "Edit" },
  { id: "faq", name: "FAQ", category: "Document" },
  { id: "remarks", name: "Remarks", category: "Document" },
  { id: "pdf", name: "PDF", category: "Document" },
  { id: "matcher", name: "Matcher", category: "Main" },
  { id: "comelecoffices", name: "COMELEC Offices", category: "Directory" },
  { id: "message", name: "Messsage", category: "Main" },
  { id: "csc", name: "CSC Reveiwer", category: "Other Tool" },
  { id: "dtrexporter", name: "DTR Exporter", category: "Other Tool" },

] as const;

export const TOOL_META: Record<string, { description: string; accent: string }> = {
  "Watermark": { description: "Batch watermark images with logos and footers", accent: "bg-indigo-500/10" },
  "BG Remover": { description: "Remove image backgrounds in-browser", accent: "bg-violet-500/10" },
  "Logo Editor": { description: "Build logos with shapes, text and images", accent: "bg-purple-500/10" },
  "Resolution Adjuster": { description: "Downsample images for web or print", accent: "bg-blue-500/10" },
  "FAQ": { description: "Manage voter registration FAQs", accent: "bg-emerald-500/10" },
  "Remarks": { description: "Prepare and export document remarks", accent: "bg-teal-500/10" },
  "PDF": { description: "Convert and process PDF documents", accent: "bg-cyan-500/10" },
  "Matcher": { description: "Fuzzy-match voter names across Excel files", accent: "bg-amber-500/10" },
  "CSC Reveiwer": { description: "Civil service exam reviewer", accent: "bg-rose-500/10" },
  "Directory": { description: "Staff directory and 3D map", accent: "bg-pink-500/10" },
  "Admin Panel": { description: "Manage users, roles and permissions", accent: "bg-red-500/10" },
  "DTR Extractor": { description: "AI-powered time record extraction from photos", accent: "bg-red-500/10" },
  "Time Log": { description: "Log daily time in/out and sync to Sheets", accent: "bg-red-500/10" },
  "User Log": { description: "A user Log ", accent: "bg-blue-500/10" },
  "COMELEC Offices": { description: "COMELEC field offices directory across the Philippines", accent: "bg-emerald-500/10" },
  "Test Page": { description: "Testing page for new features.", accent: "bg-orange-500/10" },
};


// Export the types as well for external consumption
export type PageId = (typeof AVAILABLE_PAGES)[number]["id"];

// Note: Do NOT include 'use client'; in this file.

export interface UserProfile {
  uid: string;
  email: string;
  isAdmin: boolean;
  isPermitted: boolean;
  photoURL: string;
  displayName: string;
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
import { IoLogoBuffer, IoIosColorWand, IoIosPin } from "react-icons/io";
import { FaRegFileImage, FaFileAlt } from "react-icons/fa";
import { FaRegNoteSticky, FaFilePen } from "react-icons/fa6";
import { GiCardExchange } from "react-icons/gi";
import { IoWater } from "react-icons/io5";
import { RiAdminFill } from "react-icons/ri";
import { MdOutlineAdminPanelSettings, MdOpacity } from "react-icons/md";
import { LayoutDashboard, FileCog, FolderClock, TestTube, Logs, MessageCircle, Folder } from "lucide-react"

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
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    active: true,
    pagePermissionId: "dashboard",
    sublinks: [],
  },
  {
    name: "Edit",
    href: "",
    icon: FaRegFileImage,
    active: false,
    sublinks: [
      {
        name: "Watermark",
        href: "/Edit/watermark",
        icon: IoWater,
        active: true,
        pagePermissionId: "watermark",
        sublinks: [],
      },
      {
        name: "BG Remover",
        href: "/Edit/bgremover",
        icon: IoIosColorWand,
        active: true,
        pagePermissionId: "bgremover",
        sublinks: [],
      },
      {
        name: "Logo Editor",
        href: "/Edit/logoeditor",
        icon: IoLogoBuffer,
        active: true,
        pagePermissionId: "logoeditor",
        sublinks: [],
      },
      {
        name: "Resolution Adjuster",
        href: "/Edit/resadjuster",
        icon: MdOpacity,
        active: true,
        pagePermissionId: "resadjuster",
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
        href: "/document/faq",
        icon: FaFileAlt,
        active: true,
        pagePermissionId: "faq",
        sublinks: [],
      },
      {
        name: "Remarks",
        href: "/document/remarks",
        icon: FaFilePen,
        active: true,
        pagePermissionId: "remarks",
        sublinks: [],
      },
      {
        name: "PDF",
        href: "/document/pdf",
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
    name: "Directory",
    href: "/Directory",
    icon: Folder,
    active: false,
    pagePermissionId: "directory",
    sublinks: [
      {
        name: "COMELEC Offices",
        href: "/directory/comelecoffices",
        icon: IoIosPin,
        active: true,
        pagePermissionId: "comelecoffices",
        sublinks: [],
      }
    ],
  },
  {
    name: "Message",
    href: "/message",
    icon: MessageCircle,
    active: true,
    pagePermissionId: "message",
    sublinks: [],
  },
  {
    name: "Other Tools",
    href: "",
    icon: FaRegFileImage,
    active: false,
    sublinks: [
      {
        name: "CSC Reveiwer",
        href: "/csc",
        icon: Settings,
        active: true,
        pagePermissionId: "csc",
        sublinks: [],
      },
      {
        name: "DTR Extractor",
        href: "/dtrextractor",
        icon: FileCog,
        active: true,
        requiredRole: "admin",
        sublinks: [],
      },
    ],
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
        name: "Time Log",
        href: "/admin/timelog",
        icon: FolderClock,
        active: true,
        requiredRole: "admin",
        sublinks: [],
      },
      {
        name: "User Log",
        href: "/admin/log",
        icon: Logs,
        active: true,
        requiredRole: "admin",
        sublinks: [],
      },
      {
        name: "Test Page",
        href: "/admin/test",
        icon: TestTube,
        active: true,
        requiredRole: "admin",
        sublinks: [],
      },
    ],
  },
];
