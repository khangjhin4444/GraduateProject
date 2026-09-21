import { handleLogout } from "@/lib/handleLogou";
import { useAppSelector } from "@/state/hooks";
import { useNavigate } from "react-router";

export default function Page() {
  const token = useAppSelector((state) => state.token);
  const navigate = useNavigate();
  return (
    <div>
      <h1>This is Service Page</h1>
      {token.accessToken !== "" && (
        <button onClick={() => handleLogout()}>Logout</button>
      )}
      <button onClick={() => navigate("/home")}>To home page</button>
    </div>
  );
}
