import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "@/router";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/providers/QueryProvider";

import { Provider } from "react-redux";
import { store } from "./state/store.ts";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </Provider>
    </QueryClientProvider>
  </StrictMode>,
);
