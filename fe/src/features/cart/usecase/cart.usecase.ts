import { CartService } from "../service/cart.service";

export const CartUsecase = {
  addToCart: ({
    variantId,
    quantity,
  }: {
    variantId: number;
    quantity: number;
  }) => CartService.addToCart({ variantId, quantity }),
  getCart: () => CartService.getCart(),
};
