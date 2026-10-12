import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sloane's Closet",
  description: "Save clothes from any store, see them on you, and shop.",
  appleWebApp: {
    capable: true,
    title: "Sloane's Closet",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#e3f4ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
