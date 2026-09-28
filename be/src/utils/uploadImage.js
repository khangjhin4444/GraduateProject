const MAX_FILE_SIZE = 32 * 1024 * 1024; // 32MB

/**
 * Upload a single image buffer to ImgBB.
 * @param {Buffer} buffer - The image file buffer
 * @param {string} filename - Original filename (for FormData)
 * @returns {Promise<string>} The uploaded image URL
 */
async function uploadToImgBB(buffer, filename) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("Server misconfiguration: Missing IMGBB_API_KEY");
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `File "${filename}" exceeds the 32MB size limit (${(buffer.length / (1024 * 1024)).toFixed(1)}MB)`,
    );
  }

  const base64Image = buffer.toString("base64");

  const formData = new URLSearchParams();
  formData.append("key", apiKey);
  formData.append("image", base64Image);
  formData.append("name", filename);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(
      `ImgBB upload failed for "${filename}": ${data.error?.message || "Unknown error"}`,
    );
  }

  return data.data.url;
}

/**
 * Upload multiple image buffers to ImgBB in parallel.
 * @param {Array<{buffer: Buffer, originalname: string}>} files - Array of multer file objects
 * @returns {Promise<string[]>} Array of uploaded image URLs
 */
async function uploadMultipleToImgBB(files) {
  if (!files || files.length === 0) return [];

  const results = await Promise.all(
    files.map((file) => uploadToImgBB(file.buffer, file.originalname)),
  );
  return results;
}

module.exports = { uploadToImgBB, uploadMultipleToImgBB };
