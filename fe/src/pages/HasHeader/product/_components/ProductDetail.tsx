// import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import {
  type RelevantProductEntity,
  type VariantEntity,
} from "@/features/product/schema/product.schema";
import { useMutation, useQuery } from "@tanstack/react-query";

import React, { useState } from "react";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { updateCartQuantity } from "@/state/profile/profileSlice";
import { useParams } from "react-router";
import useProductDetail from "@/hooks/useProductDetail";
import { Blocks, config, customRender } from "@/shared/components/BlockRender";
import { ProductDescription } from "@/mock/productDescription";
import Quantity from "./Quantity";
import useRelevant from "@/hooks/useRelevant";
import { RelevantProductCard } from "./RelevantProductCard";
import ProductSkeleton from "@/shared/components/ProductSkeleton";
export default function Page() {
  const cartQuantity = useAppSelector((state) => state.profile.cartQuantity);
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const { data } = useProductDetail(Number(id!));
  const productData = data.data;
  const { data: relevantData, isLoading: isRelevantLoading } = useRelevant({
    type: productData.ProductType,
    id: productData.ProductID,
  });
  const relevantProducts = relevantData?.data || [];

  const [selectedVariant, setSelectedVariant] = useState<VariantEntity | null>(
    null,
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [zoom, setZoom] = useState({ show: false, x: 0, y: 0 });

  const defaultVariant =
    productData?.variants.find((v: VariantEntity) => v.Stock > 0) ||
    productData?.variants[0];

  const activeVariant = selectedVariant || defaultVariant;
  const mainImage =
    selectedImage || activeVariant?.MainImage || productData?.images[0];
  const variantImages = productData.variants.map(
    (variant) => variant.MainImage,
  );
  const productImages = variantImages.concat(productData.images);
  // const addToCartMutation = useMutation({
  //   mutationFn: async (payload: { VariantID: number; Quantity: number }) => {
  //     return CartUsecase.addToCart(payload); // Trả kết quả về cho onSuccess xử lý
  //   },
  //   onMutate: async (payload) => {
  //     const previousCartQuantity = cartQuantity;
  //     const optimisticQuantiy = Number(previousCartQuantity) + payload.Quantity;
  //     dispatch(updateQuantity(optimisticQuantiy));
  //     return { previousCartQuantity };
  //   },
  //   onError: async (err, payload, contex) => {
  //     if (contex?.previousCartQuantity !== undefined) {
  //       dispatch(updateQuantity(contex.previousCartQuantity));
  //     }
  //     throw new Error(err.message || "Error when add to cart");
  //   },
  //   onSuccess: async (data) => {
  //     dispatch(updateQuantity(data.newQuantity!));
  //   },
  // });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoom({ show: true, x, y });
  };

  const handleVariantClick = (variant: VariantEntity) => {
    setSelectedVariant(variant);
    setSelectedImage(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + "VND";
  };

  const handleAddToCart = async () => {
    if (!activeVariant) {
      toast("Choose a variant");
      return;
    }

    const qty = Number(quantity);

    if (isNaN(qty) || qty < 1) {
      setQuantity(1); // Ép về 1
      return;
    }
    // const addToCartPromise = addToCartMutation.mutateAsync({
    //   VariantID: activeVariant.VariantID,
    //   Quantity: qty,
    // });

    // toast.promise(addToCartPromise, {
    //   loading: "Adding to Cart...",
    //   success: (data) => {
    //     return data.message;
    //   },
    //   error: (err) => {
    //     return err.message;
    //   },
    // });
  };

  const handleBuyNow = () => {
    if (!activeVariant) {
      toast.error("Choose a variant");
      return;
    }

    const qty = Number(quantity);

    if (isNaN(qty) || qty < 1) {
      setQuantity(1); // Ép về 1
      return;
    }

    const buyNowItem = {
      VariantID: activeVariant.VariantID,
      Quantity: qty,
      Price: activeVariant.Price,
      Name: productData.Name,
      Color: activeVariant.Color,
      MainImage: activeVariant.MainImage,
      Stock: activeVariant.Stock,
      CartItemID: -1, // Not in cart
    };

    sessionStorage.setItem("buy_now_session", JSON.stringify([buyNowItem]));
    // router.push("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans">
      <section className="flex flex-col md:flex-row gap-10">
        <div className="md:w-1/2 p-3 md:p-0">
          <div className="flex flex-col items-center justify-center">
            <div className="w-full h-125 bg-gray-100 rounded-lg overflow-hidden mb-4">
              <div
                className="relative w-full h-full border-2 border-border rounded-xl overflow-hidden bg-gray-50 cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setZoom({ show: false, x: 0, y: 0 })}
              >
                <img
                  src={mainImage!}
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
              {productImages.map((img, index) => (
                <div
                  key={index}
                  className="snap-start shrink-0"
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index}`}
                    className={`w-20 h-20 md:w-24 md:h-24 object-cover rounded-md cursor-pointer border-2 transition-all ${
                      mainImage === img
                        ? "border-primary opacity-100"
                        : "border-transparent opacity-60 hover:opacity-100 hover:border-gray-300"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:w-1/2 text-left">
          <h1 className="text-4xl font-bold mb-4 text-foreground tracking-tight">
            {productData.Name}
          </h1>
          <h2 className="text-3xl text-accent font-extrabold mb-6 tracking-normal">
            {formatCurrency(activeVariant?.Price || 0)}
          </h2>

          {productData.variants.length > 0 && (
            <div className="mb-8">
              <div className="text-2xl mb-4 flex items-center gap-4 font-semibold">
                Variants:
                <span className="text-xl text-muted-foreground">
                  Stock: {activeVariant?.Stock || 0}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {productData.variants.map((variant, index) => (
                  <button
                    key={index}
                    disabled={variant.Stock <= 0}
                    onClick={() => handleVariantClick(variant)}
                    className={`px-4 py-2 w-32 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      activeVariant?.VariantID === variant.VariantID
                        ? "border-primary bg-blue-50 text-primary font-bold"
                        : "border-border text-foreground hover:border-gray-400"
                    }`}
                  >
                    {variant.Color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Quantity
            quantity={quantity}
            currentStock={activeVariant?.Stock!}
            setQuantity={setQuantity}
          />

          {/* Nút hành động */}
          <div className="flex flex-col xl:flex-row gap-4">
            <button
              onClick={() => handleAddToCart()}
              className="px-8 py-4 flex-1 rounded-lg font-bold cursor-pointer text-xl group relative isolate overflow-hidden bg-background border-primary border-2 text-primary hover:bg-background hover:text-primary-foreground before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-primary before:transition-transform before:duration-300 before:ease-out hover:before:scale-x-100"
            >
              ADD TO CART
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 cursor-pointer bg-foreground text-primary-foreground px-8 py-4 rounded-lg font-bold text-xl hover:bg-primary transition-all"
            >
              BUY NOW
            </button>
          </div>
        </div>
      </section>

      <section className="mt-20 px-5">
        <div className="text-xl md:text-2xl lg:text-3xl font-semibold mb-4 flex justify-center items-center w-full">
          Product Information
        </div>
        <div className="w-full mt-10">
          <Blocks
            data={ProductDescription}
            config={config}
            renderers={customRender}
          ></Blocks>
        </div>

        <div>
          <h3 className="text-xl md:text-2xl lg:text-3xl font-bold my-6">
            Relevant Products
          </h3>

          <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-3 px-4 mb-12">
            {isRelevantLoading && <ProductSkeleton></ProductSkeleton>}

            {relevantProducts && relevantProducts.length > 0
              ? relevantProducts.map((relProduct: RelevantProductEntity) => (
                  <RelevantProductCard
                    key={relProduct.ProductID}
                    product={relProduct}
                    type={productData.ProductType}
                  ></RelevantProductCard>
                ))
              : // Nếu fetch xong mà mảng rỗng (không có SP liên quan)
                !isRelevantLoading && (
                  <div className="text-gray-500 italic">
                    No relevant products found.
                  </div>
                )}
          </div>
        </div>
      </section>
    </div>
  );
}
