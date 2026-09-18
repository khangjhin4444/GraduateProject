import { Outlet } from "react-router";
import TacoImg from "@/assets/taco-bg.webp";
export default function Layout() {
  return (
    <div className="flex justify-center min-h-screen">
      <div className="hidden lg:block flex-1 min-h-screen">
        <img
          className="object-cover h-full w-full"
          src={TacoImg}
          alt="Register image"
        />
      </div>

      <div className="flex-1 flex min-h-screen justify-center items-center w-full bg-teal-100 px-5 py-3">
        <Outlet />
      </div>
    </div>
  );
}
