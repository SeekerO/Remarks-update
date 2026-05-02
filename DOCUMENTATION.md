# Avexi — Repository Documentation

> **Version:** v5.0.0 · **Framework:** Next.js 14 (App Router) · **Database:** Firebase Realtime Database + Firestore

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Authentication & Access Control](#4-authentication--access-control)
5. [Core Features](#5-core-features)
   - [Watermark Editor](#51-watermark-editor)
   - [Background Remover](#52-background-remover)
   - [Logo Maker](#53-logo-maker)
   - [Resolution Adjuster](#54-resolution-adjuster)
   - [File Converter (PDF)](#55-file-converter-pdf)
   - [Fuzzy Matcher](#56-fuzzy-matcher)
   - [FAQ Module](#57-faq-module)
   - [Remarks / Dynamic Columns](#58-remarks--dynamic-columns)
   - [DTR Extractor](#59-dtr-extractor)
   - [DTR Logger](#510-dtr-logger)
   - [CSC Reviewer](#511-csc-reviewer)
   - [COMELEC Directory](#512-comelec-directory)
   - [Messaging & Video Calls](#513-messaging--video-calls)
6. [Admin Panel](#6-admin-panel)
7. [Dashboard](#7-dashboard)
8. [UI Components & Design System](#8-ui-components--design-system)
9. [Firebase Integration](#9-firebase-integration)
10. [Landing Page](#10-landing-page)
11. [Routing & Middleware](#11-routing--middleware)
12. [Key Libraries & Dependencies](#12-key-libraries--dependencies)
13. [Environment Variables](#13-environment-variables)
14. [Deployment Notes](#14-deployment-notes)

---

## 1. Project Overview

**Avexi** is a private, browser-based professional workspace suite built for teams — specifically the Election Information Division (EID). It provides a collection of tools for image editing, document management, voter registration workflows, and team collaboration, all processed client-side where possible so sensitive files never leave the user's device.

### Key Principles

- **100% client-side processing** for image and document tools — no file uploads to external servers.
- **Role-based access control (RBAC)** — administrators assign which pages and features each user can access.
- **Subscription-aware** — access windows and allowed watermark presets are tied to user subscriptions.
- **Real-time collaboration** — messaging, typing indicators, online presence, and video calling are powered by Firebase Realtime Database and WebRTC.

---

## 2. Architecture

```
Browser Client (Next.js App Router)
│
├── Public landing page  →  /
├── Login (Google OAuth) →  /login
└── Protected workspace  →  /dashboard, /edit/*, /document/*, /admin/*, etc.
         │
         ├── Firebase Auth         — Google sign-in, JWT
         ├── Firebase RTDB         — real-time chat, presence, calls, user data
         ├── Firebase Firestore    — FAQs, activity logs
         ├── Firebase Storage      — file attachments (chat)
         └── Next.js API Routes    — DTR/Sheets sync, BG removal, reCAPTCHA
```

All image-processing tools (watermark, logo maker, background remover, resolution adjuster) run entirely in the browser using the Canvas 2D API and/or MediaPipe. PDF operations use `pdf-lib`, `jsPDF`, and SheetJS — also client-side. Only chat file uploads, the Google Sheets DTR sync, and background removal via the `remove.bg` API touch external servers.

---

## 3. Directory Structure

```
src/
├── app/
│   ├── page.tsx                      # Root page — landing or redirect
│   ├── layout.tsx                    # Root layout, metadata, providers
│   ├── globals.css                   # Nexus design-system tokens & base styles
│   ├── manifest.json                 # PWA manifest
│   ├── robots.ts                     # SEO robots rules
│   ├── sitemap.ts                    # SEO sitemap
│   │
│   ├── login/                        # Google OAuth login page
│   │   ├── page.tsx
│   │   ├── LoginClient.tsx
│   │   └── requestLoginModal.tsx     # Access request form (reCAPTCHA)
│   │
│   ├── dashboard/                    # Authenticated home
│   │   └── page.tsx
│   │
│   ├── edit/
│   │   ├── watermark/                # Watermark V5 editor
│   │   ├── bgremover/                # AI background removal
│   │   ├── logoeditor/               # Logo maker (canvas)
│   │   └── resadjuster/              # Resolution downsampler
│   │
│   ├── document/
│   │   ├── pdf/                      # Multi-format file converter
│   │   ├── faq/                      # FAQ with copy timers
│   │   └── remarks/                  # Dynamic columns / remarks board
│   │
│   ├── Matcher/                      # Fuzzy name-matching tool
│   ├── csc/                          # Civil Service Exam reviewer
│   ├── dtrextractor/                 # AI-powered DTR OCR
│   ├── admin/
│   │   ├── timelog/                  # DTR logger + Google Sheets
│   │   ├── panel/                    # User management admin panel
│   │   └── log/                      # Activity log viewer
│   │
│   ├── message/                      # Real-time chat + WebRTC video calls
│   │   └── lib/
│   │       ├── call/                 # WebRTC signaling
│   │       ├── hooks/                # useChatMessages, useWebRTC, etc.
│   │       ├── components/           # Chat modals, call UI
│   │       └── actions/              # editMessage, chatActions
│   │
│   ├── directory/
│   │   └── comelecoffices/           # Interactive PH map + COMELEC directory
│   │
│   └── component/
│       ├── sidebar.tsx               # App-wide sidebar navigation
│       ├── wrapper/
│       │   └── night_mode_wrapper.tsx
│       ├── callNotificationOverlay.tsx
│       ├── messageNotification.tsx
│       ├── maintenance.tsx
│       └── landing/                  # Landing page sections
│
└── lib/
    ├── auth/
    │   ├── AuthContext.tsx
    │   └── withAuth.tsx              # Route guard HOC
    ├── firebase/
    │   ├── firebase.ts               # Firebase app init
    │   └── firebase.actions/         # createChat, sendMessage, deleteChat, uploadFile
    │   └── firebase.actions.firestore/ # FAQ, logs, offline logger
    ├── util/
    │   ├── compare.ts                # Fuzzy-match engine
    │   └── crypto.ts                 # Message encrypt/decrypt
    ├── hooks/
    │   └── useUserPresence.ts
    ├── components/
    │   └── dark-button.tsx
    └── types/
        └── adminTypes.ts             # NavItem, UserRole, AVAILABLE_PAGES, TOOL_META
```

---

## 4. Authentication & Access Control

### Sign-In

Users authenticate exclusively via **Google OAuth** (`loginWithGoogle()` in `AuthContext`). On first login a Firebase RTDB user node is created.

### User Record (`/users/{uid}`)

| Field | Type | Description |
|---|---|---|
| `isPermitted` | boolean | Whether the user can access the workspace at all |
| `isAdmin` | boolean | Grants full access + admin panel |
| `allowedPages` | string[] | Page permission IDs the user can visit |
| `subscription` | object | `roles`, `subscriptionDays`, `subscriptionInfinite`, `subscriptionStartDate`, `allowedPresets` |
| `allowedPresets` | string[] | Watermark presets the user may use (sentinel `["__none__"]` = none) |
| `allowCalls` | boolean | Whether the user accepts incoming video calls |
| `blockedCallers` | map | Map of UIDs whose calls are blocked |

### Route Guard

`src/lib/auth/withAuth.tsx` (`UseGuard`) wraps the entire app. It reads the user object from `AuthContext` and:
1. Redirects unauthenticated users to `/login`.
2. Blocks users where `isPermitted === false`.
3. Checks `allowedPages` against `item.pagePermissionId` before rendering page content in the sidebar.

Admins bypass all page-permission checks.

### Page Permissions

Pages are registered in `src/lib/types/adminTypes.ts` as `AVAILABLE_PAGES`. Each entry has an `id` (the `pagePermissionId` key stored on the user), a display `name`, and a `category`. Admins assign these via the **Permissions Modal** in the Admin Panel.

---

## 5. Core Features

### 5.1 Watermark Editor

**Path:** `/edit/watermark`  
**File:** `src/app/edit/watermark/`

The most feature-rich tool in the suite. Supports batch watermarking with logos and footer images, per-image or global settings, photo adjustments, metadata injection, and multiple export formats.

#### Key Concepts

| Concept | Description |
|---|---|
| **Global vs Individual mode** | Toggle per image. Individual mode clones global settings and lets you diverge. |
| **Logos** | Multiple logos stacked on each image. Position, size, padding, opacity, rotation per logo. Drag thumbnails to reorder render layers. |
| **Footers** | Multiple footer images. Auto-Fit mode: centers at bottom, scales to % of canvas width. Manual mode: full scale/offset control. |
| **Presets** | Built-in EID/COMELEC logos loaded from `images/`. User's `allowedPresets` field filters which presets are visible (read live from Firebase RTDB). |
| **Photo Adjustments** | 15 sliders across Light, Color, Detail, and Effects groups, applied via `canvasFilters.ts`. Applied in memory; non-destructive. |
| **Metadata Injection** | XMP, EXIF, and PNG tEXt chunks injected on export. Optional visible text watermark overlay. |
| **Export** | PNG / JPG / WebP, quality slider, output scale (0.5×–2×), ZIP compression level. Downloads as a ZIP. |

#### State Management

All state lives in `ImageEditorContext` (React Context + custom `useHistory` hook for undo/redo). The context provides:
- `images[]` — uploaded images with their individual settings.
- `globalLogos[]` / `globalFooters[]` — global asset arrays.
- `globalPhotoAdjustments` — shared adjustment values.
- `undo()` / `redo()` (up to 30 history snapshots).

#### Canvas Rendering (`SingleImageEditor`)

Each image card renders via `<canvas>`. Drawing is debounced 40ms, abortable (via `AbortController`), and serialized with a lock to prevent concurrent redraws. Render order:
1. Draw base image.
2. Draw logos (in layer order).
3. Draw footers.
4. Apply photo adjustments (`applyPhotoAdjustments`).
5. Apply text watermark (`applyTextWatermark`).

#### Export Pipeline (`export.ts`)

`exportAsZip` iterates the blob-getter map, optionally re-renders at a different scale, injects metadata (`injectMetadataIntoBlob`), and packages everything into a ZIP using `JSZip` + `file-saver`.

---

### 5.2 Background Remover

**Path:** `/edit/bgremover`  
**File:** `src/app/edit/bgremover/page.tsx`

Two engines:

| Engine | Provider | Notes |
|---|---|---|
| **API** | `remove.bg` (via `/api/remove-bg`) | Works on any subject. Costs an API credit. Shows free/paid credit counts fetched from `/api/remove-bg/credits`. |
| **Local** | MediaPipe `SelfieSegmentation` | Runs fully in-browser. Best for selfies/portraits only. Loaded lazily when the user switches to Local mode. |

Output is always a transparent PNG rendered on a checkerboard preview. Activity logged to Firestore on download.

---

### 5.3 Logo Maker

**Path:** `/edit/logoeditor`  
**File:** `src/app/edit/logoeditor/page.tsx`

A canvas-based design tool. Elements: **text**, **shapes** (Circle, Square, Star, Heart, Triangle), and **uploaded images**. Each element has its own position, size, color, rotation, and z-index. Supports undo/redo, drag-to-reorder layers, and exports at 2× resolution.

---

### 5.4 Resolution Adjuster

**Path:** `/edit/resadjuster`  
**File:** `src/app/edit/resadjuster/page.tsx`

Downsamples a single image to a chosen percentage (5%–100%) using Canvas 2D. Outputs JPEG at 85% quality. Entirely client-side. Shows estimated file size reduction before download.

---

### 5.5 File Converter (PDF)

**Path:** `/document/pdf`  
**Files:** `src/app/document/pdf/page.tsx`, `conversion_function.ts`

Seven conversion modes:

| Mode | Input | Output | Engine |
|---|---|---|---|
| Word → PDF | .docx | .pdf | mammoth + html2canvas + jsPDF |
| PDF → Word | .pdf | .docx | PDF.js + docx |
| Excel → PDF | .xlsx/.csv | .pdf | ExcelJS + jsPDF-autoTable |
| PDF → Excel | .pdf | .xlsx | PDF.js + ExcelJS |
| Images → PDF | .jpg/.png | .pdf | pdf-lib |
| HTML → PDF | .html | .pdf | html2canvas + jsPDF |
| Combine PDFs | .pdf (multiple) | .pdf | pdf-lib |

PDF.js is loaded via CDN script tag at runtime. All processing runs in the browser.

---

### 5.6 Fuzzy Matcher

**Path:** `/Matcher`  
**Files:** `src/app/Matcher/page.tsx`, `src/lib/util/compare.ts`

Compares two Excel/CSV datasets using fuzzy string matching. Useful for cross-referencing voter name lists.

- Upload Dataset 1 and Dataset 2 (`.xlsx`, `.xls`, `.csv`).
- Set a **threshold** percentage (default 85%) to control match sensitivity.
- Results show each row from Dataset 1 with its best match from Dataset 2 and a confidence score.
- Unmatched rows (below threshold) are collected and viewable in the Unmatched List modal.
- Activity logged to Firestore on run.

---

### 5.7 FAQ Module

**Path:** `/document/faq`  
**File:** `src/app/document/faq/page.tsx`

A real-time FAQ management tool backed by Firestore.

- **Entries** have a topic and a multi-line details block.
- **Click to copy** — clicking an entry copies the details text to the clipboard.
- **Copy timer** — after copying, a configurable countdown (default 5 minutes) prevents the same entry from being re-copied until the timer expires. This is enforced via `timerStartTime` stored in Firestore so all users see the same cooldown.
- Admins can add, edit, and delete entries.
- Timer duration is configurable per-session (stored in `localStorage`).

---

### 5.8 Remarks / Dynamic Columns

**Path:** `/document/remarks`  
**File:** `src/app/document/remarks/component/dynamicColumn.tsx`

A locally-stored kanban-style column board. Users create named columns with a list of text items. Clicking an item copies it to the clipboard (with a toast notification). Columns can be:
- Drag-and-drop reordered (via `@dnd-kit`).
- Locked to prevent reordering.
- Edited or deleted.
- Color-coded.

All data persists in `localStorage` under the key `customColumns`.

---

### 5.9 DTR Extractor

**Path:** `/dtrextractor`  
**File:** `src/app/dtrextractor/page.tsx`

AI-powered Daily Time Record extractor. Users drag and drop DTR photos (images of paper time cards). Each image is sent to an internal API route (`/api/dtr`) which uses the Anthropic Claude API (vision) to extract a structured JSON array of 31-day entries with `morningIn`, `lunchOut`, and `afternoonOut` fields.

- Results are editable in a table (click any cell).
- Export as CSV or XLSX.
- **Google Sheets sync** via `/api/dtr/transfer` — writes extracted rows directly into a user-specified Google Sheet using a service account.
- Supports batch upload (multiple employees as separate tabs).
- Sheet config (Spreadsheet ID, sheet name, supervisor name) persists in `localStorage` as a preset.

---

### 5.10 DTR Logger

**Path:** `/admin/timelog`  
**File:** `src/app/admin/timelog/page.tsx`

A manual punch-clock interface for logging daily attendance.

- **Time Logger tab** — three punch buttons (Clock In, Lunch, Clock Out). Each punch shows a confirmation modal, stores the time in `localStorage` (per-day key), then auto-syncs to Google Sheets.
- **View Log tab** — connect one or more Google Sheets sources by Spreadsheet ID + tab name. Reads a structured DTR table (rows A12:L42) and renders it with color-coded columns.
- Sync status (syncing / ok / retry) shown per punch.
- Exports to CSV.

---

### 5.11 CSC Reviewer

**Path:** `/csc`  
**File:** `src/app/csc/page.tsx`

A 150-question Civil Service Exam reviewer covering 7 categories:

| Category | Count |
|---|---|
| Philippine Constitution | 25 |
| RA 6713 (Code of Conduct) | 20 |
| Human Rights | 15 |
| Environment | 15 |
| Verbal — English | 30 |
| Verbal — Filipino | 25 |
| Numerical | 20 |

Features: category filter, difficulty badges (Easy / Average / Hard), per-question explanations revealed after answering, score tracking, and a results screen with pass/fail message. State is entirely local (React state, no persistence).

---

### 5.12 COMELEC Directory

**Path:** `/directory/comelecoffices`  
**File:** `src/app/directory/comelecoffices/page.tsx`

An interactive Philippines map rendered on an HTML5 Canvas element using TopoJSON data (`/PhilippineMap/topojson/regions/`).

- Click a province to see a tooltip with the region name and a link to the COMELEC city/municipal office page for that area.
- Search by province or region name — the map pans/zooms to the match.
- Quick-access links to national/regional/NCR COMELEC offices and the voter registration schedule.
- Mouse wheel zoom, drag to pan, programmatic zoom/reset controls.
- Region legend in the sidebar links to zoom into each region.

Data file: `directory.json` maps regions to provinces and links COMELEC office URLs.

---

### 5.13 Messaging & Video Calls

**Path:** `/message`  
**File:** `src/app/message/page.tsx`

A full-featured real-time messaging system with WebRTC video/audio calling.

#### Chat Features

- **1-on-1 and group chats** — create from the chat list with user search.
- **Encrypted messages** — content is encrypted via `src/lib/util/crypto.ts` before writing to RTDB and decrypted on read.
- **File attachments** — uploaded to Firebase Storage, linked in chat.
- **Typing indicators** — live typing status written to `chats/{id}/typing/{uid}`.
- **Read receipts** — `lastReadMessageId` stored per user in `userChats/{uid}/{chatId}`.
- **Unread counts** — displayed as badges in the sidebar and chat list.
- **Message editing** — allowed within 2 minutes of sending. Content re-encrypted.
- **Custom nicknames** — per-user, per-chat nicknames (1-on-1 only). Stored at `chats/{id}/nicknames/{userId}/{targetUserId}`.
- **Group name editing** — stored as `chats/{id}/name`.
- **Add/remove members** — group chat management.
- **Call blocking** — users can block incoming calls per-contact.
- **Incoming call notifications** — shown as a toast overlay on any page outside `/message`.
- **Message notifications** — toast notifications for new messages received while not on the message page.

#### WebRTC Calling (`useWebRTC.ts`)

The hook manages the full call lifecycle:

1. **Caller** calls `startCall()` → acquires media → creates `RTCPeerConnection` → writes offer to `calls/{chatId}` via Firebase RTDB.
2. **Callee** sees the `ringing` signal via `watchChatForIncomingCall()` → shows incoming overlay.
3. **Callee** calls `acceptCall()` → acquires media → reads offer → creates answer → writes to RTDB.
4. ICE candidates are exchanged via `calls/{chatId}/iceCandidates/{userId}`.
5. Connection transitions: `requesting-media → calling → connecting → connected`.
6. Either side calls `hangUp()` → writes `state: "ended"` → RTDB node deleted after 4 seconds.

STUN servers: Google's public STUN servers. Optional TURN server via `NEXT_PUBLIC_TURN_*` env vars.

#### Ringtones (`useCallRingtone.ts`)

Synthetic ringtones generated entirely via the **Web Audio API**. Three modes:
- `online` — dual-pulse melodic ring (G4 + D5 chord with reverb).
- `offline` — descending minor triad (unavailable signal).
- `incoming` — ascending major 7th arpeggio.

---

## 6. Admin Panel

**Path:** `/admin/panel`, `/admin/log`, `/admin/timelog`, `/admin/test`

### User Management (`/admin/panel`)

Displays all registered users as cards showing online status, subscription info, permission state, and role badges. Admin actions:

| Action | Description |
|---|---|
| **Grant / Revoke** | Toggle `isPermitted` flag |
| **Promote / Demote** | Toggle `isAdmin` flag |
| **Roles** | Open `UserRolesModal` — set roles, subscription duration/infinite, allowed watermark presets |
| **Pages** | Open `PermissionsModal` — toggle per-page access from `AVAILABLE_PAGES` |

Subscription types: `editor`, `user`, `comelec`. Subscription expiry calculated from `subscriptionStartDate + subscriptionDays`. Infinite subscriptions never expire.

### Activity Log (`/admin/log`)

Reads from Firestore (`addLog` / `getAllLogs` / `searchLogs` / `getLogsPaginated`). Supports:
- Paginated browsing (50 rows/page).
- Search by name, email, function, or URL path.
- Live "time ago" relative timestamps with full date on hover.
- Manual refresh.

### Online Presence

Managed by `useUserPresence` hook. Writes `presence/{uid}/online: true` on mount and sets up `onDisconnect` to write a timestamp when the session ends.

---

## 7. Dashboard

**Path:** `/dashboard`  
**File:** `src/app/dashboard/page.tsx`

The authenticated home screen. Shows:
- A greeting (Good morning/afternoon/evening) with the user's first name.
- Live clock.
- Stat strip: role, total accessible tools, edit tools, doc tools.
- Tool cards grouped by category (Image & Design, Tools, Documents, Directory, Admin) — only tools the user has `allowedPages` access to are shown.
- Tool descriptions come from `TOOL_META` in `adminTypes.ts`.

---

## 8. UI Components & Design System

### Design Tokens (`globals.css`)

CSS custom properties form the Nexus design system:

```css
--nexus-indigo-500        /* Brand primary */
--nexus-sidebar-bg        /* #0d0d1a */
--nexus-sidebar-border    /* rgba(255,255,255,0.06) */
--nexus-radius-*          /* sm=6px, md=10px, lg=14px, xl=20px */
--nexus-shadow-*          /* sm, md, lg */
--nexus-bg-primary/secondary/tertiary
--nexus-text-primary/secondary/tertiary
```

Dark mode is applied via the `.dark` class on `<html>`, toggled by `DarkModeToggle` and persisted in `localStorage`.

### Sidebar (`sidebar.tsx`)

Collapsible on desktop (collapsed to 72px icon rail, expanded to 240px). On mobile, a bottom tab bar + slide drawer replaces it.

Features:
- Per-item unread message badge for the `/message` link.
- Online status dot on the user avatar chip.
- Dropdown group support for nested nav items.
- Settings modal (dark mode toggle, allow-calls toggle).

### Global Overlays

| Component | File | Purpose |
|---|---|---|
| `CallNotificationOverlay` | `callNotificationOverlay.tsx` | Incoming call toast + outgoing call mini-card + ring countdown bar. Provides `GlobalCallContext` so any page can trigger a call. |
| `MessageNotification` | `messageNotification.tsx` | Toast notifications for new messages received while not on the message page. 5-second auto-dismiss with a progress bar. |
| `MaintenancePage` | `maintenance.tsx` | Wraps the whole app. When `NEXT_PUBLIC_IS_LIVE !== "true"`, shows a maintenance screen instead of any content. |

### ThemeWrapper (`night_mode_wrapper.tsx`)

Root layout wrapper that:
1. Applies saved theme class before first paint (`useLayoutEffect`).
2. Conditionally renders the `Sidebar` based on route and auth state.
3. Adds bottom padding on mobile for the tab bar.
4. Renders `MessageNotification` and `CallNotificationOverlay` globally.

---

## 9. Firebase Integration

### Initialization

`src/lib/firebase/firebase.ts` initializes the Firebase app using `NEXT_PUBLIC_FIREBASE_*` environment variables and exports `db` (Realtime Database), `auth`, and `storage`.

### Realtime Database Structure

```
/users/{uid}                        — user profile & permissions
/presence/{uid}                     — online status { online, lastSeen }
/chats/{chatId}                     — chat metadata { name, users, isGroupChat }
/chats/{chatId}/messages/{msgId}    — { senderId, content (encrypted), type, timestamp }
/chats/{chatId}/typing/{uid}        — boolean (typing status)
/chats/{chatId}/nicknames/{uid}/{targetUid} — { nickname, setAt }
/userChats/{uid}/{chatId}           — { lastReadMessageId, lastReadAt }
/calls/{chatId}                     — WebRTC signaling { state, offer, answer, callerId, ... }
/calls/{chatId}/iceCandidates/{uid} — ICE candidate list
```

### Firestore Collections

| Collection | Purpose |
|---|---|
| `faqs` | FAQ entries (`topic`, `details`, `timerStartTime`) |
| `logs` | Activity log entries (`userName`, `userEmail`, `function`, `urlPath`, `createdAt`) |

### Firebase Actions (`src/lib/firebase/firebase.actions/`)

| Function | File | Description |
|---|---|---|
| `createChat` | `createChat.ts` | Creates a chat node and populates `userChats` for all participants |
| `sendMessage` | `sendMessage.ts` | Encrypts content and pushes to `chats/{id}/messages` |
| `deleteChat` | `deleteChat.ts` | Removes the chat node and all `userChats` entries |
| `uploadFile` | `uploadFile.ts` | Uploads to Firebase Storage, returns download URL |
| `addLog` / `getAllLogs` | `logsFirestore.ts` | Firestore log CRUD |
| `logActivity` / `offlineLogger` | `offlineLogger.ts` | Queues log writes; retries if offline |
| `subscribeToFaqs` / `addFaq` / etc. | `faqFirestore.ts` | FAQ Firestore operations |

---

## 10. Landing Page

**Path:** `/` (when unauthenticated)  
**Files:** `src/app/component/landing/`

| Component | Description |
|---|---|
| `Navbar` | Fixed top nav with scroll-aware background. Mobile hamburger menu. |
| `Hero` | Full-viewport hero with animated headline, stat strip, and a mock browser preview of the dashboard. |
| `Features` | Scrolling marquee of tool names + role-based access cards. |
| `Tools` | Two-section grid of all 8 core tools with hover glow effects. |
| `Privacy` | Split-layout section explaining the zero-upload architecture with a visual diagram. |
| `CTA` | Call-to-action section with trust badges. |
| `Footer` | Four-column footer with tool/workspace/info links and "100% client-side" status badge. |

---

## 11. Routing & Middleware

The app uses **Next.js App Router** with no custom `middleware.ts`. Route protection is handled client-side in:
1. `withAuth.tsx` (`UseGuard`) — wraps the entire app tree, checks auth state.
2. Per-page checks using `useAuth()` and `allowedPages`.
3. The `Sidebar` hides links the user doesn't have access to.

Public routes (no auth needed): `/`, `/login`.  
All other routes redirect to `/login` if unauthenticated.

---

## 12. Key Libraries & Dependencies

| Library | Purpose |
|---|---|
| `next` | App framework (App Router) |
| `firebase` | Auth, RTDB, Firestore, Storage |
| `framer-motion` | Animations (admin panel, login, modals) |
| `@dnd-kit/core` + `sortable` | Drag-and-drop (remarks columns, watermark logo reorder) |
| `pdf-lib` | PDF creation and merging |
| `jspdf` + `jspdf-autotable` | Excel → PDF and HTML → PDF |
| `exceljs` | Excel read/write |
| `mammoth` | `.docx` → HTML |
| `SheetJS (xlsx)` | XLSX export in DTR tools |
| `JSZip` + `file-saver` | ZIP packaging for watermark export |
| `fuse.js` (implied by compare util) | Fuzzy string matching |
| `@mediapipe/selfie_segmentation` | Local background removal |
| `react-google-recaptcha-v3` | Bot protection on access request form |
| `lucide-react` | Icon library (primary) |
| `react-icons` | Supplementary icons |
| `react-color` | Color picker in remarks columns |
| `react-toastify` | Toast notifications in remarks |

---

## 13. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | ✅ | Firebase RTDB URL |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | FCM sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `NEXT_PUBLIC_IS_LIVE` | ✅ | Set to `"true"` to show the app; any other value shows the maintenance screen |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | ✅ | Google reCAPTCHA v3 site key |
| `NEXT_PUBLIC_TURN_URL` | Optional | TURN server URL for WebRTC (fallback to STUN-only if unset) |
| `NEXT_PUBLIC_TURN_USERNAME` | Optional | TURN server username |
| `NEXT_PUBLIC_TURN_CREDENTIAL` | Optional | TURN server credential |
| `GOOGLE_SITE_VERIFICATION_KEY` | Optional | Google Search Console verification |
| `REMOVE_BG_API_KEY` | ✅ (server) | API key for `remove.bg` (used in `/api/remove-bg`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | ✅ (server) | JSON credentials for Google Sheets DTR sync |
| `RECAPTCHA_SECRET_KEY` | ✅ (server) | reCAPTCHA v3 secret for server-side verification |

---

## 14. Deployment Notes

### Build

```bash
npm install
npm run build
npm start
```

### Firebase Rules

Ensure your Firebase RTDB security rules allow:
- Read/write to `/users/{uid}` for the authenticated user.
- Read/write to `/chats` and `/userChats` for authenticated users who are members.
- Read/write to `/presence/{uid}` for the authenticated user.
- Read/write to `/calls` for authenticated users.

Firestore rules should allow authenticated users to read/write the `faqs` and `logs` collections (or restrict `logs` writes to server-side only via Admin SDK).

### Google Sheets Integration

The DTR sync requires a Google Cloud service account with the Sheets API enabled. Share each target spreadsheet with the service account email as **Editor**. Set `GOOGLE_SERVICE_ACCOUNT_JSON` to the full JSON key object (stringified).

### PWA

The app ships with a `manifest.json` and is installable as a PWA. No service worker is configured by default — add one via `next-pwa` if offline support is needed.

### SEO

Only the root (`/`) and `/login` pages are indexed. All workspace routes are disallowed in `robots.ts`. The sitemap (`sitemap.ts`) contains only the two public pages.

---

*Last updated: April 2026 · Avexi v5.0.0*
