"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

interface LinkEntry {
  id: string;
  url: string;
  title: string;
  description: string;
  favicon: string;
  createdAt: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getFavicon(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
  } catch {
    return "";
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

async function fetchLinkMetadata(url: string): Promise<{
  title: string;
  description: string;
  image_url?: string;
}> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || url;
    const descMatch = html.match(
      /<meta[\s+]+name=["']description["'][\s+]+content=["']([^"']*)["']/i
    ) || html.match(
      /<meta[\s+]+property=["']og:description["'][\s+]+content=["']([^"']*)["']/i
    );
    const description = descMatch?.[1]?.trim() || extractDomain(url);
    const imgMatch = html.match(
      /<meta[\s+]+property=["']og:image["'][\s+]+content=["']([^"']*)["']/i
    );
    let image_url = imgMatch?.[1];
    if (image_url && !image_url.startsWith("http")) {
      const baseUrl = new URL(url);
      image_url = image_url.startsWith("/")
        ? `${baseUrl.origin}${image_url}`
        : `${baseUrl.origin}/${image_url}`;
    }
    return { title, description, image_url };
  } catch {
    return { title: url, description: extractDomain(url) };
  }
}

function isUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Home() {
  const [urlInput, setUrlInput] = useState<string>("");
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const loadFromDB = async () => {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) {
        console.error("Failed to load links:", error);
        setLoading(false);
        return;
      }

      const mapped: LinkEntry[] = (data || []).map((item: any) => ({
        id: item.id,
        url: item.url,
        title: item.title || item.url,
        description: item.description || extractDomain(item.url),
        favicon: getFavicon(item.url),
        createdAt: new Date(item.created_at).getTime(),
      }));

      setLinks(mapped);
      setLoading(false);
    };

    loadFromDB();
  }, []);

  const addLink = useCallback(async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError("URLを入力してください🐝");
      return;
    }
    if (!isUrl(trimmed)) {
      setError("正しいURLを入力してください（例: https://example.com）🍯");
      return;
    }
    setError("");
    setSaving(true);

    try {
      const metadata = await fetchLinkMetadata(trimmed);
      
      const { data, error } = await supabase
        .from("links")
        .insert({
          url: trimmed,
          title: metadata.title,
          description: metadata.description,
          favicon_url: getFavicon(trimmed),
          image_url: metadata.image_url || "",
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to insert link:", error);
        setError("リンクの保存に失敗しました🐝");
        setSaving(false);
        return;
      }

      const newLink: LinkEntry = {
        id: data.id,
        url: data.url,
        title: data.title || data.url,
        description: data.description || extractDomain(data.url),
        favicon: getFavicon(data.url),
        createdAt: new Date(data.created_at).getTime(),
      };

      setLinks((prev) => [newLink, ...prev].slice(0, 100));
      setUrlInput("");
    } catch (err) {
      console.error("Error adding link:", err);
      setError("リンクの保存に失敗しました🐝");
    } finally {
      setSaving(false);
    }
  }, [urlInput]);

  const removeLink = useCallback(async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete link:", error);
      setError("リンクの削除に失敗しました🐝");
      return;
    }
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleDelete = useCallback(async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    await removeLink(id);
  }, [removeLink]);

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-black dark:to-gray-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-amber-200/50 dark:border-amber-800/30">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <span className="text-3xl">🍯</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
              LinkShare
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
              シェアしよう、素敵なリンクを
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Input */}
        <section className="max-w-3xl mx-auto w-full px-6 pt-8 pb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addLink();
            }}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <input
                type="url"
                placeholder="https://example.com を貼り付ける..."
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setError("");
                }}
                className="w-full h-12 pl-4 pr-4 rounded-2xl border border-amber-300/60 dark:border-amber-700/40 bg-white/80 dark:bg-gray-900/80 backdrop-blur text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60 dark:focus:ring-amber-500/40 focus:bg-white dark:focus:bg-gray-900 transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500 text-white font-semibold text-sm hover:from-amber-500 hover:to-orange-500 dark:hover:from-amber-400 dark:hover:to-orange-400 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "⏳ 保存中..." : "🐝 追加"}
            </button>
          </form>
          {error && (
            <p className="mt-2 text-sm text-red-500 dark:text-red-400 px-1">
              {error}
            </p>
          )}
        </section>

        {/* Links List */}
        <section className="max-w-3xl mx-auto w-full px-6 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                ローディング中...🐝
              </p>
            </div>
          ) : links.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-6xl mb-4">🔗</span>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                まだリンクがありません
              </p>
              <p className="text-gray-400 dark:text-gray-400 text-sm">
                リンクをシェアしていきましょう！🐝✨
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {links.map((link) => (
                <div key={link.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {link.favicon && link.favicon !== '' && (
                  <img src={link.favicon} alt="" className="w-8 h-8 flex-shrink-0 object-contain" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{link.title}</h3>
                  {link.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{link.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{extractDomain(link.url)}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Link
                    </span>
                  </div>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0"
                >
                  Open ↗
                </a>
              </div>
              <form onSubmit={(e) => handleDelete(e, link.id)} className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button type="submit" className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
          )}
        </section>
      </main>
    </div>
  );
}
