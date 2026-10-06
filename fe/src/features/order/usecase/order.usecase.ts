import { OrderService, type PlaceOrderProps } from "../service/order.service";

export const OrderUsecase = {
  getOrders: (params: { status: string; page: number }) =>
    OrderService.getOrders(params),
  prepareOrder: (payload: { id: number; qty: number }[]) =>
    OrderService.prepareOrder(payload),
  placeOrder: (payload: PlaceOrderProps) => OrderService.placeOrder(payload),
  cancelOrder: (orderId: number) => OrderService.cancelOrder(orderId),
};
