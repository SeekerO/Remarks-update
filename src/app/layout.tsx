import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UseGuard from "./component/withAuth";
import ThemeWrapper from "./component/wrapper/night-mode-wrapper";
import { AuthProvider } from "./Chat/AuthContext";
import { YouTubePlayerProvider } from "./component/YouTubePlayerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KKK",
  description: "Website for KKK Tools",
};

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
        <AuthProvider>
          <UseGuard redirectTo="/login">
            <ThemeWrapper>
              <YouTubePlayerProvider>
                {children}
              </YouTubePlayerProvider>
            </ThemeWrapper>
          </UseGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
