import { authApi } from "@/api/axios.instance";
import { deleteInfo } from "@/state/profile/profileSlice";
import { store } from "@/state/store";
import { deleteToken } from "@/state/token/tokenSlice";

export async function handleLogout() {
  store.dispatch(deleteInfo());
  store.dispatch(deleteToken());
  await authApi.post(
    "/api/auth/logout",
    {},
    {
      withCredentials: true,
    },
  );
  window.location.href = "/login";
}
