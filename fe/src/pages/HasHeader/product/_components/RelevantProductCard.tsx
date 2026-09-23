import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type RelevantProductEntity } from "@/features/product/schema/product.schema";
import { useNavigate } from "react-router";
import { Dot } from "lucide-react";
import { formatSubtype } from "@/utils/formatSubtype";

export function RelevantProductCard({
  product,
  type,
}: {
  product: RelevantProductEntity;
  type: string;
}) {
  const formatter = new Intl.NumberFormat("vi-VN");
  const navigate = useNavigate();

  // Hàm chuyển hướng
  const navigateToDetail = () => {
    navigate(`/product/${product.ProductID}`);
  };

  return (
    <Card
      key={product.ProductID}
      className="bg-card text-card-foreground relative mx-auto transition-all duration-300 hover:scale-[1.01] hover:shadow-xl w-full max-w-sm pt-0 flex flex-col justify-between overflow-hidden border-2 border-gray-300 select-none"
    >
      <div
        className="relative z-10 aspect-square cursor-pointer bg-gray-50"
        onClick={navigateToDetail}
      >
        <img
          src={product.MainImage}
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
          {formatSubtype(type)}
        </div>

        <div className="border-t-2 w-full flex items-center pt-2">
          <div className="flex flex-col flex-1">
            <p>Price</p>
            <p className="text-lg font-semibold text-foreground">
              {formatter.format(Number(product.Price))} VND
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
