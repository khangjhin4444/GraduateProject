export function formatDateTime(inputDate: Date | string | number): string {
  const date = new Date(inputDate);

  // Kiểm tra xem date có hợp lệ không
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date input");
  }

  // Hàm phụ trợ để thêm số 0 ở trước cho các số < 10
  const padZero = (num: number): string => num.toString().padStart(2, "0");

  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());

  const day = padZero(date.getDate());
  const month = padZero(date.getMonth() + 1); // Tháng trong JS bắt đầu từ 0
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}
