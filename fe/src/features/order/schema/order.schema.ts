import { z } from "zod";

export const OrderProductSchema = z.object({
  VariantID: z.number(),
  Name: z.string(),
  ProductType: z.string(),
  SubType: z.string(),
  Color: z.string(),
  MainImage: z.string(),
  Price: z.string(),
  Quantity: z.number(),
});

export const PrepareOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  warnings: z.number(),
  totalQuantity: z.number(),
  subTotal: z.number(),
  items: z.array(OrderProductSchema),
});

export const PlaceOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  orderId: z.number(),
});

const OrderItemSchema = z.object({
  OrderItemID: z.number(),
  Name: z.string(),
  Color: z.string(),
  MainImage: z.string(),
  Quantity: z.number(),
  Price: z.union([z.string(), z.number()]),
  ProductType: z.string(),
  SubType: z.string(),
});

const OrderSchema = z.object({
  OrderID: z.number(),
  UserID: z.number(),
  Date: z.string(),
  Shipping: z.string(),
  Status: z.string(),
  Payment: z.string(),
  ReceiverName: z.string(),
  Phone: z.string(),
  Address: z.string(),
  Total: z.union([z.string(), z.number()]),
  Request: z.string().nullable(),
  items: z.array(OrderItemSchema),
});

export const GetOrdersResponseSchema = z.object({
  success: z.boolean(),
  page: z.number(),
  limit: z.number(),
  hasNextPage: z.boolean(),
  nextPage: z.number().nullable(),
  length: z.number(),
  data: z.array(OrderSchema),
});

export const CancelOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type CancelOrderResponseEntity = z.infer<
  typeof CancelOrderResponseSchema
>;

export type OrderEntity = z.infer<typeof OrderSchema>;
export type OrderItemEntity = z.infer<typeof OrderItemSchema>;

export type PlaceOrderResponseEntity = z.infer<typeof PlaceOrderResponseSchema>;

export type PrepareOrderResponseEntity = z.infer<
  typeof PrepareOrderResponseSchema
>;
export type OrderProdudctEntity = z.infer<typeof OrderProductSchema>;
export type GetOrdersResponseEntity = z.infer<typeof GetOrdersResponseSchema>;
