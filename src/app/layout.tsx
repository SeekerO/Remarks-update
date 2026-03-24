import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import UseGuard from "../lib/auth/withAuth";
import ThemeWrapper from "./component/wrapper/night_mode_wrapper";
import "./globals.css"
import { AuthProvider } from "../lib/auth/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- SEO Configuration Start ---
const APP_NAME = "Avexi";
const APP_DESCRIPTION = "A modern, professional tool suite for web and mobile developers. Build clean, error-free components with React, Next.js, and TypeScript.";
const APP_URL = "https://avexi.vercel.app"; // **[IMPORTANT]: Change this to your actual domain**

export const metadata: Metadata = {
  // 1. Primary Metadata
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`, // Sets a template for all nested page titles
  },
  description: APP_DESCRIPTION,

  // 2. Canonical URL & Site Base
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: APP_URL, // Define the preferred URL for the root
  },

  // 3. Open Graph (for Facebook, LinkedIn, etc.)
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    images: [
      {
        url: `${APP_URL}/opengraph-image.jpg`, // **[ACTION]: Create this image (1200x630px)**
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // 4. Twitter Card (for Twitter/X)
  twitter: {
    card: 'summary_large_image',
    site: '@SeekerOfficial', // **[ACTION]: Change to your Twitter handle**
    creator: '@SeekerOfficial',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/twitter-image.jpg`], // **[ACTION]: Create this image (ratio 2:1)**
  },

  // 5. Icons and PWA
  icons: {
    icon: '/Avexi.svg', // **[ACTION]: Ensure you have your favicon in /public**
    apple: '/apple-icon.png',
  },
};
// --- SEO Configuration End ---

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* The AuthProvider and other providers are correctly wrapping the app */}
        <AuthProvider>
          <UseGuard>
            <ThemeWrapper>
              {children}
            </ThemeWrapper>
          </UseGuard>
        </AuthProvider>
      </body>
    </html>
  );
}