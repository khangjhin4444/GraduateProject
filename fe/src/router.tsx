import {
  createBrowserRouter,
  Outlet,
  redirect,
  type LoaderFunction,
} from "react-router";
import Home from "./pages/HasHeader/home";
import Service from "./pages/HasHeader/service";
import Contact from "./pages/HasHeader/contact";
import Login from "./pages/auth/login";
import ProductDetail from "./pages/HasHeader/product";
import Register from "./pages/auth/register";
import AuthLayout from "./pages/auth/layout";
import HasHeaderLayout from "./pages/HasHeader/layout";
import NotFoundPage from "./components/NotFound";
import { GlobalErrorFallback } from "./components/GlobalErrorFallback";
import { refreshAuth } from "./lib/authRefresh";
import { store } from "./state/store";
import { queryClient } from "./providers/QueryProvider";
import { productDetailOptions } from "./hooks/useProductDetail";

const lazyLoad = (importFunc: () => Promise<any>) => async () => {
  const module = await importFunc();
  return { Component: module.default };
};
function RootLayout() {
  return (
    <>
      <Outlet />
    </>
  );
}

async function rootLoader() {
  const token = store.getState().token;
  if (token.accessToken !== "") {
    return null;
  }

  refreshAuth();

  return null;
}

function withAuth(loader: LoaderFunction): LoaderFunction {
  return async (args) => {
    if (store.getState().token.accessToken === "") {
      await refreshAuth();
    }

    if (store.getState().token.accessToken === "") {
      throw redirect("/login");
    }

    return loader(args);
  };
}

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    hydrateFallbackElement: <>Loading.....</>,
    loader: rootLoader,
    children: [
      {
        path: "/",
        loader: () => redirect("/home"),
      },
      {
        Component: HasHeaderLayout,
        children: [
          {
            path: "/home",
            Component: Home,
            errorElement: <GlobalErrorFallback />,
          },
          { path: "/service", Component: Service },
          { path: "/contact", Component: Contact },
          {
            path: "/product/:id",
            loader: withAuth(async ({ params }) => {
              const productId = Number(params.id);
              if (isNaN(productId)) {
                return redirect("/not-found");
              }
              return null;
            }),
            Component: ProductDetail,
            hydrateFallbackElement: <p>Loading</p>,
          },
        ],
      },
    ],
  },
  {
    Component: AuthLayout,
    children: [
      { path: "/register", Component: Register },
      { path: "/login", Component: Login },
    ],
  },
  { path: "/not-found", Component: NotFoundPage },
]);
