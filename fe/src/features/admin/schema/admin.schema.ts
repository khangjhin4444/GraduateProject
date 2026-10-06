import { z } from "zod";
const EditorBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export const EditorDataSchema = z.object({
  time: z.number().optional(),
  blocks: z.array(EditorBlockSchema).min(1, {
    message: "Please enter a product description",
  }),
  version: z.string().optional(),
});
export const AdminProductSchema = z.object({
  ProductID: z.number(),
  VariantID: z.number(),
  Name: z.string(),
  Description: EditorDataSchema,
  ProductType: z.string(),
  SubType: z.string(),
  Color: z.string(),
  Price: z.number(),
  Stock: z.number(),
  MainImage: z.string(),
  ExtraImages: z.array(z.string()),
});

const AdminProductVariantSchema = z.object({
  VariantID: z.number(),
  Color: z.string(),
  Price: z.number(),
  Stock: z.number(),
  MainImage: z.string(),
});

const RawAdminProductSchema = z.object({
  ProductID: z.number(),
  Name: z.string(),
  Description: EditorDataSchema,
  ProductType: z.string(),
  SubType: z.string(),
  variants: z.array(AdminProductVariantSchema),
  images: z.array(z.string()),
});

const RawAdminProductResponseSchema = z.object({
  success: z.boolean(),
  page: z.number(),
  limit: z.number(),
  hasNextPage: z.boolean(),
  nextPage: z.number().nullable(),
  data: z.array(RawAdminProductSchema),
});

export const AdminProductResponseSchema =
  RawAdminProductResponseSchema.transform((response) => ({
    ...response,
    data: response.data.flatMap((product) =>
      product.variants.map((variant) => ({
        ProductID: product.ProductID,
        VariantID: variant.VariantID,
        Name: product.Name,
        Description: product.Description,
        ProductType: product.ProductType,
        SubType: product.SubType,
        Color: variant.Color,
        Price: variant.Price,
        Stock: variant.Stock,
        MainImage: variant.MainImage,
        ExtraImages: product.images,
      })),
    ),
  }));

export const AddProductAdminResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const EditProductAdminResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const DeleteProductAdminResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
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

export const GetAdminOrdersResponseSchema = z.object({
  success: z.boolean(),
  page: z.number(),
  limit: z.number(),
  hasNextPage: z.boolean(),
  nextPage: z.number().nullable(),
  length: z.number(),
  data: z.array(OrderSchema),
});

export const AdminCancelOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const AdminProceedOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type AdminProceedOrderResponseEntity = z.infer<
  typeof AdminCancelOrderResponseSchema
>;

export const AdminDeliverOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type AdminDeliverOrderResponseEntity = z.infer<
  typeof AdminCancelOrderResponseSchema
>;

export type AdminCancelOrderResponseEntity = z.infer<
  typeof AdminCancelOrderResponseSchema
>;

export type GetAdminOrdersResponseEntity = z.infer<
  typeof GetAdminOrdersResponseSchema
>;
export type OrderEntity = z.infer<typeof OrderSchema>;
export type OrderItemEntity = z.infer<typeof OrderItemSchema>;
export type DeleteProductAdminResponseEntity = z.infer<
  typeof DeleteProductAdminResponseSchema
>;

export type AddProductAdminResponseEntity = z.infer<
  typeof AddProductAdminResponseSchema
>;

export type EditProductAdminResponseEntity = z.infer<
  typeof EditProductAdminResponseSchema
>;

export type AdminProductResponseEntity = z.infer<
  typeof AdminProductResponseSchema
>;
export type AdminProductEntity = z.infer<typeof AdminProductSchema>;
