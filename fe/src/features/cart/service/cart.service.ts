import { privateApi } from "@/api/axios.instance";
import {
  GetCartResponseSchema,
  type AddToCartResponseEntity,
  type GetCartResponseEntity,
} from "../schema/cart.schema";

type AddToCart = ({
  variantId,
  quantity,
}: {
  variantId: number;
  quantity: number;
}) => Promise<AddToCartResponseEntity>;

type GetCart = () => Promise<GetCartResponseEntity>;

type CartService = {
  addToCart: AddToCart;
  getCart: GetCart;
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
  getCart: async () => {
    const response = await privateApi.request({
      method: "GET",
      url: "/api/cart",
      responseSchema: GetCartResponseSchema,
    });
    return response.data as GetCartResponseEntity;
  },
};
