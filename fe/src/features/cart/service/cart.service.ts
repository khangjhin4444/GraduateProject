import { privateApi } from "@/api/axios.instance";
import type { AddToCartResponseEntity } from "../schema/cart.schema";

type AddToCart = ({
  variantId,
  quantity,
}: {
  variantId: number;
  quantity: number;
}) => Promise<AddToCartResponseEntity>;

type CartService = {
  addToCart: AddToCart;
};

export const CartService: CartService = {
  addToCart: async ({
    variantId,
    quantity,
  }: {
    variantId: number;
    quantity: number;
  }) => {
    const response = await privateApi.request({
      method: "POST",
      url: "/api/cart/add",
      data: {
        VariantID: variantId,
        Quantity: quantity,
      },
    });
    return response.data as AddToCartResponseEntity;
  },
};
