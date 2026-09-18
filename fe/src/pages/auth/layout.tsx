import { Outlet } from "react-router";
import TacoImg from "@/assets/taco-bg.webp";
export default function Layout() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="hidden lg:block flex-1 h-full ">
        <img
          className="object-cover h-full w-full"
          src={TacoImg}
          alt="Register image"
        />
      </div>

      <div className="flex-1 flex h-full justify-center items-center w-full bg-teal-100">
        <Outlet />
      </div>
    </div>
  );
}
