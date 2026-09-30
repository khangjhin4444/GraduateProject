import { privateApi } from "@/api/axios.instance";
import {
  ChangeItemQuantityResponseSchema,
  DeleteCartItemResponseSchema,
  GetCartResponseSchema,
  type AddToCartResponseEntity,
  type ChangeItemQuantityResponseEntity,
  type DeleteCartItemResponseEntity,
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

type ChangeItemQuantity = ({
  variantId,
  quantity,
}: {
  variantId: number;
  quantity: number;
}) => Promise<ChangeItemQuantityResponseEntity>;

type DeleteCartItem = ({
  variantId,
}: {
  variantId: number;
}) => Promise<DeleteCartItemResponseEntity>;

type CartService = {
  addToCart: AddToCart;
  getCart: GetCart;
  changeItemQuantity: ChangeItemQuantity;
  deleteCartItem: DeleteCartItem;
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
  changeItemQuantity: async ({
    variantId,
    quantity,
  }: {
    variantId: number;
    quantity: number;
  }) => {
    const response = await privateApi.request({
      method: "PUT",
      url: "/api/cart/change",
      data: {
        VariantID: variantId,
        Quantity: quantity,
      },
      responseSchema: ChangeItemQuantityResponseSchema,
    });
    return response.data as ChangeItemQuantityResponseEntity;
  },
  deleteCartItem: async ({ variantId }: { variantId: number }) => {
    const response = await privateApi.request({
      method: "DELETE",
      url: "/api/cart/delete",
      data: {
        VariantID: variantId,
      },
      responseSchema: DeleteCartItemResponseSchema,
    });

    return response.data as DeleteCartItemResponseEntity;
  },
};
