import axios from "axios";

const IRRL_UPLOAD_URL = "https://ems.binlaundry.com/irrl/upload";

/**
 * Upload images to IRRL — same flow as OrderForm handleUploadImages:
 * normalize picked files, POST multipart "images", map urls to { url, name }.
 * @param {File[]|unknown} pickedFiles
 * @returns {Promise<{ url: string, name: string }[]>}
 * @throws {Error} message "Select images first" when no usable files
 */
export async function uploadIrrlOrderImages(pickedFiles) {
  const files = Array.isArray(pickedFiles) ? pickedFiles.filter(Boolean) : [];

  if (files.length === 0) {
    throw new Error("Select images first");
  }

  const form = new FormData();
  files.forEach((file) => form.append("images", file));

  const res = await axios.post(IRRL_UPLOAD_URL, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const uploadedFiles = (res.data.urls || []).map((url, index) => ({
    url,
    name: `image_${Date.now()}_${index}`,
  }));

  return uploadedFiles;
}
