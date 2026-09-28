"use server";

export async function uploadImageToImgBB(formData: FormData) {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ImgBB API Key");
  }

  const url = `https://api.imgbb.com/1/upload?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Upload failed", error);
    throw new Error("Image upload failed");
  }
}
