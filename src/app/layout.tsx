import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { fetchProductCategoriesTree } from "@/services/categories";
import Navbar from "@/components/shared/Navbar";
import CartDrawer from "@/components/CartDrawer/CartDrawer";
import Footer from "@/components/shared/Footer";
import GlobalLoader from "@/components/shared/GlobalLoader";
import { generatePageTitle } from "@/utils/seo";
import  WhatsAppButton  from "@/components/shared/WhatsAppButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: generatePageTitle("Belm", "Belm", "Productos de Belleza"),
  description: "Catálogo headless conectado a WordPress",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Belm",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await fetchProductCategoriesTree();

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar categories={categories} />
        
        <main>{children}</main>
        <CartDrawer />
        <Footer />
        <WhatsAppButton />
        <GlobalLoader />
        <Toaster position="top-center" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
