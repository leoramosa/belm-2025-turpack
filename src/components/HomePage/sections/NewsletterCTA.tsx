"use client";

import NewsletterForm from "@/components/Newsletter/NewsletterForm";

const NewsletterCTA = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-600 via-emerald-600 to-teal-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100"></div>
      </div>
      {/* Floating Glass Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/20 rounded-full blur-2xl z-0" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl z-0" />
      <div
        className="absolute top-1/2 left-1/2 w-24 h-24 bg-emerald-200/20 rounded-full blur-2xl z-0"
        style={{ transform: "translate(-50%,-50%)" }}
      />
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Content */}
          <div className="transition-opacity duration-700">
            {/* Icon */}
            <div className="mb-8 transition-transform duration-500">
              <div className="w-20 h-20 bg-white/30 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto shadow-2xl border border-white/30 ring-1 ring-white/40 transition-transform duration-300 hover:scale-110">
                <svg
                  className="w-10 h-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
            </div>
            {/* Title */}
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 transition-opacity duration-500">
              ¡Mantente Conectado!
            </h2>
            {/* Subtitle */}
            <p className="text-lg text-white/80 mb-8 transition-opacity duration-500">
              Suscríbete a nuestro newsletter y recibe novedades exclusivas.
            </p>
            {/* Newsletter Form */}
            <div className="mx-auto max-w-xl">
              <NewsletterForm
                className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/30 ring-1 ring-white/40"
                placeholder="Tu correo electrónico"
                buttonText="Suscribirme"
                successMessage="¡Gracias por suscribirte! Recibirás nuestras novedades pronto."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterCTA;
