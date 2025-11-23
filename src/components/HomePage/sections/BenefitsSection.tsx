"use client";

import { motion } from "framer-motion";

const BenefitsSection = () => {
  const benefits = [
    {
      id: 1,
      title: "Diseños Útiles e Innovadores",
      description: "Productos pensados para mejorar tu día a día",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      id: 2,
      title: "Productos de Calidad",
      description: "Garantizamos la mejor calidad en todos nuestros productos",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
    },
    {
      id: 3,
      title: "Retiro Gratis en Tiendas y Lockers",
      description: "Recoge tus productos donde más te convenga",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      id: 4,
      title: "Envíos a Nivel Nacional",
      description: "Llegamos a todos los rincones del Perú",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-3xl"></div>
      </div>
      {/* Floating Glass Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl z-0" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-200/20 rounded-full blur-2xl z-0" />
      <div
        className="absolute top-1/2 left-1/2 w-24 h-24 bg-teal-200/20 rounded-full blur-2xl z-0"
        style={{ transform: "translate(-50%,-50%)" }}
      />
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-4xl lg:text-5xl font-bold text-emerald-900 mb-4"
          >
            ¿Por qué elegirnos?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-lg text-emerald-700"
          >
            Beneficios exclusivos para ti
          </motion.p>
        </motion.div>
        {/* Glassmorphism Benefit Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8"
        >
          {benefits.map((benefit, idx) => (
            <motion.div
              key={benefit.id}
              variants={itemVariants}
              whileHover={{
                scale: 1.06,
                boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)",
              }}
              className="relative rounded-2xl p-8 flex flex-col items-center bg-white/30 backdrop-blur-xl border border-white/30 ring-1 ring-white/40 shadow-xl transition-all duration-300 group overflow-hidden"
              style={{ boxShadow: "0 4px 24px 0 rgba(31,38,135,0.10)" }}
            >
              {/* Animated Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
                viewport={{ once: true }}
                className="mb-4 text-4xl drop-shadow-lg text-emerald-700"
              >
                {benefit.icon}
              </motion.div>
              <h3 className="text-xl font-bold text-emerald-900 mb-2 drop-shadow-sm text-center">
                {benefit.title}
              </h3>
              <p className="text-emerald-700 text-sm mb-2 text-center">
                {benefit.description}
              </p>
              {/* Glass shine effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-2xl" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BenefitsSection;
