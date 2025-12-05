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
  },
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
