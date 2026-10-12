import { authApi } from "@/api/axios.instance";
import { deleteInfo } from "@/state/profile/profileSlice";
import { store } from "@/state/store";
import { deleteToken } from "@/state/token/tokenSlice";
import { beginLogout } from "@/lib/authLifecycle";

export async function handleLogout() {
  try {
    beginLogout();
    store.dispatch(deleteInfo());
    store.dispatch(deleteToken());
    await authApi.post(
      "/api/auth/logout",
      {},
      {
        withCredentials: true,
      },
    );
  } finally {
    window.location.href = "/login";
  }
}
