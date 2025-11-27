import { IPost, IPostCategory } from "@/interface/IPost";

// Función para obtener todos los posts
export const fetchPosts = async (
  params: {
    page?: number;
    per_page?: number;
    category?: number;
    search?: string;
  } = {}
): Promise<IPost[]> => {
  try {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.per_page)
      queryParams.append("per_page", params.per_page.toString());
    if (params.category)
      queryParams.append("categories", params.category.toString());
    if (params.search) queryParams.append("search", params.search);

    // Solo posts publicados
    queryParams.append("status", "publish");
    // Ordenar por fecha más reciente
    queryParams.append("orderby", "date");
    queryParams.append("order", "desc");

    // Detectar si estamos en el servidor o cliente
    const isServer = typeof window === "undefined";

    if (isServer) {
      // En el servidor, llamar directamente a la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const consumerKey = process.env.WC_CONSUMER_KEY;
      const consumerSecret = process.env.WC_CONSUMER_SECRET;

      if (!apiUrl || !consumerKey || !consumerSecret) {
        throw new Error("API credentials not configured");
      }

      const basicAuth = Buffer.from(
        `${consumerKey}:${consumerSecret}`
      ).toString("base64");
      const endpoint = `${apiUrl}/wp-json/wp/v2/posts?${queryParams.toString()}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } else {
      // En el cliente, usar la API interna
      const endpoint = `/api/posts?${queryParams.toString()}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
};

// Función para obtener un post específico por slug
export const fetchPostBySlug = async (slug: string): Promise<IPost | null> => {
  try {
    // Detectar si estamos en el servidor o cliente
    const isServer = typeof window === "undefined";

    if (isServer) {
      // En el servidor, llamar directamente a la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const consumerKey = process.env.WC_CONSUMER_KEY;
      const consumerSecret = process.env.WC_CONSUMER_SECRET;

      if (!apiUrl || !consumerKey || !consumerSecret) {
        throw new Error("API credentials not configured");
      }

      const basicAuth = Buffer.from(
        `${consumerKey}:${consumerSecret}`
      ).toString("base64");
      const endpoint = `${apiUrl}/wp-json/wp/v2/posts?slug=${slug}&status=publish`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const posts = await response.json();
      return posts.length > 0 ? posts[0] : null;
    } else {
      // En el cliente, usar la API interna
      const endpoint = `/api/posts?slug=${slug}&status=publish`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const posts = await response.json();
      return posts.length > 0 ? posts[0] : null;
    }
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    return null;
  }
};

// Función para obtener un post específico por ID
export const fetchPostById = async (id: number): Promise<IPost | null> => {
  try {
    // Detectar si estamos en el servidor o cliente
    const isServer = typeof window === "undefined";

    if (isServer) {
      // En el servidor, llamar directamente a la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const consumerKey = process.env.WC_CONSUMER_KEY;
      const consumerSecret = process.env.WC_CONSUMER_SECRET;

      if (!apiUrl || !consumerKey || !consumerSecret) {
        throw new Error("API credentials not configured");
      }

      const basicAuth = Buffer.from(
        `${consumerKey}:${consumerSecret}`
      ).toString("base64");
      const endpoint = `${apiUrl}/wp-json/wp/v2/posts/${id}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } else {
      // En el cliente, usar la API interna
      const endpoint = `/api/posts/${id}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    }
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    return null;
  }
};

// Función para obtener categorías de posts
export const fetchPostCategories = async (): Promise<IPostCategory[]> => {
  try {
    // Detectar si estamos en el servidor o cliente
    const isServer = typeof window === "undefined";

    if (isServer) {
      // En el servidor, llamar directamente a la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const consumerKey = process.env.WC_CONSUMER_KEY;
      const consumerSecret = process.env.WC_CONSUMER_SECRET;

      if (!apiUrl || !consumerKey || !consumerSecret) {
        throw new Error("API credentials not configured");
      }

      const basicAuth = Buffer.from(
        `${consumerKey}:${consumerSecret}`
      ).toString("base64");
      const endpoint = `${apiUrl}/wp-json/wp/v2/categories?per_page=100`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } else {
      // En el cliente, usar la API interna
      const endpoint = "/api/posts/categories?per_page=100";
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    }
  } catch (error) {
    console.error("Error fetching post categories:", error);
    return [];
  }
};

// Función para obtener posts relacionados
export const fetchRelatedPosts = async (
  currentPostId: number,
  categoryIds: number[],
  limit: number = 3
): Promise<IPost[]> => {
  try {
    const categoryParams = categoryIds
      .map((id) => `categories=${id}`)
      .join("&");

    // Detectar si estamos en el servidor o cliente
    const isServer = typeof window === "undefined";

    if (isServer) {
      // En el servidor, llamar directamente a la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const consumerKey = process.env.WC_CONSUMER_KEY;
      const consumerSecret = process.env.WC_CONSUMER_SECRET;

      if (!apiUrl || !consumerKey || !consumerSecret) {
        throw new Error("API credentials not configured");
      }

      const basicAuth = Buffer.from(
        `${consumerKey}:${consumerSecret}`
      ).toString("base64");
      const endpoint = `${apiUrl}/wp-json/wp/v2/posts?${categoryParams}&exclude=${currentPostId}&per_page=${limit}&status=publish&orderby=date&order=desc`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } else {
      // En el cliente, usar la API interna
      const endpoint = `/api/posts?${categoryParams}&exclude=${currentPostId}&per_page=${limit}&status=publish&orderby=date&order=desc`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    }
  } catch (error) {
    console.error("Error fetching related posts:", error);
    return [];
  }
};

// Función para obtener posts destacados
export const fetchFeaturedPosts = async (
  limit: number = 6
): Promise<IPost[]> => {
  try {
    // Detectar si estamos en el servidor o cliente
    const isServer = typeof window === "undefined";

    if (isServer) {
      // En el servidor, llamar directamente a la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const consumerKey = process.env.WC_CONSUMER_KEY;
      const consumerSecret = process.env.WC_CONSUMER_SECRET;

      if (!apiUrl || !consumerKey || !consumerSecret) {
        throw new Error("API credentials not configured");
      }

      const basicAuth = Buffer.from(
        `${consumerKey}:${consumerSecret}`
      ).toString("base64");
      const endpoint = `${apiUrl}/wp-json/wp/v2/posts?per_page=${limit}&status=publish&orderby=date&order=desc`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } else {
      // En el cliente, usar la API interna
      const endpoint = `/api/posts?per_page=${limit}&status=publish&orderby=date&order=desc`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    }
  } catch (error) {
    console.error("Error fetching featured posts:", error);
    return [];
  }
};

// Función para limpiar contenido HTML
export const stripHtml = (html: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "");
};

// Función para formatear fecha
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Función para obtener extracto del contenido
export const getExcerpt = (
  content: string,
  maxLength: number = 150
): string => {
  const cleanContent = stripHtml(content);
  if (cleanContent.length <= maxLength) return cleanContent;
  return cleanContent.substring(0, maxLength) + "...";
};
