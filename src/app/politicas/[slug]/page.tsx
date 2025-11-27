import { fetchPostBySlug } from "@/services/posts";
import { notFound } from "next/navigation";
import PoliticaDetail from "@/components/Politicas/PoliticaDetail";

interface PoliticaPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PoliticaPage({ params }: PoliticaPageProps) {
  const { slug } = await params;

  if (!slug) return notFound();

  // Fetch post data
  const post = await fetchPostBySlug(slug);

  if (!post) return notFound();

  return <PoliticaDetail post={post} />;
}

export async function generateMetadata({ params }: PoliticaPageProps) {
  const { slug } = await params;

  try {
    const post = await fetchPostBySlug(slug);
    if (!post) return { title: "Política no encontrada" };

    return {
      title: `${post.title.rendered} - Belm`,
      description:
        post.excerpt.rendered || `Lee más sobre ${post.title.rendered}`,
      openGraph: {
        title: `${post.title.rendered} - Belm`,
        description:
          post.excerpt.rendered || `Lee más sobre ${post.title.rendered}`,
        type: "article",
        publishedTime: post.date,
        modifiedTime: post.modified,
      },
    };
  } catch {
    return { title: "Políticas - Belm" };
  }
}
