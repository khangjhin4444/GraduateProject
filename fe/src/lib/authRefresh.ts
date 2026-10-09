import { store } from "@/state/store";
import { authApi } from "@/api/axios.instance";
import type { LoginResponseEntity } from "@/features/auth/schema/auth.schema";
import { deleteToken, setToken } from "@/state/token/tokenSlice";
import { deleteInfo, setInfo } from "@/state/profile/profileSlice";
import {
  getAuthOperationVersion,
  isAuthOperationCurrent,
  isLogoutInProgress,
} from "@/lib/authLifecycle";

type RefreshResult = {
  success: boolean;
  expiredSession: boolean;
  shouldLogin: boolean;
};

let refreshPromise: Promise<RefreshResult> | null = null;
let refreshPromiseVersion: number | null = null;

const cancelledRefreshResult = (): RefreshResult => ({
  success: false,
  expiredSession: false,
  shouldLogin: isLogoutInProgress(),
});

const MAX_CONCURRENT_REFRESH_RETRIES = 5;
const REFRESH_RETRY_DELAY_MS = 200;

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const getErrorStatus = (error: unknown) => {
  if (typeof error !== "object" || error === null) return undefined;

  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === "number" ? response.status : undefined;
};

async function requestRefresh(
  operationVersion: number,
  attempt = 0,
): Promise<LoginResponseEntity> {
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
      if (!isAuthOperationCurrent(operationVersion)) {
        throw error;
      }
      return requestRefresh(operationVersion, attempt + 1);
    }

    throw error;
  }
}

export function refreshAuth(): Promise<RefreshResult> {
  if (isLogoutInProgress()) {
    return Promise.resolve(cancelledRefreshResult());
  }

  const operationVersion = getAuthOperationVersion();
  if (refreshPromise && refreshPromiseVersion === operationVersion) {
    return refreshPromise;
  }

  const currentPromise = requestRefresh(operationVersion)
    .then((data) => {
      if (!isAuthOperationCurrent(operationVersion)) {
        return cancelledRefreshResult();
      }

      store.dispatch(setToken(data.accessToken));
      store.dispatch(
        setInfo({
          id: data.user.id,
          fullName: data.user.Name ?? "",
          phoneNumber: data.user.Phone ?? "",
          address: data.user.Address ?? "",
          role: data.user.role,
        }),
      );
      return { success: true, expiredSession: false, shouldLogin: false };
    })
    .catch((error) => {
      if (!isAuthOperationCurrent(operationVersion)) {
        return cancelledRefreshResult();
      }

      console.log(error);
      const status = getErrorStatus(error);
      if (status === 401) {
        store.dispatch(deleteInfo());
        store.dispatch(deleteToken());
        return { success: false, expiredSession: false, shouldLogin: true };
      }
      // if (status === 409 || status === 503 || status === undefined) {
      //   return { success: false, expiredSession: false, shouldLogin: false };
      // }
      if (status == 403) {
        store.dispatch(deleteInfo());
        store.dispatch(deleteToken());
      }

      return {
        success: false,
        expiredSession: status === 403,
        shouldLogin: status === 403,
      };
    })
    .finally(() => {
      if (refreshPromise === currentPromise) {
        refreshPromise = null;
        refreshPromiseVersion = null;
      }
    });

  refreshPromise = currentPromise;
  refreshPromiseVersion = operationVersion;
  return currentPromise;
}
