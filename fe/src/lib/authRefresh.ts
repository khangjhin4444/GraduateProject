import { store } from "@/state/store";
import { authApi } from "@/api/axios.instance";
import type { LoginResponseEntity } from "@/features/auth/schema/auth.schema";
import { deleteToken, setToken } from "@/state/token/tokenSlice";
import { deleteInfo, setInfo } from "@/state/profile/profileSlice";

let refreshPromise: Promise<{
  success: boolean;
  expiredSession: boolean;
  shouldLogin: boolean;
}> | null = null;

export function refreshAuth(): Promise<{
  success: boolean;
  expiredSession: boolean;
  shouldLogin: boolean;
}> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = authApi
    .post<LoginResponseEntity>(
      "/api/auth/refresh",
      {},
      { withCredentials: true },
    )
    .then((response) => {
      const data = response.data;
      store.dispatch(setToken(data.accessToken));
      store.dispatch(
        setInfo({
          id: data.user.id,
          cartQuantity: Number(data.user.cartQuantity),
          fullName: data.user.Name,
          phoneNumber: data.user.Phone,
          address: data.user.Address,
          role: data.user.role,
        }),
      );
      return { success: true, expiredSession: false, shouldLogin: false };
    })
    .catch((error) => {
      console.log(error);
      const status = error?.response?.status;
      if (status === 401) {
        return { success: false, expiredSession: false, shouldLogin: true };
      }
      if (status === 409 || status === 503 || !error?.response) {
        return { success: false, expiredSession: false, shouldLogin: false };
      }
      store.dispatch(deleteInfo());
      store.dispatch(deleteToken());
      return {
        success: false,
        expiredSession: status === 403,
        shouldLogin: status === 403,
      };
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
