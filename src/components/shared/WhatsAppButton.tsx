"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";
import { useState } from "react";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = "+51913393134",
  message,
  className = "",
}) => {
  const pathname = usePathname();
  const [isIconHovered, setIsIconHovered] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Generar mensaje dinámico basado en la página actual
  const getDynamicMessage = () => {
    if (message) return message; // Si se proporciona un mensaje personalizado, usarlo

    if (pathname?.includes("/product/")) {
      return "Quiero más información sobre este producto";
    } else if (pathname?.includes("/categoria/")) {
      return "Quiero más información sobre esta categoría";
    } else if (pathname?.includes("/cart")) {
      return "Necesito ayuda con mi carrito de compras";
    } else if (pathname?.includes("/checkout")) {
      return "Necesito ayuda con mi compra";
    } else {
      return "Hola, quiero más información sobre sus productos";
    }
  };

  // Validar número de teléfono
  const isValidPhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");
    return /^\d{7,15}$/.test(cleanPhone); // Entre 7 y 15 dígitos
  };

  const handleWhatsAppClick = () => {
    try {
      // Rate limiting: evitar clicks muy seguidos (mínimo 2 segundos entre clicks)
      const now = Date.now();
      if (now - lastClickTime < 2000) {
        console.log("Rate limiting: esperando antes del siguiente click");
        return;
      }
      setLastClickTime(now);

      const dynamicMessage = getDynamicMessage();
      const encodedMessage = encodeURIComponent(dynamicMessage);

      // Limpiar y formatear el número de teléfono correctamente
      const cleanPhoneNumber = phoneNumber
        .replace(/[\s\-\(\)\+]/g, "") // Remover espacios, guiones, paréntesis y signos +
        .replace(/^0+/, ""); // Remover ceros iniciales

      // Validar el número de teléfono
      if (!isValidPhoneNumber(phoneNumber)) {
        console.error("Invalid phone number:", phoneNumber);
        alert(
          "Número de teléfono inválido. Por favor, verifica el número: " +
            phoneNumber
        );
        return;
      }

      const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhoneNumber}&text=${encodedMessage}`;

      // Debug logging
      console.log("WhatsApp Button Clicked:", {
        phoneNumber: cleanPhoneNumber,
        message: dynamicMessage,
        encodedMessage,
        whatsappUrl,
        pathname,
      });

      // Intentar abrir WhatsApp
      const newWindow = window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );

      // Verificar si la ventana se abrió correctamente
      if (!newWindow) {
        console.error(
          "WhatsApp window could not be opened. Possible popup blocker."
        );
        // Fallback: intentar redirigir en la misma ventana
        window.location.href = whatsappUrl;
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      // Fallback: mostrar mensaje de error o intentar redirigir
      alert(
        "No se pudo abrir WhatsApp. Por favor, contacta directamente al número: " +
          phoneNumber
      );
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className={`fixed bottom-6 right-6 z-[9999] ${className}`}
    >
      <motion.button
        onClick={handleWhatsAppClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-green-500/25 transition-all duration-300 relative focus:outline-none focus:ring-4 focus:ring-green-300"
        aria-label="Contactar por WhatsApp"
        title="Contáctanos por WhatsApp"
      >
        <FaWhatsapp
          className="w-6 h-6 transition-colors duration-200"
          onMouseEnter={() => setIsIconHovered(true)}
          onMouseLeave={() => setIsIconHovered(false)}
        />

        {/* Tooltip que aparece solo al hacer hover en el icono */}
        <div
          className={`absolute bottom-full right-0 mb-2 px-3 py-2 bg-primary text-white text-sm rounded-lg transition-opacity duration-300 whitespace-nowrap pointer-events-none ${
            isIconHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          ¡Contáctanos por WhatsApp!
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary"></div>
        </div>
      </motion.button>
    </motion.div>
  );
};

export default WhatsAppButton;
