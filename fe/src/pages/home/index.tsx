import { handleLogout } from "@/lib/handleLogou";
import { useAppSelector } from "@/state/hooks";
import { useNavigate } from "react-router";

export default function Page() {
  const token = useAppSelector((state) => state.token);
  const navigate = useNavigate();
  return (
    <div className="flex gap-3">
      <h1>This is home page</h1>
      {token.accessToken !== "" && (
        <button onClick={() => handleLogout()}>Logout</button>
      )}
      <button onClick={() => navigate("/service")}>To service page</button>
      <button onClick={() => navigate("/product/1")}>
        To Product Detail page
      </button>
    </div>
  );
}
