import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clsx } from "clsx";
import { getHexColor } from "@/utils/colors";
import {
  type ProductEntity,
  type SimpleVariant,
} from "@/features/product/schema/product.schema";
import { useNavigate } from "react-router";
import { Dot } from "lucide-react";

export function ProductCard({ product }: { product: ProductEntity }) {
  const formatter = new Intl.NumberFormat("vi-VN");
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<SimpleVariant | null>(
    product.variants && product.variants.length > 0
      ? product.variants[0]
      : null,
  );

  // Dữ liệu hiển thị thực tế (Ưu tiên variant đang chọn, nếu không có thì lấy dữ liệu gốc của product)
  const displayImage = selectedVariant
    ? selectedVariant.image
    : product.MainImage;
  const displayPrice = selectedVariant ? selectedVariant.price : product.Price;

  // Hàm chuyển hướng
  const navigateToDetail = () => {
    navigate(`/product/${product.ProductID}`);
  };

  return (
    <Card className="relative mx-auto transition-all duration-300 hover:scale-[1.01] hover:shadow-xl w-full max-w-sm pt-0 flex flex-col justify-between overflow-hidden border-2 border-gray-300 select-none">
      <div
        className="relative z-10 aspect-square cursor-pointer bg-gray-50"
        onClick={navigateToDetail}
      >
        <img
          src={displayImage}
          alt={product.Name}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
      </div>

      <CardHeader className="relative z-20 flex flex-col flex-1">
        <div
          className="line-clamp-1 cursor-pointer font-bold text-lg hover:text-primary transition-colors"
          onClick={navigateToDetail}
        >
          {product.Name}
        </div>
        <div className="flex text-sm text-muted-foreground font-normal items-center">
          {product.ProductType} <Dot />{" "}
          {product.SubType === "75%" ? "75% or less" : product.SubType}
        </div>
        {product.variants && product.variants.length > 0 && (
          <div className="flex justify-center items-center gap-2 min-h-8">
            {product.variants.map((variant, index) => {
              const isSelected =
                selectedVariant?.colorText === variant.colorText;

              return (
                <button
                  key={`${product.ProductID}-${index}`}
                  title={variant.colorText} // Tooltip hiện tên màu khi hover
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài thẻ Card
                    setSelectedVariant(variant);
                  }}
                  className={clsx(
                    "w-6 h-6 rounded-full border border-gray-300 transition-all",
                    isSelected
                      ? "ring-2 ring-black ring-offset-2 scale-100"
                      : "hover:scale-110 opacity-80 hover:opacity-100",
                  )}
                  style={{
                    backgroundColor: getHexColor(variant.colorText),
                  }}
                />
              );
            })}
          </div>
        )}

        <div className="border-t-2 w-full flex items-center pt-2">
          <div className="flex flex-col flex-1">
            <p>Price</p>
            <p className="text-lg font-semibold text-foreground">
              {formatter.format(Number(displayPrice))} VND
            </p>
          </div>
          <Button
            className="cursor-pointer  bg-foreground hover:bg-primary "
            onClick={(e) => {
              e.stopPropagation();
              navigateToDetail();
            }}
          >
            View More
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
