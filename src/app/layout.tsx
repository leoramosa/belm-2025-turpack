import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { fetchProductCategoriesTree } from "@/services/categories";
import Navbar from "@/components/shared/Navbar";
import CartDrawer from "@/components/CartDrawer/CartDrawer";
import Footer from "@/components/shared/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tienda Store",
  description: "Catálogo headless conectado a WordPress",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar categories={categories} />
        <main>{children}</main>
        <CartDrawer />
        <Footer />
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
