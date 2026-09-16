import { createBrowserRouter, redirect } from "react-router";
import Home from "./pages/home";
import Service from "./pages/service";
import Contact from "./pages/contact";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import { GlobalErrorFallback } from "./components/GlobalErrorFallback";

const lazyLoad = (importFunc: () => Promise<any>) => async () => {
  const module = await importFunc();
  return { Component: module.default };
};
export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/home"),
  },
  {
    path: "/home",
    Component: Home,
    errorElement: <GlobalErrorFallback />,
  },
  { path: "/service", Component: Service },
  { path: "/contact", Component: Contact },
  { path: "/register", Component: Register },
  { path: "/login", Component: Login },
]);
