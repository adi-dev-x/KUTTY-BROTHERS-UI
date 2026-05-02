import axios from "axios";

const IRRL_ORIGIN = "https://ems.binlaundry.com";
const IRRL_UPLOAD_URL = `${IRRL_ORIGIN}/irrl/upload`;

function normalizeIrrlPublicUrl(pathOrUrl) {
  const s = String(pathOrUrl ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${IRRL_ORIGIN}${path}`;
}

/**
 * IRRL POST /irrl/upload may return urls in several shapes.
 * @param {object|unknown} resData - axios res.data
 * @returns {string[]}
 */
export function extractUrlsFromIrrlUploadResponse(resData) {
  if (resData == null) return [];
  if (typeof resData === "string" && resData.trim()) {
    return [normalizeIrrlPublicUrl(resData)];
  }
  const root = typeof resData === "object" && !Array.isArray(resData) && resData.data !== undefined ? resData.data : resData;
  if (root == null) return [];
  if (Array.isArray(root) && root.length && typeof root[0] === "string") {
    return root.map((u) => normalizeIrrlPublicUrl(u)).filter(Boolean);
  }
  if (typeof root !== "object") return [];

  if (Array.isArray(root.urls) && root.urls.length) {
    return root.urls.map((u) => normalizeIrrlPublicUrl(u)).filter(Boolean);
  }
  if (typeof root.url === "string" && root.url.trim()) {
    return [normalizeIrrlPublicUrl(root.url)];
  }
  if (typeof root.filePath === "string" && root.filePath.trim()) {
    return [normalizeIrrlPublicUrl(root.filePath)];
  }
  if (Array.isArray(root.data) && root.data.length) {
    return root.data
      .map((x) => (typeof x === "string" ? x : x?.url || x?.filePath || ""))
      .map((u) => normalizeIrrlPublicUrl(u))
      .filter(Boolean);
  }
  return [];
}

function toFileArray(pickedFiles) {
  if (pickedFiles == null) return [];
  if (Array.isArray(pickedFiles)) return pickedFiles.filter((f) => f && (f instanceof File || f instanceof Blob));
  if (typeof pickedFiles.length === "number" && typeof pickedFiles.item === "function") {
    return Array.from(pickedFiles).filter(Boolean);
  }
  return [];
}

/**
 * Upload images to IRRL — same flow as OrderForm handleUploadImages:
 * normalize picked files, POST multipart "images", map urls to { url, name }.
 * @param {File[]|FileList|unknown} pickedFiles
 * @returns {Promise<{ url: string, name: string }[]>}
 * @throws {Error} message "Select images first" when no usable files, or "No image URLs in response" when server returns nothing usable
 */
export async function uploadIrrlOrderImages(pickedFiles) {
  const files = toFileArray(pickedFiles);

  if (files.length === 0) {
    throw new Error("Select images first");
  }

  const form = new FormData();
  files.forEach((file) => form.append("images", file));

  const res = await axios.post(IRRL_UPLOAD_URL, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const urls = extractUrlsFromIrrlUploadResponse(res.data);
  if (urls.length === 0) {
    const err = new Error("No image URLs in response");
    err.response = res;
    throw err;
  }

  return urls.map((url, index) => ({
    url,
    name: `image_${Date.now()}_${index}`,
  }));
}
