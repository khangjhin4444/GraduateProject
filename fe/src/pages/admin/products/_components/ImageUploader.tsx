"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { Save } from "lucide-react";

export function ImageUploader({
  setVariants,
  idx,
}: {
  setVariants: any;
  idx: number;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setVariants((prev: any[]) =>
        prev.map((x, i) => (i === idx ? { ...x, file: file } : x)),
      );
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-sm p-4 border rounded-lg bg-white shadow-sm">
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="cursor-pointer"
      />

      {/* Khu vực hiển thị ảnh xem trước (Preview) */}
      {previewUrl && (
        <div className="relative w-full h-48 border rounded-md overflow-hidden bg-gray-50">
          <Image
            src={previewUrl}
            alt="Preview"
            fill
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
}
