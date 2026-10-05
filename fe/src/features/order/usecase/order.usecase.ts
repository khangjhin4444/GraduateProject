import { OrderService, type PlaceOrderProps } from "../service/order.service";

export const OrderUsecase = {
  prepareOrder: (payload: { id: number; qty: number }[]) =>
    OrderService.prepareOrder(payload),
  placeOrder: (payload: PlaceOrderProps) => OrderService.placeOrder(payload),
};
