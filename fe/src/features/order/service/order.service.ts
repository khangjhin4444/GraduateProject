import type { OrderForm } from "@/pages/HasHeader/checkout/_components/OrderForm";
import {
  PlaceOrderResponseSchema,
  PrepareOrderResponseSchema,
  GetOrdersResponseSchema,
  type GetOrdersResponseEntity,
  type PlaceOrderResponseEntity,
  type PrepareOrderResponseEntity,
  type CancelOrderResponseEntity,
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
type GetOrders = (params: {
  status: string;
  page: number;
}) => Promise<GetOrdersResponseEntity>;

type CanceleOrder = (orderId: number) => Promise<CancelOrderResponseEntity>;

type OrderService = {
  prepareOrder: PrepareOrder;
  placeOrder: PlaceOrder;
  getOrders: GetOrders;
  cancelOrder: CanceleOrder;
};

export const OrderService: OrderService = {
  getOrders: async ({ status, page }) => {
    const response = await privateApi.request({
      method: "GET",
      url: "/api/orders",
      params: { status, page },
      responseSchema: GetOrdersResponseSchema,
    });
    return response.data as GetOrdersResponseEntity;
  },
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
  cancelOrder: async (orderId: number) => {
    const response = await privateApi.request({
      method: "PUT",
      url: "/api/orders/cancel",
      data: {
        orderID: orderId,
      },
    });
    return response.data as CancelOrderResponseEntity;
  },
};
