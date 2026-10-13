// ShippingAddress.test.tsx
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ShippingAddress from "@/pages/HasHeader/checkout/_components/ShippingAddress";

vi.mock("@/utils/addressData", () => ({
  provincesData: [
    {
      province_code: "79",
      name: "Thành phố Hồ Chí Minh",
      wards: [
        { ward_code: "27211", name: "Phường Hòa Bình" },
        { ward_code: "27212", name: "Phường Bến Thành" },
      ],
    },
    {
      province_code: "01",
      name: "Thành phố Hà Nội",
      wards: [{ ward_code: "00001", name: "Phường Phúc Xá" }],
    },
  ],
}));

const TestWrapper = ({
  defaultValues = {
    name: "",
    phone: "",
    street: "",
    addressProvince: "",
    addressWard: "",
    shipping: "Normal",
    payment: "COD",
    save: false,
  },
}: {
  defaultValues?: any;
}) => {
  const form = useForm({ defaultValues });
  return (
    <form>
      <ShippingAddress form={form} />
    </form>
  );
};

describe("ShippingAddress Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it("hiển thị trạng thái khởi tạo ban đầu (chưa điền đủ địa chỉ)", () => {
    render(<TestWrapper />);

    expect(screen.getByText(/Province/i)).toBeInTheDocument();
    expect(screen.getByText(/Ward/i)).toBeInTheDocument();
    expect(screen.getByText(/Detail Address/i)).toBeInTheDocument();

    expect(
      screen.getByText("Please complete Shipping Address"),
    ).toBeInTheDocument();
  });

  it("không hiển thị Preview nếu chỉ mới nhập tên đường", async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    const streetInput = screen.getByPlaceholderText("Your delivery address");
    await user.type(streetInput, "123 Lê Lợi");

    expect(
      screen.getByText("Please complete Shipping Address"),
    ).toBeInTheDocument();
  });

  it("hiển thị Preview Shipping Address khi điền đầy đủ Tỉnh, Phường và Tên đường", async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    const provinceInput = screen.getByPlaceholderText("Select Province");
    const wardInput = screen.getByPlaceholderText("Select Ward");
    const streetInput = screen.getByPlaceholderText("Your delivery address");

    await user.type(provinceInput, "Hồ Chí Minh");
    const hcmOption = await screen.findByRole("option", {
      name: "Thành phố Hồ Chí Minh",
    });
    await user.click(hcmOption);

    await user.type(wardInput, "Hòa Bình");
    const wardOption = await screen.findByRole("option", {
      name: "Phường Hòa Bình",
    });
    await user.click(wardOption);

    await user.type(streetInput, "123 Đường 3/2");

    await waitFor(() => {
      expect(
        screen.getByText(
          "Preview Shipping Address: 123 Đường 3/2, Phường Hòa Bình, Thành phố Hồ Chí Minh",
        ),
      ).toBeInTheDocument();
    });
  });

  it("xóa rỗng ô Phường/Xã khi người dùng thay đổi Tỉnh/Thành phố", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper
        defaultValues={{
          street: "123 Đường 3/2",
          addressProvince: "Thành phố Hồ Chí Minh",
          addressWard: "Phường Hòa Bình",
        }}
      />,
    );

    expect(
      screen.getByText(
        "Preview Shipping Address: 123 Đường 3/2, Phường Hòa Bình, Thành phố Hồ Chí Minh",
      ),
    ).toBeInTheDocument();

    const provinceInput = screen.getByPlaceholderText("Select Province");

    await user.clear(provinceInput);
    await user.type(provinceInput, "Hà Nội");
    const hnOption = await screen.findByRole("option", {
      name: "Thành phố Hà Nội",
    });
    await user.click(hnOption);

    await waitFor(() => {
      expect(
        screen.getByText("Please complete Shipping Address"),
      ).toBeInTheDocument();
    });
  });
});
