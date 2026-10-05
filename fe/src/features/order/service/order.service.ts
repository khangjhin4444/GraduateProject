import type { OrderForm } from "@/pages/HasHeader/checkout/_components/OrderForm";
import {
  PlaceOrderResponseSchema,
  PrepareOrderResponseSchema,
  type PlaceOrderResponseEntity,
  type PrepareOrderResponseEntity,
} from "../schema/order.schema";
import { privateApi } from "@/api/axios.instance";

export interface PrepareOrderProps {
  id: number;
  qty: number;
}
type PrepareOrder = (
  payload: PrepareOrderProps[],
) => Promise<PrepareOrderResponseEntity>;

export interface PlaceOrderProps extends OrderForm {
  variantIds?: number[];
  buyNow?: {
    id: number;
    qty: number;
  };
}

type PlaceOrder = (
  pyaload: PlaceOrderProps,
) => Promise<PlaceOrderResponseEntity>;

type OrderService = {
  prepareOrder: PrepareOrder;
  placeOrder: PlaceOrder;
};

export const OrderService: OrderService = {
  prepareOrder: async (payload: PrepareOrderProps[]) => {
    const response = await privateApi.request({
      method: "POST",
      url: "/api/orders/prepare",
      data: {
        items: payload,
      },
      responseSchema: PrepareOrderResponseSchema,
    });
    return response.data as PrepareOrderResponseEntity;
  },
  placeOrder: async (payload: PlaceOrderProps) => {
    const response = await privateApi.request({
      method: "POST",
      url: "/api/cart/checkout",
      data: {
        ...payload,
      },
      responseSchema: PlaceOrderResponseSchema,
    });
    return response.data as PlaceOrderResponseEntity;
  },
};
