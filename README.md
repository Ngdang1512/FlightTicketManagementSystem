# Flight Ticket Management System

Dự án đồ án môn Công nghệ phần mềm: hệ thống bán vé máy bay với backend Java, PostgreSQL và frontend hiện đại.

## Cấu trúc
- `backend/`: Spring Boot
- `frontend/`: React + TypeScript + Vite
- `HeThongBanVeMayBay.sql`: nguồn duy nhất để tạo schema và nạp dữ liệu danh mục
- `database/`: SQL tham khảo
- `docs/`: tài liệu thiết kế

## Chạy cơ sở dữ liệu

```bash
docker compose up -d postgres
```

Backend mặc định kết nối database chính thức tại
`jdbc:postgresql://127.0.0.1:55432/flightticket` bằng tài khoản `admin`. Có thể ghi đè bằng
các biến `DB_URL`, `DB_USERNAME` và `DB_PASSWORD` khi triển khai ở môi trường khác.
Spring Boot tự động chạy `HeThongBanVeMayBay.sql` để tạo schema và nạp dữ liệu danh mục.
File dùng `IF NOT EXISTS`/`ON CONFLICT`, vì vậy có thể chạy lại an toàn.

## Chạy hệ thống

```bash
docker compose up -d postgres
cd backend && mvn spring-boot:run
cd frontend && npm install
npm run dev:admin     # http://127.0.0.1:5171
npm run dev:manager   # http://127.0.0.1:5172
npm run dev:customer  # http://127.0.0.1:5173
```

Ba frontend chạy độc lập: Admin tại cổng `5171`, Manager tại cổng `5172` và Customer tại
cổng `5173`. Vite chuyển tiếp các request `/api` tới backend tại cổng `8080`.
Luồng khách hàng hiện có: đăng ký/đăng nhập, tìm chuyến bay, giữ chỗ, xem đơn, thanh toán mô
phỏng và nhận mã vé điện tử.

Có thể tạo tài khoản kiểm thử quản trị khi khởi động backend bằng `APP_ADMIN_USERNAME`,
`APP_ADMIN_PASSWORD`, `APP_STAFF_USERNAME` và `APP_STAFF_PASSWORD`. Nếu username đã tồn tại,
bootstrap sẽ không thay đổi tài khoản hoặc mật khẩu hiện có.

## Cấu hình JWT

Khi triển khai, bắt buộc đặt `JWT_SECRET` là một chuỗi ngẫu nhiên bí mật có ít nhất 32 byte.
Access token mặc định tồn tại 15 phút và refresh token tồn tại 7 ngày; có thể thay đổi bằng
`JWT_ACCESS_MINUTES` và `JWT_REFRESH_DAYS`. Secret mặc định chỉ dành cho môi trường phát triển.
