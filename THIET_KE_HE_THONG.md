# Thiết kế hệ thống bán vé máy bay

## 1. Mục tiêu
Xây dựng hệ thống bán vé máy bay phục vụ đồ án môn Công nghệ phần mềm với các yêu cầu chính:

- Tra cứu chuyến bay theo hành trình, ngày bay, hãng bay.
- Đặt vé theo hạng ghế, số lượng hành khách.
- Thanh toán và phát hành vé điện tử.
- Quản lý chuyến bay, máy bay, hãng hàng không, sân bay, giá vé, khách hàng và tài khoản.
- Hỗ trợ phân quyền cho quản trị viên và khách hàng.

## 2. Công nghệ đề xuất
### Backend
- Ngôn ngữ: Java 21
- Framework: Spring Boot 3
- Kiến trúc: REST API, layered architecture
- Persistence: Spring Data JPA / Hibernate
- Bảo mật: Spring Security + JWT
- Validation: Bean Validation
- Tài liệu API: OpenAPI/Swagger

### Cơ sở dữ liệu
- PostgreSQL 16
- Dùng khóa chính tự tăng, khóa ngoại, chỉ mục và ràng buộc toàn vẹn dữ liệu.

### Frontend hiện đại
- TypeScript
- React + Vite
- Tailwind CSS hoặc Material UI
- React Router
- TanStack Query để gọi API và cache dữ liệu
- Form quản lý bằng React Hook Form + Zod

## 3. Kiến trúc tổng thể
Hệ thống nên chia theo mô hình 3 lớp:

1. **Presentation layer**: giao diện người dùng web.
2. **Application/Service layer**: xử lý nghiệp vụ đặt vé, thanh toán, phát hành vé.
3. **Data access layer**: làm việc với PostgreSQL thông qua JPA.

### Sơ đồ luồng chính
- Người dùng tìm chuyến bay.
- Chọn chuyến bay và hạng ghế.
- Tạo đơn đặt vé.
- Thanh toán.
- Sinh vé điện tử và cập nhật trạng thái chỗ ngồi.

## 4. Phân hệ chức năng
### 4.1. Khách hàng
- Đăng ký, đăng nhập, quên mật khẩu.
- Cập nhật hồ sơ cá nhân.
- Tìm kiếm chuyến bay.
- Đặt vé, xem lịch sử đặt vé.
- Xem/ tải vé điện tử.

### 4.2. Quản trị viên
- Quản lý hãng hàng không.
- Quản lý sân bay.
- Quản lý máy bay.
- Quản lý chuyến bay.
- Quản lý hạng ghế và giá vé.
- Theo dõi đặt vé, thanh toán và thống kê doanh thu.

### 4.3. Thanh toán
- Ghi nhận trạng thái thanh toán.
- Hỗ trợ phương thức thanh toán giả lập cho đồ án: chuyển khoản, thẻ, ví điện tử.

## 5. Mô hình dữ liệu
### Các thực thể chính
- HangHangKhong
- SanBay
- MayBay
- ChuyenBay
- HangGhe
- GiaVe
- KhachHang
- DatVe
- VeMayBay
- ThanhToan
- TaiKhoan

### Quan hệ chính
- Một hãng hàng không có nhiều máy bay.
- Một máy bay thuộc một hãng hàng không.
- Một chuyến bay dùng một máy bay.
- Một chuyến bay có điểm đi và điểm đến là sân bay.
- Một chuyến bay có nhiều mức giá theo hạng ghế.
- Một khách hàng có thể có nhiều đơn đặt vé.
- Một đơn đặt vé tạo ra một hoặc nhiều vé máy bay.
- Một đơn đặt vé có thể có một hoặc nhiều giao dịch thanh toán.

## 6. Quy tắc nghiệp vụ đề xuất
- Không cho phép sân bay đi trùng sân bay đến.
- Một chuyến bay phải có thời gian đến lớn hơn thời gian khởi hành.
- Số lượng vé đặt không được vượt quá số lượng ghế còn lại.
- Trạng thái đơn đặt vé gồm: `PENDING`, `PAID`, `CANCELLED`.
- Trạng thái vé gồm: `ISSUED`, `USED`, `VOID`.
- Trạng thái thanh toán gồm: `PENDING`, `SUCCESS`, `FAILED`.

## 7. API gợi ý
### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

### Flight search
- `GET /api/flights/search`
- `GET /api/flights/{id}`

### Booking
- `POST /api/bookings`
- `GET /api/bookings/my-bookings`
- `GET /api/bookings/{id}`
- `POST /api/bookings/{id}/cancel`

### Payment
- `POST /api/payments`
- `GET /api/payments/{id}`

### Administration
- `POST /api/admin/airlines`
- `POST /api/admin/airports`
- `POST /api/admin/aircraft`
- `POST /api/admin/flights`
- `POST /api/admin/fare-classes`
- `GET /api/admin/reports/revenue`

## 8. Cấu trúc backend đề xuất
```text
src/main/java/com/example/flightticket/
├── config
├── controller
├── dto
├── entity
├── exception
├── mapper
├── repository
├── security
├── service
└── FlightTicketApplication.java
```

## 9. Cấu trúc thư mục hệ thống tổng thể
```text
FlightTicketManagementSystem/
├── backend/
│   ├── src/main/java/com/example/flightticket/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── mapper/
│   │   ├── repository/
│   │   ├── security/
│   │   ├── service/
│   │   └── FlightTicketApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/
│   │       └── migration/
│   ├── pom.xml
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── styles/
│   │   └── types/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── database/
│   ├── HeThongBanVeMayBay.sql
│   └── seed/
├── docs/
│   ├── THIET_KE_HE_THONG.md
│   ├── use-case.md
│   ├── erd.md
│   └── api-spec.md
└── README.md
```

## 10. Cấu trúc frontend đề xuất
```text
src/
├── api
├── components
├── features
├── hooks
├── layouts
├── pages
├── routes
├── styles
└── types
```

## 11. Gợi ý cải tiến từ schema hiện tại
- Đổi kiểu `datetime` sang `timestamp` theo PostgreSQL.
- Bổ sung `NOT NULL`, `CHECK`, và `UNIQUE` cho các trường quan trọng.
- Tạo chỉ mục cho các cột tìm kiếm nhiều như mã chuyến bay, mã IATA, ngày khởi hành.
- Tách trạng thái thành enum hoặc bảng danh mục nếu cần mở rộng.
- Thêm cột `created_at`, `updated_at` cho các bảng chính.

## 12. Phạm vi phù hợp cho đồ án
Nếu làm theo thời gian đồ án, nên ưu tiên các chức năng sau:
- Đăng nhập/đăng ký.
- Tìm kiếm chuyến bay.
- Đặt vé.
- Thanh toán mô phỏng.
- Quản trị chuyến bay và giá vé.
- Xem vé điện tử và lịch sử đặt vé.

## 13. Kết luận
Thiết kế này phù hợp để triển khai một hệ thống bán vé máy bay hoàn chỉnh ở mức đồ án: backend rõ ràng bằng Java, dữ liệu chuẩn hóa bằng PostgreSQL, và frontend hiện đại bằng TypeScript + React. Bộ dữ liệu hiện có trong file SQL có thể dùng làm nền tảng để phát triển tiếp phần API và giao diện.
