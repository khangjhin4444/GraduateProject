import { createBrowserRouter, Outlet, redirect } from "react-router";
import Home from "./pages/home";
import Service from "./pages/service";
import Contact from "./pages/contact";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import AuthLayout from "./pages/auth/layout";
import { GlobalErrorFallback } from "./components/GlobalErrorFallback";
import { refreshAuth } from "./lib/authRefresh";
import { store } from "./state/store";

const lazyLoad = (importFunc: () => Promise<any>) => async () => {
  const module = await importFunc();
  return { Component: module.default };
};
function RootLayout() {
  return <Outlet />;
}

async function rootLoader() {
  const token = store.getState().token;
  if (token.accessToken !== "") {
    return null;
  }

  refreshAuth();

  return null;
}

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    loader: rootLoader,
    children: [
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
    ],
  },
  {
    Component: AuthLayout,
    children: [
      { path: "/register", Component: Register },
      { path: "/login", Component: Login },
    ],
  },
]);
