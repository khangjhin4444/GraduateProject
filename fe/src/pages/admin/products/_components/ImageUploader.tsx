import { useState } from "react";
import { Input } from "@/components/ui/input";

export function ImageUploader({
  onFileChange,
  idx,
}: {
  onFileChange: (file: File) => void;
  idx: number;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div
      className="flex flex-col gap-4 max-w-sm p-4 border rounded-lg bg-white shadow-sm"
      key={idx}
    >
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="cursor-pointer"
      />

      {/* Khu vực hiển thị ảnh xem trước (Preview) */}
      {previewUrl && (
        <div className="relative w-full h-48 border rounded-md overflow-hidden bg-gray-50">
          <img src={previewUrl} alt="Preview" className="object-contain" />
        </div>
      )}
    </div>
  );
}
