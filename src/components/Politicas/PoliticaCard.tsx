"use client";

import { IPost } from "@/interface/IPost";
import { formatDate, getExcerpt, stripHtml } from "@/services/posts";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, FileText } from "lucide-react";

interface PoliticaCardProps {
  post: IPost;
  featured?: boolean;
}

export default function PoliticaCard({
  post,
  featured = false,
}: PoliticaCardProps) {
  const excerpt = getExcerpt(
    post.excerpt.rendered || post.content.rendered,
    featured ? 200 : 120
  );
  const formattedDate = formatDate(post.date);

  return (
    <article
      className={`group bg-white rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden animate-fade-in-up ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        {/* Meta information */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>5 min lectura</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-200 line-clamp-2">
          {stripHtml(post.title.rendered)}
        </h3>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3">{excerpt}</p>

        {/* Read More Button */}
        <Link href={`/politicas/${post.slug}`}>
          <button className="inline-flex items-center gap-2 text-primary hover:text-secondary font-medium transition-all duration-200 group/btn hover:scale-105 active:scale-95">
            <FileText className="w-4 h-4" />
            Leer política
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </Link>
      </div>
    </article>
  );
}
