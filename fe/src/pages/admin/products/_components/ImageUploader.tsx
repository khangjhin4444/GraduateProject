import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export function ImageUploader({
  onFileChange,
  value,
}: {
  onFileChange: (file: File) => void;
  value?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  return (
    <div className="flex flex-col gap-4 max-w-3xs p-4 border rounded-lg bg-white shadow-sm">
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="cursor-pointer"
      />

      {previewUrl && (
        <div className="relative w-full h-full border rounded-md overflow-hidden bg-gray-50">
          <img src={previewUrl} alt="Preview" className="object-contain" />
        </div>
      )}
    </div>
  );
}
