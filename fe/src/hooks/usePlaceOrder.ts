import type { PlaceOrderProps } from "@/features/order/service/order.service";
import { OrderUsecase } from "@/features/order/usecase/order.usecase";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { setInfo } from "@/state/profile/profileSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export const usePlaceOrder = () => {
  const queryClient = useQueryClient();
  const info = useAppSelector((state) => state.profile);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const placeOrderMutation = useMutation({
    mutationFn: (payload: PlaceOrderProps) => OrderUsecase.placeOrder(payload),
    onMutate: () => {
      const toastId = toast.loading("Placing Order...");
      return { toastId };
    },
    onError: (error, _, context) => {
      if (error instanceof AxiosError && error.response?.data?.message) {
        toast.error(error.response.data.message, { id: context?.toastId });
      } else {
        toast.error(error.message, { id: context?.toastId });
      }
    },
    onSuccess: (data, _, context) => {
      toast.success("Order Placed!", { id: context?.toastId });
      if (data.newAddress) {
        dispatch(
          setInfo({
            ...info,
            street: data.newAddress.street,
            provinceName: data.newAddress.provinceName,
            wardName: data.newAddress.wardName,
          }),
        );
      }
      queryClient.invalidateQueries({ queryKey: ["orders", "Pending"] });
      navigate("/order", { replace: true });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
  return { placeOrderMutation };
};
