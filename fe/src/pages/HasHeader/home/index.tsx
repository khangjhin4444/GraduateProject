import { handleLogout } from "@/lib/handleLogout";
import { useAppSelector } from "@/state/hooks";
import { useNavigate } from "react-router";
import Carosel from "./_components/Carosel";
import KeyboardSection from "./_components/KeyboardSection";
import SwitchKeycapSection from "./_components/SwitchKeycapSection";

export default function Page() {
  const token = useAppSelector((state) => state.token);
  const navigate = useNavigate();
  return (
    <div className="flex gap-3 flex-col px-4 w-full">
      <title>JK Keyboard-Home Page</title>
      <Carosel></Carosel>

      <div className="flex flex-col justify-center items-center w-full">
        <h2 className="text-2xl font-semibold text-foreground">In stock</h2>
        <KeyboardSection></KeyboardSection>
        <SwitchKeycapSection></SwitchKeycapSection>
      </div>

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
