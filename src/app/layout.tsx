import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import UseGuard from "../lib/auth/withAuth";
import ThemeWrapper from "./component/wrapper/night_mode_wrapper";
import "./globals.css";
import { AuthProvider } from "../lib/auth/AuthContext";
import MaintenancePage from "./component/maintenance";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ─── Constants ────────────────────────────────────────────────────
const APP_NAME = "Avexi";
const APP_DESCRIPTION =
  "Avexi is a professional workspace suite for image editing, document management, voter registration tools, and team collaboration.";
const APP_URL = "https://avexi.digital"; // ← change to your actual domain
const APP_TAGLINE = "Workspace Suite";
const TWITTER_HANDLE = "@SeekerOfficial"; // ← update if needed

// ─── Viewport export (Next 14+ best practice) ────────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d1a" },
  ],
};

// ─── Root Metadata ────────────────────────────────────────────────
export const metadata: Metadata = {
  // ── Core ──────────────────────────────────────────────────────
  applicationName: APP_NAME,
  title: {
    //  — ${APP_TAGLINE}
    default: `${APP_NAME}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "workspace tools",
    "image editor",
    "watermark",
    "background remover",
    "logo maker",
    "PDF converter",
    "voter registration",
    "document management",
    "Filipino workspace",
    "Avexi",
  ],
  authors: [{ name: "Avexi Studio", url: APP_URL }],
  creator: "Avexi Studio",
  publisher: "Avexi Studio",
  generator: "Next.js",
  category: "productivity",
  classification: "Productivity Tools",

  // ── Canonical & Alternates ────────────────────────────────────
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },

  // ── Open Graph ───────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: `${APP_URL}/Avexi.png`, // 1200×630 recommended
        width: 1200,
        height: 630,
        alt: `${APP_NAME} — Professional Workspace Suite`,
        type: "image/png",
      },
      {
        url: `${APP_URL}/Avexi.png`, // 1:1 for some platforms
        width: 600,
        height: 600,
        alt: `${APP_NAME} Logo`,
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X Card ─────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/Avexi.png`],
  },

  // ── Icons ─────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/Avexi.svg", type: "image/svg+xml" },
      { url: "/Avexi.png", type: "image/png", sizes: "192x192" },
      { url: "/Avexi.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },

  // ── Manifest (PWA) ────────────────────────────────────────────
  manifest: "/manifest.json",

  // ── Robots ───────────────────────────────────────────────────
  // The app is authenticated — tell crawlers only the login page matters
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Verification (add your Search Console token) ──────────────
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION_KEY, // ← replace
    // yandex: "YOUR_YANDEX_TOKEN",
    // bing: "YOUR_BING_TOKEN",
  },

  // ── Other ────────────────────────────────────────────────────
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ── Preconnect for performance ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* ── Structured Data (JSON-LD) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: APP_NAME,
              description: APP_DESCRIPTION,
              url: APP_URL,
              applicationCategory: "ProductivityApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "PHP",
              },
              author: {
                "@type": "Organization",
                name: "Avexi",
                url: APP_URL,
              },
              featureList: [
                "Image Watermarking",
                "Background Removal",
                "Logo Creation",
                "PDF Conversion",
                "Voter Registration Tools",
                "Document Management",
                "Team Collaboration",
                "DTR Extraction",
              ],
            }),
          }}
        />

        {/* ── Organization Structured Data ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Avexi Studio",
              url: APP_URL,
              logo: `${APP_URL}/Avexi.png`,
              sameAs: [
                // Add your social media URLs here
                // "https://twitter.com/yourhandle",
                // "https://github.com/yourorg",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <UseGuard>
            <MaintenancePage>
              <ThemeWrapper>{children}</ThemeWrapper>
            </MaintenancePage>
          </UseGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
