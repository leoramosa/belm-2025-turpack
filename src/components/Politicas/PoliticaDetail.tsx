"use client";

import { IPost } from "@/interface/IPost";
import { stripHtml } from "@/services/posts";
import { useMemo } from "react";
// import PoliticaCard from "./PoliticaCard";
// import Link from "next/link";
// import { ArrowLeft, Calendar, Clock, FileText, Share2 } from "lucide-react";

interface PoliticaDetailProps {
  post: IPost;
  // relatedPosts: IPost[]; // Removido porque no se usa
  // categories: IPostCategory[]; // Removido porque no se usa
}

export default function PoliticaDetail({
  post,
}: // relatedPosts, // Removido porque no se usa
PoliticaDetailProps) {
  const cleanTitle = stripHtml(post.title.rendered);

  // Procesar el contenido HTML para corregir problemas SEO
  const cleanContent = useMemo(() => {
    let content = post.content?.rendered || "";

    // 1. Reemplazar enlaces de belm.pe (sin www) a www.belm.pe para evitar redirecciones internas
    content = content.replace(
      /https?:\/\/(?:www\.)?belm\.pe(\/[^"'\s<>]*)?/gi,
      (match) => {
        // Si ya tiene www, dejarlo igual
        if (match.includes("www.belm.pe")) {
          return match;
        }
        // Si no tiene www, agregarlo
        return match.replace(/https?:\/\/belm\.pe/gi, (url) => {
          return url.replace("belm.pe", "www.belm.pe");
        });
      }
    );

    // 2. Eliminar etiquetas <strong> y <b> vacías
    content = content.replace(/<strong\s*><\/strong>/gi, "");
    content = content.replace(/<b\s*><\/b>/gi, "");
    content = content.replace(/<strong\s*\/>/gi, "");
    content = content.replace(/<b\s*\/>/gi, "");

    // 3. Convertir <b> a <strong> (mejor semántica)
    content = content.replace(/<b\b([^>]*)>/gi, "<strong$1>");
    content = content.replace(/<\/b>/gi, "</strong>");

    // 4. Procesar <strong> con contenido simple (sin HTML anidado)
    content = content.replace(
      /<strong([^>]*)>([^<]+)<\/strong>/gi,
      (match, attrs, text) => {
        const trimmedText = text.trim();

        // Si está vacío, eliminar la etiqueta
        if (trimmedText.length === 0) {
          return "";
        }

        // Si el texto es muy largo (>70 caracteres), remover la etiqueta strong pero mantener el texto
        if (trimmedText.length > 70) {
          return trimmedText;
        }

        return match;
      }
    );

    // 5. Procesar <strong> con contenido anidado (puede tener HTML interno)
    content = content.replace(
      /<strong([^>]*)>([\s\S]*?)<\/strong>/gi,
      (match, attrs, innerContent) => {
        // Extraer solo el texto (sin HTML interno) para verificar longitud
        const textOnly = innerContent.replace(/<[^>]*>/g, "").trim();

        // Si no hay texto, eliminar la etiqueta
        if (textOnly.length === 0) {
          return innerContent;
        }

        // Si el texto es muy largo (>70 caracteres), remover la etiqueta strong pero mantener el contenido
        if (textOnly.length > 70) {
          return innerContent;
        }

        return match;
      }
    );

    // 6. Detectar y eliminar texto duplicado en negritas
    // Primero, recopilar todos los textos en negritas
    const strongTexts = new Map<string, number>();
    content.replace(/<strong[^>]*>([^<]+)<\/strong>/gi, (match, text) => {
      const normalizedText = text.trim().toLowerCase();
      strongTexts.set(
        normalizedText,
        (strongTexts.get(normalizedText) || 0) + 1
      );
      return match;
    });

    // Eliminar etiquetas strong duplicadas (mantener solo la primera ocurrencia)
    const seenTexts = new Set<string>();
    content = content.replace(
      /<strong[^>]*>([^<]+)<\/strong>/gi,
      (match, text) => {
        const normalizedText = text.trim().toLowerCase();
        if (
          seenTexts.has(normalizedText) &&
          (strongTexts.get(normalizedText) || 0) > 1
        ) {
          // Si ya vimos este texto y está duplicado, mantener solo el texto sin la etiqueta
          return text.trim();
        }
        seenTexts.add(normalizedText);
        return match;
      }
    );

    // 7. Corregir errores ortográficos comunes
    // tí → ti (sin tilde, cuando se refiere al pronombre personal)
    // Usar regex con límites de palabra para evitar cambiar palabras que contengan "tí"
    content = content.replace(/\btí\b/gi, "ti");

    // n° → n.° (agregar punto antes del símbolo de grado ordinal)
    content = content.replace(/\bn°\b/gi, "n.°");
    // También corregir variantes con espacios: n ° → n.°
    content = content.replace(/\bn\s+°/gi, "n.°");

    // Corregir otros errores comunes de ordinales
    content = content.replace(/\b(\d+)°\b/gi, "$1.°");
    content = content.replace(/\b(\d+)\s+°/gi, "$1.°");

    return content;
  }, [post.content?.rendered]);

  return (
    <article className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 animate-fade-in">
          {/* <Link
            href="/politicas"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Políticas
          </Link> */}
        </nav>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header
            className="mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Categories */}
            {/*  {post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map((categoryId) => {
                  const category = categories.find(
                    (cat) => cat.id === categoryId
                  );
                  return category ? (
                    <span
                      key={category.id}
                      className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full"
                    >
                      {category.name}
                    </span>
                  ) : null;
                })}
              </div>
            )} */}

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-4">
              {cleanTitle}
            </h1>

            {/* Meta information */}
            {/* <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>5 min lectura</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Política</span>
              </div>
            </div> */}

            {/* Share button */}
            {/* <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: cleanTitle,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  // Aquí podrías mostrar un toast
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </motion.button> */}
          </header>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-12 bg-white rounded-2xl shadow-lg p-8 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: cleanContent }}
              className="text-gray-700 text-justify leading-relaxed [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-gray-900 [&>h1]:mb-8 [&>h1]:mt-12 [&>h1]:first:mt-0 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mb-6 [&>h2]:mt-10 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-gray-900 [&>h3]:mb-4 [&>h3]:mt-8 [&>h4]:text-lg [&>h4]:font-semibold [&>h4]:text-gray-900 [&>h4]:mb-3 [&>h4]:mt-6 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:mb-4 [&>ol]:mb-4 [&>li]:mb-2 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-gray-600"
            />
          </div>

          {/* Related Posts */}
          {/* {relatedPosts.length > 0 && (
            <section
              className="border-t border-gray-200 pt-12 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Políticas relacionadas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <PoliticaCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </motion.section>
          )} */}
        </div>
      </div>
    </article>
  );
}
