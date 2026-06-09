import type { Metadata } from "next";
import { fetchPostBySlug, stripHtml } from "@/services/posts";
import { notFound } from "next/navigation";
import PoliticaDetail from "@/components/Politicas/PoliticaDetail";
import { absoluteUrl } from "@/lib/site";

interface PoliticaPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PoliticaPage({ params }: PoliticaPageProps) {
  const { slug } = await params;

  if (!slug) return notFound();

  const post = await fetchPostBySlug(slug);

  if (!post) return notFound();

  return <PoliticaDetail post={post} />;
}

export async function generateMetadata({
  params,
}: PoliticaPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await fetchPostBySlug(slug);
    if (!post) return { title: "Política no encontrada" };

    const description = stripHtml(
      post.excerpt.rendered || `Lee más sobre ${post.title.rendered}`
    ).slice(0, 320);

    return {
      title: `${post.title.rendered} - Belm`,
      description,
      openGraph: {
        title: `${post.title.rendered} - Belm`,
        description,
        type: "article",
        publishedTime: post.date,
        modifiedTime: post.modified,
        url: absoluteUrl(`/politicas/${slug}`),
        siteName: "Belm",
      },
      alternates: {
        canonical: absoluteUrl(`/politicas/${slug}`),
      },
    };
  } catch {
    return { title: "Políticas - Belm" };
  }
}
