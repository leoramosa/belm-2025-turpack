import type { NextConfig } from "next";

type RemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  pathname?: string;
};

const remotePatterns: RemotePattern[] = [];

const wordpressBaseUrl = process.env.WORDPRESS_HEADLESS_BASE_URL;
const wordpressMediaHost = process.env.WORDPRESS_MEDIA_HOST;

try {
  if (wordpressBaseUrl) {
    const { protocol, hostname } = new URL(wordpressBaseUrl);
    remotePatterns.push({
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
    });
  }
} catch {
  console.warn(
    "WORDPRESS_HEADLESS_BASE_URL no es una URL válida. Asegúrate de incluir el protocolo (https://)."
  );
}

if (wordpressMediaHost) {
  remotePatterns.push({
    protocol: "https",
    hostname: wordpressMediaHost,
  });
}

if (!remotePatterns.length) {
  remotePatterns.push({
    protocol: "https",
    hostname: "back-belm-pe-929276.hostingersite.com",
  });
}

const nextConfig = {
  images: {
    remotePatterns,
    // Optimización de caché: 31 días (2678400 segundos)
    // Reduce transformaciones y escrituras en caché
    minimumCacheTTL: 2678400,
    // Usar solo WebP en lugar de AVIF + WebP para reducir transformaciones
    // WebP tiene mejor compatibilidad y reduce costos
    formats: ["image/webp"],
    // Calidades permitidas: reducir el rango para menos transformaciones
    // 75 es un buen balance entre calidad y tamaño
    qualities: [75, 90],
    // Tamaños de imagen optimizados para reducir transformaciones
    // Ajustados según dispositivos comunes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  // Remover cabecera X-Powered-By por seguridad y SEO
  // Esto elimina la cabecera X-Powered-By: Next.js de todas las respuestas
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/orders/track",
        destination: "/order-track",
        permanent: true, // 308 redirect permanente
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
