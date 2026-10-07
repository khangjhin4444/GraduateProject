import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import useAdminProductDetail from "@/hooks/useAdminProductDetail";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";

// 1. Mock AdminUsecase
vi.mock("@/features/admin/usecase/admin.usecase", () => ({
  AdminUsecase: {
    getProductDetail: vi.fn(),
  },
}));

const mockPage1 = {
  success: true,
  page: 1,
  limit: 10,
  hasNextPage: true,
  nextPage: 2,
  data: [],
};

// Dữ liệu giả cho Trang 2
const mockPage2 = {
  success: true,
  page: 2,
  limit: 10,
  hasNextPage: false,
  nextPage: null,
  data: [],
};

describe("useAdminProductDetail Hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Khởi tạo QueryClient mới cho mỗi test case để xóa cache cũ
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  it("hook returns a useInfiniteQuery function", async () => {
    vi.mocked(AdminUsecase.getProductDetail).mockResolvedValueOnce(mockPage1);
    const { result } = renderHook(
      () => useAdminProductDetail({ type: "keyboard" }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(AdminUsecase.getProductDetail).toHaveBeenCalledWith({
      type: "keyboard",
      page: 1,
    });
  });

  it("gọi API thành công và trả về dữ liệu trang đầu tiên", async () => {
    vi.mocked(AdminUsecase.getProductDetail).mockResolvedValueOnce(mockPage1);

    const { result } = renderHook(
      () => useAdminProductDetail({ type: "keyboard", page: 1 }),
      { wrapper },
    );

    // Chờ hook fetch xong data
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Kiểm tra API được gọi với đúng tham số
    expect(AdminUsecase.getProductDetail).toHaveBeenCalledWith({
      type: "keyboard",
      page: 1,
    });

    // Kiểm tra dữ liệu trả về (React Query bọc data trong cấu trúc pages)
    expect(result.current.data?.pages[0]).toEqual(mockPage1);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("gọi fetchNextPage tải trang tiếp theo chính xác", async () => {
    // Mock lần gọi 1 trả về page 1, lần gọi 2 trả về page 2
    vi.mocked(AdminUsecase.getProductDetail)
      .mockResolvedValueOnce(mockPage1)
      .mockResolvedValueOnce(mockPage2);

    const { result } = renderHook(
      () => useAdminProductDetail({ type: "keyboard", page: 1 }),
      { wrapper },
    );

    // 1. Chờ trang đầu tải xong
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 2. Kích hoạt gọi trang tiếp theo
    act(() => {
      result.current.fetchNextPage();
    });

    // 3. Chờ quá trình tải trang tiếp theo hoàn tất (isFetchingNextPage chuyển lại thành false)
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));

    // Kiểm tra hàm API có được gọi lần 2 với tham số page = 2 (dựa vào `nextPage` của mockPage1) không
    expect(AdminUsecase.getProductDetail).toHaveBeenNthCalledWith(2, {
      type: "keyboard",
      page: 2,
    });

    // Kiểm tra độ dài của mảng pages bây giờ phải là 2 (chứa dữ liệu của cả 2 trang)
    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
      expect(result.current.data?.pages[1]).toEqual(mockPage2);
    });

    // Vì mockPage2 có hasNextPage = false, biến hasNextPage của hook cũng phải bằng false
    expect(result.current.hasNextPage).toBe(false);
  });

  it("không tự động gọi API nếu truyền tham số enable = false", async () => {
    const { result } = renderHook(
      () => useAdminProductDetail({ type: "keyboard", page: 1, enable: false }),
      { wrapper },
    );

    // Chờ một chút để chắc chắn API không bị gọi ngầm
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));

    // Kiểm tra hook vẫn đang trong trạng thái pending (chưa có data) và hàm gọi API bị bỏ qua
    expect(result.current.isPending).toBe(true);
    expect(AdminUsecase.getProductDetail).not.toHaveBeenCalled();
  });
});
