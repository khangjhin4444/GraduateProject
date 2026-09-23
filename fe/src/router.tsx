/* eslint-disable react-refresh/only-export-components */

import {
  createBrowserRouter,
  Outlet,
  redirect,
  ScrollRestoration,
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
import ForbiddenPage from "./components/Forbidden";
// import ProductByCategory from "./pages/HasHeader/productByCategory";
// import ProductByKeyword from "./pages/HasHeader/productByKeyword";
// import Cart from "./pages/HasHeader/cart";
// import Checkout from "./pages/checkout";
import LoadingPage from "./components/LoadingPage";
import { GlobalErrorFallback } from "./components/GlobalErrorFallback";
import { refreshAuth } from "./lib/authRefresh";
import { store } from "./state/store";
import { SUBTYPES } from "./shared/ProductSubtype";
import type { ComponentType } from "react";

type LazyModule = { default: ComponentType };

const lazyLoad = (importFunc: () => Promise<LazyModule>) => async () => {
  const module = await importFunc();
  return { Component: module.default };
};
function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

async function rootLoader() {
  const token = store.getState().token;
  if (token.accessToken !== "") {
    return null;
  }

  await refreshAuth();

  return null;
}

function withAuth(
  loader?: LoaderFunction,
  options?: { roles?: string[] },
): LoaderFunction {
  return async (args) => {
    let refreshResult = {
      success: true,
      expiredSession: false,
      shouldLogin: false,
    };
    if (store.getState().token.accessToken === "") {
      refreshResult = await refreshAuth();
    }

    if (store.getState().token.accessToken === "") {
      if (!refreshResult.shouldLogin) {
        throw new Response("Authentication service temporarily unavailable", {
          status: 503,
          statusText: "Authentication service unavailable",
        });
      }
      throw redirect("/login");
    }

    if (options?.roles) {
      const role = store.getState().profile.role;
      if (!options.roles.includes(role)) {
        throw redirect("/forbbiden");
      }
    }
    return loader ? loader(args) : null;
  };
}

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    hydrateFallbackElement: <LoadingPage />,
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
            path: "/search/:keyword",
            loader: ({ params }) => {
              const keyword = params.keyword;
              if (!keyword) return redirect("/home");
              return { keyword };
            },
            lazy: lazyLoad(() => import("@/pages/HasHeader/productByKeyword")),
            // Component: ProductByKeyword,
          },
          {
            path: "/product/:id",
            loader: withAuth(({ params }) => {
              const productId = Number(params.id);
              if (isNaN(productId)) {
                return redirect("/not-found");
              }
              return null;
            }),
            Component: ProductDetail,
            hydrateFallbackElement: <p>Loading</p>,
          },
          {
            path: "/collection/:type/:sub?",
            loader: withAuth(({ params }) => {
              const type = params.type;
              const sub = params.sub;
              console.log(type);
              if (!type) return redirect("/home");
              if (
                !["keyboardkit", "prebuild", "keycap", "switch"].includes(type)
              ) {
                return redirect("/not-found");
              }
              if (sub && !SUBTYPES[type].includes(sub))
                return redirect("/not-found");
              return { type, sub };
            }),
            lazy: lazyLoad(() => import("@/pages/HasHeader/productByCategory")),
            // Component: ProductByCategory,
          },
          {
            path: "/cart",
            loader: withAuth(),
            lazy: lazyLoad(() => import("@/pages/HasHeader/cart")),
            // Component: Cart,
          },
        ],
      },
      {
        children: [
          {
            path: "/checkout",
            loader: withAuth(),
            lazy: lazyLoad(() => import("@/pages/checkout")),
            // Component: Checkout,
          },
          {
            path: "/admin",
            loader: withAuth(() => {}, { roles: ["admin"] }),
            children: [
              {
                path: "dashboard",
                lazy: lazyLoad(() => import("./pages/admin/dashboard")),
              },
              {
                path: "products",
                lazy: lazyLoad(() => import("./pages/admin/products")),
              },
              {
                path: "orders",
                lazy: lazyLoad(() => import("./pages/admin/orders")),
              },
              { path: "*", Component: NotFoundPage },
            ],
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
  { path: "/forbbiden", Component: ForbiddenPage },
  { path: "*", Component: NotFoundPage },
]);
