export const colorMap: Record<string, string> = {
  Black: "#222222",
  White: "#FFFFFF",
  Red: "#D32F2F",
  Blue: "#1976D2",
  Creamy: "#F8F0E3", // Trắng kem ấm
  Silver: "#C0C0C0", // Bạc kim loại
  Cheese: "#FFC107", // Vàng cam phô mai
  Pink: "#F48FB1", // Hồng pastel
  Caramel: "#C68E17", // Nâu cam caramel
  Purple: "#9C27B0", // Tím
  Smoke: "#595959", // Xám khói (thường dùng cho vỏ trong suốt)
  Aquamarine: "#7FFFD4", // Xanh ngọc
  Gray: "#9E9E9E", // Xám tiêu chuẩn
  "Milky White": "#FBF8F1", // Trắng sữa (hơi đục, thường thấy ở switch)
  "Black Gold": "#B59A45", // Vàng đồng tối (đại diện cho phối màu Đen-Vàng)
  Tiffany: "#0ABAB5", // Xanh Tiffany đặc trưng
  Green: "#4CAF50", // Xanh lá
  Lunar: "#8A8D8F", // Xám mặt trăng
  Yellow: "#FFEB3B", // Vàng tươi
  Canvas: "#E3DAC9", // Màu vải bạt/be nhạt
};

// Hàm tiện ích (Utility function) để gọi màu an toàn
export const getHexColor = (colorName: string) => {
  return colorMap[colorName] || "#D1D5DB"; // Trả về màu xám mặc định nếu không tìm thấy trong từ điển
};
