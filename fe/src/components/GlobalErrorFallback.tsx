import { useRouteError, useNavigate } from "react-router";
import { queryClient } from "@/providers/QueryProvider";

export function GlobalErrorFallback() {
  const error = useRouteError() as Error;
  const navigate = useNavigate();

  const handleRetry = () => {
    queryClient.clear(); // Xóa toàn bộ cache lỗi
    navigate(".", { replace: true }); // Tải lại route hiện tại
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold text-red-600">
        Error when loading page
      </h1>
      <p className="text-gray-600 mt-2 mb-4">
        {error?.message || "Cannot Connect to the server"}
      </p>
      <button
        onClick={handleRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Reload Page
      </button>
    </div>
  );
}
