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

const MAX_CONCURRENT_REFRESH_RETRIES = 2;
const REFRESH_RETRY_DELAY_MS = 100;

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const getErrorStatus = (error: unknown) => {
  if (typeof error !== "object" || error === null) return undefined;

  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === "number" ? response.status : undefined;
};

async function requestRefresh(attempt = 0): Promise<LoginResponseEntity> {
  try {
    return (
      await authApi.post<LoginResponseEntity>(
        "/api/auth/refresh",
        {},
        { withCredentials: true },
      )
    ).data;
  } catch (error) {
    const status = getErrorStatus(error);
    if (status === 409 && attempt < MAX_CONCURRENT_REFRESH_RETRIES) {
      await wait(REFRESH_RETRY_DELAY_MS * (attempt + 1));
      return requestRefresh(attempt + 1);
    }

    throw error;
  }
}

export function refreshAuth(): Promise<{
  success: boolean;
  expiredSession: boolean;
  shouldLogin: boolean;
}> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = requestRefresh()
    .then((data) => {
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
      const status = getErrorStatus(error);
      if (status === 401) {
        return { success: false, expiredSession: false, shouldLogin: true };
      }
      if (status === 409 || status === 503 || status === undefined) {
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
