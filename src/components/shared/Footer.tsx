"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiTruck,
  FiShield,
  FiRotateCcw,
  FiCreditCard,
  FiInstagram,
  FiFacebook,
} from "react-icons/fi";
import { TbBrandTiktok } from "react-icons/tb";
import NewsletterForm from "@/components/Newsletter/NewsletterForm";

import Logo from "../../../public/logo-2.png";

export default function Footer() {
  const quickLinks = {
    "Nuestra Tienda": [
      { name: "Ver Tienda", href: "/shop" },
      { name: "Ofertas Especiales", href: "/ofertas-especiales" },
      { name: "Lo más nuevo", href: "/lo-mas-nuevo" },
      { name: "Lo más vendido", href: "/lo-mas-vendido" },
    ],
    Categorías: [
      { name: "Maquillaje", href: "/categorias/maquillaje" },
      { name: "Cuidado Facial", href: "/categorias/cuidado-facial" },
      { name: "Cuidado Corporal", href: "/categorias/cuidado-corporal" },
      { name: "Cabello", href: "/categorias/cabello" },
      { name: "Fragancias", href: "/categorias/fragancias" },
      { name: "Moda y Accesorios", href: "/categorias/moda-y-accesorios" },
    ],
    "Atención al Cliente": [
      { name: "Preguntas frecuentes", href: "/politicas/preguntas-frecuentes" },

      {
        name: "Políticas de cambio y devoluciones",
        href: "/politicas/politicas-de-cambio-y-devoluciones",
      },
      {
        name: "Política de Garantía",
        href: "/politicas/politica-de-garantia",
      },
    ],
    "Mi Cuenta": [
      { name: "Iniciar sesión", href: "/login" },
      { name: "Registrarse", href: "/register" },
      { name: "Rastrear pedido", href: "/order-track" },
      { name: "Lista de deseos", href: "/wishlist" },
    ],
  };

  const trustFeatures = [
    {
      icon: FiTruck,
      title: "Envío Gratis",
      description: "En pedidos superiores a S/ 149",
    },
    {
      icon: FiShield,
      title: "Compra Segura",
      description: "Pagos 100% seguros",
    },
    {
      icon: FiRotateCcw,
      title: "Devolución Fácil",
      description: "7 días para cambios",
    },
    {
      icon: FiCreditCard,
      title: "Múltiples Pagos",
      description: "Tarjetas, transferencias y más",
    },
  ];

  const socialLinks = [
    {
      icon: FiInstagram,
      href: " https://instagram.com/belmperu",
      label: "Instagram",
      target: "_blank",
    },
    {
      icon: FiFacebook,
      href: "https://www.facebook.com/belmperu",
      label: "Facebook",
      target: "_blank",
    },
    {
      icon: TbBrandTiktok,
      href: "https://www.tiktok.com/@belmperu",
      label: "Tiktok",
      target: "_blank",
    },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¡Únete a nuestra comunidad!
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Recibe ofertas exclusivas, nuevos productos y consejos de
                belleza directamente en tu inbox.
              </p>
            </div>

            <div className="max-w-md mx-auto animate-fade-in-up animation-delay-200">
              <NewsletterForm
                className="flex gap-3"
                placeholder="Tu correo electrónico"
                buttonText="Suscribirse"
                successMessage="¡Gracias por suscribirte! Te enviaremos las mejores ofertas."
                variant="footer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trust Features */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="text-center group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-primary bg-white rounded-full mb-4 group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Contact & Stats Section */}
      <div className="py-12 bg-secondary border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-2 animate-fade-in-up">
              <h3 className="font-semibold text-white mb-4 text-lg">
                Contáctanos
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FiPhone className="w-5 h-5 text-white" />
                  <span className="text-white">+51 913-393-134</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiMail className="w-5 h-5 text-white" />
                  <span className="text-white">hola@belm.pe</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiMapPin className="w-5 h-5 text-white" />
                  <span className="text-white">
                    Lima, Perú - Envíos a todo el país
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="lg:col-span-2 animate-fade-in-up animation-delay-200">
              <h3 className="font-semibold text-center text-white mb-4 text-lg">
                Nuestros números
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">10K+</div>
                  <div className="text-sm text-white">Clientes felices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">500+</div>
                  <div className="text-sm text-white">Productos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">4.9★</div>
                  <div className="text-sm text-white">Calificación</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">24/7</div>
                  <div className="text-sm text-white">Soporte</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Footer Content */}
      <div className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="animate-fade-in-left">
                <div className="mb-6">
                  <Image src={Logo} alt="Belm" width={140} />
                </div>
                <p className=" mb-6 leading-relaxed">
                  Tu destino de belleza y bienestar. Productos de calidad
                  premium para realzar tu belleza natural.
                </p>
                <div className="flex space-x-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target={social.target}
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-secondary hover:text-white hover:scale-110 hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            {Object.entries(quickLinks).map(
              ([category, links], categoryIndex) => (
                <div
                  key={category}
                  className="lg:col-span-1 animate-fade-in-up"
                  style={{ animationDelay: `${categoryIndex * 100}ms` }}
                >
                  <h3 className="font-semibold  mb-4 text-lg">{category}</h3>
                  <ul className="space-y-3">
                    {links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className=" hover:text-[#ceadff] transition-colors duration-200 text-sm"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-third text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col-reverse md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-x-2 text-sm text-gray-400">
              <span>© 2024 Belm. Todos los derechos reservados.</span>

              <span>
                Desarrollado por &nbsp;
                <a
                  href="https://digiltek.com/"
                  target="_blank"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Digiltek
                </a>
              </span>
            </div>
            <div className="flex flex-col md:flex-row items-center md:space-x-6 gap-y-4 mb-4 text-sm">
              <Link
                href="/politicas/terminos-y-condiciones"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Términos y condiciones
              </Link>
              <Link
                href="/politicas/politicas-de-privacidad"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Política de privacidad
              </Link>
              <Link
                href="/politicas/politica-de-cookies"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Política de Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
