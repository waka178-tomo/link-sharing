"use client";

import { useState, useEffect, useCallback } from "react";

interface LinkEntry {
  id: string;
  url: string;
  title: string;
  description: string;
  favicon: string;
  createdAt: number;
}

const STORAGE_KEY = "linkshare_links";

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

function isUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function loadLinks(): LinkEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLinks(links: LinkEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export default function Home() {
  const [urlInput, setUrlInput] = useState("");
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [error, setError] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    setLinks(loadLinks());
  }, []);

  const addLink = useCallback(() => {
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
    const newLink: LinkEntry = {
      id: generateId(),
      url: trimmed,
      title: trimmed,
      description: extractDomain(trimmed),
      favicon: getFavicon(trimmed),
      createdAt: Date.now(),
    };
    const updated = [newLink, ...links].slice(0, 100);
    setLinks(updated);
    saveLinks(updated);
    setUrlInput("");
  }, [urlInput, links]);

  const removeLink = useCallback(
    (id: string) => {
      const updated = links.filter((l) => l.id !== id);
      setLinks(updated);
      saveLinks(updated);
    },
    [links]
  );

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
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500 text-white font-semibold text-sm hover:from-amber-500 hover:to-orange-500 dark:hover:from-amber-400 dark:hover:to-orange-400 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              🐝 追加
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
          {links.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-6xl mb-4">🔗</span>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                まだリンクがありません
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                上のボックスにURLを貼り付けて、素敵なリンクをシェアしよう！
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  onMouseEnter={() => setHoveredId(link.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative flex items-start gap-4 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-900/80 hover:shadow-md hover:border-amber-300/60 dark:hover:border-amber-700/40 transition-all"
                >
                  {/* Favicon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    {link.favicon ? (
                      <img
                        src={link.favicon}
                        alt=""
                        className="w-6 h-6"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            (parent as HTMLElement).innerHTML = '<span class="text-lg">🔗</span>';
                          }
                        }}
                      />
                    ) : (
                      <span className="text-lg">🔗</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors truncate block"
                    >
                      {link.title}
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {link.description}
                    </p>
                    <time className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                      {new Date(link.createdAt).toLocaleString("ja-JP")}
                    </time>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeLink(link.id)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                    title="削除"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Count */}
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-4">
                {links.length}件のリンク 🍯
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200/30 dark:border-amber-800/20 py-4">
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Made with 🐝 by LinkShare — data is stored locally in your browser
        </p>
      </footer>
    </div>
  );
}
