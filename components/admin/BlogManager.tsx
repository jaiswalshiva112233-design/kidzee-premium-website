"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FilePenLine,
  ImagePlus,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  SearchCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { BlogArticle } from "@/lib/blog";
import { blogCategories, createBlogSlug } from "@/lib/blog";

type EditableSection = {
  heading: string;
  paragraphs: string;
  bullets: string;
};

type EditorState = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  coverImageUrl: string;
  coverImageAlt: string;
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  sections: EditableSection[];
  conclusion: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  errors?: string[];
  articles?: BlogArticle[];
  id?: string;
};

const builtInArticles = [
  "How to Prepare Your Child for Preschool",
  "Signs Your Child Is Ready for Preschool",
  "Why Play-Based Learning Matters",
  "Choosing the Right Preschool in Dwarka",
  "Building Social Skills in the Early Years",
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptySection(): EditableSection {
  return { heading: "", paragraphs: "", bullets: "" };
}

function emptyEditor(): EditorState {
  return {
    id: "",
    title: "",
    slug: "",
    excerpt: "",
    category: "Parenting",
    author: "Kidzee Sector 12, Dwarka",
    publishedAt: today(),
    coverImageUrl: "",
    coverImageAlt: "",
    featured: false,
    published: false,
    seoTitle: "",
    seoDescription: "",
    intro: "",
    sections: [emptySection()],
    conclusion: "",
  };
}

function splitBlocks(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

function articleToEditor(article: BlogArticle): EditorState {
  return {
    id: article._id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    category: article.category,
    author: article.author,
    publishedAt: article.publishedAt.slice(0, 10),
    coverImageUrl: article.coverImageUrl ?? "",
    coverImageAlt: article.coverImageAlt,
    featured: article.featured,
    published: article.published,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    intro: article.intro.join("\n\n"),
    sections: article.sections.length
      ? article.sections.map((section) => ({
          heading: section.heading,
          paragraphs: section.paragraphs.join("\n\n"),
          bullets: section.bullets.join("\n"),
        }))
      : [emptySection()],
    conclusion: article.conclusion,
  };
}

function FieldLabel({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail?: string;
}) {
  return (
    <span className="mb-2 block text-sm font-black text-[#35243E]">
      {children}
      {detail ? (
        <span className="ml-2 text-xs font-bold text-[#95899A]">{detail}</span>
      ) : null}
    </span>
  );
}

const inputClass =
  "min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A99EAC] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:opacity-60";
const textareaClass = `${inputClass} min-h-0 py-3 leading-6`;

export default function BlogManager() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const editorRef = useRef<HTMLFormElement>(null);

  const publishedCount = useMemo(
    () => articles.filter((article) => article.published).length,
    [articles],
  );

  useEffect(() => {
    let previewUrl = "";
    const timeoutId = window.setTimeout(() => {
      if (!cover) {
        setPreview("");
        return;
      }

      previewUrl = URL.createObjectURL(cover);
      setPreview(previewUrl);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [cover]);

  async function loadArticles(selectId?: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/website-blog", {
        cache: "no-store",
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success || !result.articles) {
        throw new Error(result.message ?? "Unable to load website articles.");
      }

      setArticles(result.articles);

      if (selectId) {
        const saved = result.articles.find((article) => article._id === selectId);
        if (saved) {
          setEditor(articleToEditor(saved));
        }
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load website articles.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadArticles();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function update<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setEditor((current) => ({ ...current, [key]: value }));
  }

  function startNew() {
    setEditor(emptyEditor());
    setCover(null);
    setMessage("");
    setError("");
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function editArticle(article: BlogArticle) {
    setEditor(articleToEditor(article));
    setCover(null);
    setMessage("");
    setError("");
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateSection(
    index: number,
    key: keyof EditableSection,
    value: string,
  ) {
    update(
      "sections",
      editor.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [key]: value } : section,
      ),
    );
  }

  function moveSection(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= editor.sections.length) return;

    const next = [...editor.sections];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    update("sections", next);
  }

  function removeSection(index: number) {
    if (editor.sections.length === 1) {
      update("sections", [emptySection()]);
      return;
    }

    update(
      "sections",
      editor.sections.filter((_, sectionIndex) => sectionIndex !== index),
    );
  }

  function chooseCover(event: ChangeEvent<HTMLInputElement>) {
    setCover(event.target.files?.[0] ?? null);
  }

  async function saveArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const article = {
      title: editor.title,
      slug: editor.slug || createBlogSlug(editor.title),
      excerpt: editor.excerpt,
      category: editor.category,
      author: editor.author,
      publishedAt: `${editor.publishedAt}T00:00:00.000+05:30`,
      coverImageAlt: editor.coverImageAlt || editor.title,
      featured: editor.featured,
      published: editor.published,
      seoTitle: editor.seoTitle || editor.title,
      seoDescription: editor.seoDescription || editor.excerpt,
      intro: splitBlocks(editor.intro),
      sections: editor.sections.map((section) => ({
        heading: section.heading,
        paragraphs: splitBlocks(section.paragraphs),
        bullets: splitLines(section.bullets),
      })),
      conclusion: editor.conclusion,
    };

    const formData = new FormData();
    formData.set("id", editor.id);
    formData.set("article", JSON.stringify(article));
    if (cover) formData.set("cover", cover);

    try {
      const response = await fetch("/api/admin/website-blog", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success || !result.id) {
        throw new Error(result.message ?? "The article could not be saved.");
      }

      setCover(null);
      setMessage(result.message ?? "The article has been saved.");
      await loadArticles(result.id);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The article could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteArticle() {
    if (!editor.id || deleting) return;
    if (!window.confirm(`Delete “${editor.title}”? This cannot be undone.`)) return;

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/website-blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editor.id }),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "The article could not be deleted.");
      }

      setEditor(emptyEditor());
      setCover(null);
      setMessage(result.message ?? "The article has been deleted.");
      await loadArticles();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The article could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const disabled = loading || saving || deleting;
  const visibleCover = preview || editor.coverImageUrl;

  return (
    <div className="space-y-7">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["CMS articles", String(articles.length)],
          ["Published", String(publishedCount)],
          ["Protected guides", String(builtInArticles.length)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[22px] border border-[#E8DEEC] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8B7D90]">{label}</p>
            <p className="mt-2 text-3xl font-black text-[#2D1736]">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-7 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-[26px] border border-[#E8DEEC] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">Articles</p>
                <h2 className="mt-1 text-xl font-black text-[#2D1736]">Manage posts</h2>
              </div>
              <button type="button" onClick={startNew} disabled={disabled} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5B2A86] text-white transition hover:bg-[#48206B] disabled:opacity-50" aria-label="Create new article">
                <Plus size={20} />
              </button>
            </div>

            <button type="button" onClick={() => void loadArticles()} disabled={disabled} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#DED2E4] text-xs font-black text-[#5B2A86] disabled:opacity-50">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh list
            </button>

            <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex min-h-28 items-center justify-center text-[#6A328F]"><LoaderCircle className="animate-spin" /></div>
              ) : articles.length === 0 ? (
                <div className="rounded-2xl bg-[#FAF8FC] p-4 text-sm font-semibold leading-6 text-[#756A79]">No panel-created articles yet. Your five existing parent guides remain live.</div>
              ) : (
                articles.map((article) => (
                  <button key={article._id} type="button" onClick={() => editArticle(article)} className={`w-full rounded-2xl border p-4 text-left transition ${editor.id === article._id ? "border-[#6A328F] bg-[#F5ECFA]" : "border-[#EEE7F1] bg-[#FCFAFD] hover:border-[#CDB7D8]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-black leading-5 text-[#2D1736]">{article.title}</p>
                      {article.featured ? <Star size={15} className="shrink-0 fill-[#F6C84B] text-[#C78E00]" /> : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${article.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}`}>{article.published ? "Published" : "Draft"}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#7B6E80]">{article.category}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[24px] bg-[#2D1736] p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#F6C84B]">Safe fallback</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/75">The five original parent guides stay protected in the website code. Panel-created articles are added without removing them.</p>
          </div>
        </aside>

        <form onSubmit={saveArticle} className="space-y-6" ref={editorRef}>
          <section className="rounded-[28px] border border-[#E8DEEC] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">{editor.id ? "Edit article" : "New article"}</p>
                <h2 className="mt-1 text-2xl font-black text-[#2D1736]">Article details</h2>
              </div>
              {editor.id && editor.published ? (
                <Link href={`/blog/${editor.slug}`} target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#F3EAF8] px-4 text-sm font-black text-[#5B2A86]">View article</Link>
              ) : null}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="md:col-span-2">
                <FieldLabel>Article title</FieldLabel>
                <input value={editor.title} onChange={(event) => { const title = event.target.value; setEditor((current) => ({ ...current, title, slug: current.id || current.slug ? current.slug : createBlogSlug(title), coverImageAlt: current.coverImageAlt || title, seoTitle: current.seoTitle || title })); }} disabled={disabled} className={inputClass} placeholder="Example: A parent’s guide to settling into preschool" />
              </label>

              <label>
                <FieldLabel>Page URL</FieldLabel>
                <div className="flex items-center rounded-2xl border border-[#DCCFE4] bg-white focus-within:border-[#6A328F] focus-within:ring-4 focus-within:ring-[#6A328F]/10">
                  <span className="pl-4 text-xs font-black text-[#95899A]">/blog/</span>
                  <input value={editor.slug} onChange={(event) => update("slug", createBlogSlug(event.target.value))} disabled={disabled} className="min-h-12 min-w-0 flex-1 bg-transparent px-2 pr-4 text-sm font-semibold text-[#2D1736] outline-none" />
                </div>
              </label>

              <label>
                <FieldLabel>Category</FieldLabel>
                <input list="blog-categories" value={editor.category} onChange={(event) => update("category", event.target.value)} disabled={disabled} className={inputClass} />
                <datalist id="blog-categories">{blogCategories.map((category) => <option key={category} value={category} />)}</datalist>
              </label>

              <label>
                <FieldLabel>Author</FieldLabel>
                <input value={editor.author} onChange={(event) => update("author", event.target.value)} disabled={disabled} className={inputClass} />
              </label>

              <label>
                <FieldLabel>Publish date</FieldLabel>
                <input type="date" value={editor.publishedAt} onChange={(event) => update("publishedAt", event.target.value)} disabled={disabled} className={inputClass} />
              </label>

              <label className="md:col-span-2">
                <FieldLabel detail={`${editor.excerpt.length}/360`}>Card summary</FieldLabel>
                <textarea value={editor.excerpt} onChange={(event) => update("excerpt", event.target.value)} disabled={disabled} rows={3} maxLength={360} className={textareaClass} placeholder="A helpful, specific summary parents will see before opening the article." />
              </label>

              <label className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#E4D9E9] bg-[#FAF7FC] p-4">
                <input type="checkbox" checked={editor.published} onChange={(event) => update("published", event.target.checked)} disabled={disabled} className="h-5 w-5 accent-[#5B2A86]" />
                <span><span className="block text-sm font-black text-[#35243E]">Publish on website</span><span className="mt-1 block text-xs font-semibold text-[#827687]">Untick to keep it as a private draft.</span></span>
              </label>

              <label className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#E4D9E9] bg-[#FAF7FC] p-4">
                <input type="checkbox" checked={editor.featured} onChange={(event) => update("featured", event.target.checked)} disabled={disabled} className="h-5 w-5 accent-[#5B2A86]" />
                <span><span className="block text-sm font-black text-[#35243E]">Feature this article</span><span className="mt-1 block text-xs font-semibold text-[#827687]">Shows it first on the Blog page.</span></span>
              </label>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E8DEEC] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF2C8] text-[#8D6100]"><ImagePlus size={21} /></span><div><h2 className="text-xl font-black text-[#2D1736]">Cover photo</h2><p className="text-xs font-semibold text-[#837887]">Recommended: landscape image, at least 1200 × 630 px.</p></div></div>
            <div className="mt-5 grid gap-5 md:grid-cols-[240px_1fr]">
              <div className="relative flex aspect-[1.91/1] items-center justify-center overflow-hidden rounded-2xl bg-[#F1EBF4]">
                {visibleCover ? <Image src={visibleCover} alt={editor.coverImageAlt || editor.title || "Article cover preview"} fill unoptimized className="object-cover" /> : <ImagePlus size={34} className="text-[#9B8DA0]" />}
              </div>
              <div className="space-y-4">
                <label><FieldLabel>Upload cover photo</FieldLabel><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={chooseCover} disabled={disabled} className="block w-full rounded-2xl border border-[#DCCFE4] bg-white p-3 text-sm font-semibold text-[#5B4D62] file:mr-3 file:rounded-xl file:border-0 file:bg-[#5B2A86] file:px-4 file:py-2 file:font-black file:text-white" /></label>
                <label><FieldLabel>Photo description for Google and accessibility</FieldLabel><input value={editor.coverImageAlt} onChange={(event) => update("coverImageAlt", event.target.value)} disabled={disabled} className={inputClass} placeholder="Children enjoying a classroom activity at Kidzee Sector 12 Dwarka" /></label>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E8DEEC] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF4FF] text-[#1769AA]"><FilePenLine size={21} /></span><div><h2 className="text-xl font-black text-[#2D1736]">Article content</h2><p className="text-xs font-semibold text-[#837887]">Leave one blank line between paragraphs.</p></div></div>
            <label className="mt-6 block"><FieldLabel>Opening paragraphs</FieldLabel><textarea value={editor.intro} onChange={(event) => update("intro", event.target.value)} disabled={disabled} rows={6} className={textareaClass} placeholder="Introduce the parent’s question clearly and naturally." /></label>

            <div className="mt-6 space-y-5">
              {editor.sections.map((section, index) => (
                <article key={index} className="rounded-[24px] border border-[#E8DEEC] bg-[#FCFAFD] p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black text-[#2D1736]">Section {index + 1}</h3>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => moveSection(index, -1)} disabled={disabled || index === 0} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E1D7E6] bg-white text-[#5B2A86] disabled:opacity-30" aria-label="Move section up"><ChevronUp size={16} /></button>
                      <button type="button" onClick={() => moveSection(index, 1)} disabled={disabled || index === editor.sections.length - 1} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E1D7E6] bg-white text-[#5B2A86] disabled:opacity-30" aria-label="Move section down"><ChevronDown size={16} /></button>
                      <button type="button" onClick={() => removeSection(index)} disabled={disabled} className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-white text-red-600 disabled:opacity-30" aria-label="Remove section"><X size={16} /></button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    <label><FieldLabel>Heading</FieldLabel><input value={section.heading} onChange={(event) => updateSection(index, "heading", event.target.value)} disabled={disabled} className={inputClass} /></label>
                    <label><FieldLabel>Paragraphs</FieldLabel><textarea value={section.paragraphs} onChange={(event) => updateSection(index, "paragraphs", event.target.value)} disabled={disabled} rows={6} className={textareaClass} /></label>
                    <label><FieldLabel detail="optional, one point per line">Helpful points</FieldLabel><textarea value={section.bullets} onChange={(event) => updateSection(index, "bullets", event.target.value)} disabled={disabled} rows={4} className={textareaClass} placeholder="Keep the goodbye warm and brief&#10;Return at the time you promised" /></label>
                  </div>
                </article>
              ))}
            </div>

            <button type="button" onClick={() => update("sections", [...editor.sections, emptySection()])} disabled={disabled || editor.sections.length >= 12} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#CDB7D8] bg-[#F8F2FB] px-4 text-sm font-black text-[#5B2A86] disabled:opacity-50"><Plus size={17} /> Add section</button>
            <label className="mt-6 block"><FieldLabel>Conclusion</FieldLabel><textarea value={editor.conclusion} onChange={(event) => update("conclusion", event.target.value)} disabled={disabled} rows={5} className={textareaClass} placeholder="End with a useful, reassuring takeaway for parents." /></label>
          </section>

          <section className="rounded-[28px] border border-[#E8DEEC] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF8F1] text-[#28755D]"><SearchCheck size={21} /></span><div><h2 className="text-xl font-black text-[#2D1736]">Google and AI search details</h2><p className="text-xs font-semibold text-[#837887]">Clear titles and descriptions help search systems understand the article.</p></div></div>
            <div className="mt-5 grid gap-5">
              <label><FieldLabel detail={`${editor.seoTitle.length}/60`}>SEO title</FieldLabel><input value={editor.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} disabled={disabled} maxLength={60} className={inputClass} placeholder={editor.title || "Article title"} /></label>
              <label><FieldLabel detail={`${editor.seoDescription.length}/160`}>SEO description</FieldLabel><textarea value={editor.seoDescription} onChange={(event) => update("seoDescription", event.target.value)} disabled={disabled} minLength={80} maxLength={160} rows={3} className={textareaClass} placeholder={editor.excerpt || "A specific 80–160 character description for Google."} /></label>
            </div>
          </section>

          {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}
          {message ? <div role="status" className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800"><CheckCircle2 size={19} />{message}</div> : null}

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-[24px] border border-[#DCCFE4] bg-white/95 p-4 shadow-[0_18px_55px_rgba(45,23,54,0.2)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <button type="button" onClick={startNew} disabled={disabled} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] px-4 text-sm font-black text-[#5B2A86] disabled:opacity-50"><Plus size={17} /> New</button>
              {editor.id ? <button type="button" onClick={() => void deleteArticle()} disabled={disabled} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 disabled:opacity-50"><Trash2 size={17} /> Delete</button> : null}
            </div>
            <button type="submit" disabled={disabled} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white transition hover:bg-[#48206B] disabled:opacity-50">
              {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Saving article…" : editor.published ? "Save & publish" : "Save draft"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
