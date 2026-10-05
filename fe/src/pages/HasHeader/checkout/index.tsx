import { Navigate, useLocation } from "react-router";
import type { PrepareOrderProps } from "@/features/order/service/order.service";
import CheckoutPage from "./_components/CheckoutPage";

export default function Page() {
  const location = useLocation();
  const checkoutItems: PrepareOrderProps[] =
    location.state?.checkoutItems || [];
  const isBuyNow = location.state?.isBuyNow || false;
  if (checkoutItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return <CheckoutPage checkoutItems={checkoutItems} isBuyNow={isBuyNow} />;
}
