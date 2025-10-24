import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-expect-error: allow global CSS import without module declarations
import "./globals.css";
import UseGuard from "./component/withAuth";
import ThemeWrapper from "./component/wrapper/night-mode-wrapper";
import { AuthProvider } from "./Chat/AuthContext";
// import "./Remarks/remarks.css"

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
              {children}
            </ThemeWrapper>
          </UseGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
