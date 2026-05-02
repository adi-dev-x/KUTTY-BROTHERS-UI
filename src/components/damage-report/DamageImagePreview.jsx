import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Expand, X, ChevronLeft, ChevronRight } from "lucide-react";

/** HTTP(S) URL that likely points to an image */
export function looksLikeImageUrl(s) {
  if (!s || typeof s !== "string") return false;
  const t = s.trim();
  if (!/^https?:\/\//i.test(t) || t.length > 2048) return false;
  if (/\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i.test(t)) return true;
  if (/\/image\/|\/images\/|\/upload|photo|img\.|image-|damage|cloudinary|s3\.|blob\.|firebase|googleusercontent/i.test(t))
    return true;
  return false;
}

/** Normalize API values into unique image URLs */
export function parseImageUrls(value) {
  const acc = [];
  const push = (u) => {
    if (looksLikeImageUrl(u)) acc.push(u.trim());
  };

  const walk = (v) => {
    if (v == null) return;
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    if (typeof v === "object") {
      if (typeof v.url === "string") walk(v.url);
      if (typeof v.src === "string") walk(v.src);
      return;
    }
    const s = String(v).trim();
    if (!s) return;
    if ((s.startsWith("[") || s.startsWith("{")) && s.length > 1) {
      try {
        walk(JSON.parse(s));
        return;
      } catch {
        /* fall through */
      }
    }
    if (s.includes(",")) {
      s.split(",").forEach((part) => walk(part.trim()));
      return;
    }
    push(s);
  };

  walk(value);
  return [...new Set(acc)];
}

const IMAGE_ROW_KEYS = [
  "damaged_image",
  "damaged_images",
  "damage_image",
  "damage_images",
  "damage_image_url",
  "damaged_image_url",
  "image_url",
  "photo_url",
  "photo",
  "picture",
  "picture_url",
];

/** Collect image URLs from a damaged-unit / inventory row */
export function collectImageUrlsFromRecord(row) {
  if (!row || typeof row !== "object") return [];
  const acc = [];
  for (const k of IMAGE_ROW_KEYS) {
    if (row[k] != null) acc.push(...parseImageUrls(row[k]));
  }
  for (const [k, v] of Object.entries(row)) {
    if (IMAGE_ROW_KEYS.includes(k)) continue;
    const lk = k.toLowerCase();
    if (
      (/damage|damaged/i.test(lk) && /image|photo|pic|url|file|attach/i.test(lk)) ||
      (/^image|^photo|^picture/i.test(lk) && /url|path|src/i.test(lk))
    ) {
      acc.push(...parseImageUrls(v));
    }
  }
  return [...new Set(acc)];
}

/** Column is treated as image data if name hints or any row has parseable URLs */
export function isImageColumnKey(col, rows) {
  if (!col || !rows?.length) return false;
  const lc = col.toLowerCase();
  if (
    (/damage|damaged|image|photo|picture|thumbnail|attachment|upload/i.test(lc) &&
      /url|path|src|image|photo|pic|file|img/i.test(lc)) ||
    /_img$|^img_/i.test(lc)
  ) {
    return true;
  }
  return rows.some((r) => parseImageUrls(r[col]).length > 0);
}

/** Full-screen gallery; Esc / backdrop / X to close */
export function ImagePreviewLightbox({ open, urls, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(Math.min(Math.max(0, startIndex), Math.max(0, (urls?.length || 1) - 1)));
  }, [open, startIndex, urls]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min((urls?.length || 1) - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, urls?.length, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !urls?.length || typeof document === "undefined") return null;

  const safeIndex = Math.min(Math.max(0, index), urls.length - 1);
  const url = urls[safeIndex];

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/88 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white ring-1 ring-white/20 hover:bg-white/20"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="h-5 w-5" />
      </button>

      {urls.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-30 sm:left-4"
            aria-label="Previous image"
            disabled={safeIndex === 0}
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => Math.max(0, i - 1));
            }}
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-30 sm:right-4"
            aria-label="Next image"
            disabled={safeIndex >= urls.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => Math.min(urls.length - 1, i + 1));
            }}
          >
            <ChevronRight className="h-7 w-7" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {safeIndex + 1} / {urls.length}
          </p>
        </>
      ) : null}

      <img
        src={url}
        alt=""
        className="max-h-[min(92vh,920px)] max-w-[min(96vw,1200px)] select-none object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}

/** Thumbnail + Preview control; stops propagation so parent rows do not receive clicks */
export function DamageImagePreviewTrigger({ urls, onOpen, compact }) {
  if (!urls?.length) {
    return <span className="text-slate-400">—</span>;
  }
  const first = urls[0];
  return (
    <div
      className={`flex items-center ${compact ? "gap-1" : "gap-2"}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <img
        src={first}
        alt=""
        loading="lazy"
        className={`shrink-0 rounded border border-slate-200 bg-slate-100 object-cover ${compact ? "h-8 w-8" : "h-10 w-10"}`}
        onError={(e) => {
          e.target.style.visibility = "hidden";
        }}
      />
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:border-amber-300 hover:bg-amber-50/80"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(urls);
        }}
      >
        <Expand className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden />
        Preview
      </button>
      {urls.length > 1 ? (
        <span className="whitespace-nowrap text-[10px] font-medium text-slate-500">+{urls.length - 1}</span>
      ) : null}
    </div>
  );
}
