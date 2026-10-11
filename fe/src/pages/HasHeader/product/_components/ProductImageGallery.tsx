import { useState, type MouseEvent } from "react";

interface ProductImageGalleryProps {
  mainImage: string;
  images: string[];
  onImageSelect: (image: string) => void;
}

export default function ProductImageGallery({
  mainImage,
  images,
  onImageSelect,
}: ProductImageGalleryProps) {
  const [zoom, setZoom] = useState({ show: false, x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoom({ show: true, x, y });
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full h-125 bg-gray-100 rounded-lg overflow-hidden mb-4">
        <div
          className="relative w-full h-full border-2 border-border rounded-xl overflow-hidden bg-gray-50 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setZoom({ show: false, x: 0, y: 0 })}
        >
          <img
            src={mainImage}
            alt="Main Product"
            className={`w-full h-full object-fill transition-opacity duration-600 ${
              zoom.show ? "opacity-80" : "opacity-100"
            }`}
          />

          {zoom.show && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${mainImage})`,
                backgroundSize: "200%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: `${zoom.x}% ${zoom.y}%`,
              }}
            />
          )}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto w-full py-2 px-1 scrollbar-hide snap-x justify-center">
        {images.map((image, index) => (
          <div
            key={index}
            className="snap-start shrink-0"
            onClick={() => onImageSelect(image)}
          >
            <img
              src={image}
              alt={`Thumbnail ${index}`}
              className={`w-20 h-20 md:w-24 md:h-24 object-cover rounded-md cursor-pointer border-2 transition-all ${
                mainImage === image
                  ? "border-primary opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100 hover:border-gray-300"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
