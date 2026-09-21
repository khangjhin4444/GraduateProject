import { ProductService } from "../service/product.service";

export const ProductUsecase = {
  getProductDetail: async (id: number) => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return ProductService.getProductById(id);
  },
};
