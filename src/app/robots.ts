import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/test-loader",
        "/cart",
        "/checkout",
        "/login",
        "/register",
        "/my-account",
        "/orders/",
        "/wishlist",
        "/thank-you",
        "/payment-result/",
        "/subscription-status",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
