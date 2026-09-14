"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

interface LinkEntry {
  id: string;
  url: string;
  title: string;
  description: string;
  favicon_url?: string;
  image_url?: string;
  tags: string[];
  created_at: string;
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

function isUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchLinkMetadata(url: string): Promise<{
  title: string;
  description: string;
  image_url: string;
}> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || url;
    const descMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']*)["']>/i
    ) || html.match(
      /<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']>/i
    );
    const description = descMatch?.[1]?.trim() || extractDomain(url);
    const imgMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']>/i
    );
    let image_url = imgMatch?.[1] || "";
    if (image_url && !image_url.startsWith("http")) {
      const baseUrl = new URL(url);
      image_url = image_url.startsWith("/")
        ? `${baseUrl.origin}${image_url}`
        : `${baseUrl.origin}/${image_url}`;
    }
    return { title, description, image_url };
  } catch {
    return { title: url, description: extractDomain(url), image_url: "" };
  }
}