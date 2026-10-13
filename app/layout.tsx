import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";

// Sloane chose Cormorant Garamond for the whole app.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
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
    <html lang="en" className={`${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
