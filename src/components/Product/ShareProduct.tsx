"use client";

import { useState } from "react";
import {
  Facebook,
  Twitter,
  MessageCircle,
  Linkedin,
  Mail,
  Link2,
  Share2,
} from "lucide-react";
import {
  getFacebookShareUrl,
  getTwitterShareUrl,
  getWhatsAppShareUrl,
  getLinkedInShareUrl,
  getEmailShareUrl,
  copyToClipboard,
} from "@/utils/socialLinks";
import { toast } from "sonner";

interface ShareProductProps {
  productName: string;
  productUrl: string;
  productImage?: string;
  className?: string;
}

export default function ShareProduct({
  productName,
  productUrl,
  productImage,
  className = "",
}: ShareProductProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shareText = `Mira este producto: ${productName}`;
  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${productUrl}`
      : `https://www.belm.pe${productUrl}`;

  const handleShare = async (
    platform: string,
    shareUrl: string,
    isNativeShare = false
  ) => {
    try {
      // Si es compartir nativo y está disponible, usarlo
      if (isNativeShare && navigator.share) {
        await navigator.share({
          title: productName,
          text: shareText,
          url: fullUrl,
          ...(productImage && { files: [] }),
        });
        setIsOpen(false);
        return;
      }

      // Abrir en nueva ventana
      const width = 600;
      const height = 400;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      window.open(
        shareUrl,
        "_blank",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      setIsOpen(false);
    } catch (error) {
      console.error(`Error al compartir en ${platform}:`, error);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(fullUrl);
    if (success) {
      toast.success("Enlace copiado al portapapeles");
      setIsOpen(false);
    } else {
      toast.error("No se pudo copiar el enlace");
    }
  };

  const shareButtons = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: () =>
        handleShare("Facebook", getFacebookShareUrl(fullUrl, shareText)),
    },
    {
      name: "Twitter/X",
      icon: Twitter,
      color: "bg-black hover:bg-gray-800",
      onClick: () =>
        handleShare("Twitter", getTwitterShareUrl(fullUrl, shareText)),
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600",
      onClick: () =>
        handleShare("WhatsApp", getWhatsAppShareUrl(fullUrl, shareText)),
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      onClick: () =>
        handleShare("LinkedIn", getLinkedInShareUrl(fullUrl, shareText)),
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-gray-600 hover:bg-gray-700",
      onClick: () =>
        handleShare("Email", getEmailShareUrl(fullUrl, productName, shareText)),
    },
    {
      name: "Copiar enlace",
      icon: Link2,
      color: "bg-purple-600 hover:bg-purple-700",
      onClick: handleCopyLink,
    },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 font-medium"
        aria-label="Compartir producto"
        aria-expanded={isOpen}
      >
        <Share2 className="w-5 h-5" />
        <span>Compartir</span>
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menú de opciones */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2">
            {/* Compartir nativo (si está disponible) */}
            {typeof window !== "undefined" &&
              typeof navigator !== "undefined" &&
              "share" in navigator && (
                <>
                  <button
                    onClick={() => handleShare("Nativo", "", true)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 text-gray-700"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Compartir...</span>
                  </button>
                  {/* Separador */}
                  <div className="border-t border-gray-200 my-2" />
                </>
              )}

            {/* Botones de redes sociales */}
            {shareButtons.map((button) => {
              const Icon = button.icon;
              return (
                <button
                  key={button.name}
                  onClick={button.onClick}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 text-gray-700"
                >
                  <div
                    className={`w-8 h-8 rounded-full ${button.color} flex items-center justify-center text-white`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{button.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
