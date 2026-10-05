import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(`An error occurred: ${error.message}`);
    },
  }),
  defaultOptions: {
    queries: {
      throwOnError: (_error, query) => query.state.data === undefined,
    },
    mutations: {
      throwOnError: true,
    },
  },
});
