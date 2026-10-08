# API Spec

## Authentication

### `POST /api/auth/register`

```json
{
  "fullName": "Nguyen Van A",
  "username": "nguyenvana",
  "password": "StrongPass123",
  "email": "a@example.com",
  "phone": "0912345678"
}
```

Tạo tài khoản `USER`, mã hóa mật khẩu bằng BCrypt và trả access/refresh token. Trả `409`
khi username, email hoặc số điện thoại đã tồn tại.

### `POST /api/auth/login`

```json
{
  "username": "nguyenvana",
  "password": "StrongPass123"
}
```

Trả `401` nếu thông tin đăng nhập không đúng hoặc tài khoản không hoạt động.

### `POST /api/auth/refresh`

```json
{
  "refreshToken": "eyJ..."
}
```

Refresh token chỉ dùng để cấp cặp token mới, không thể dùng làm Bearer access token.

### `GET /api/auth/me`

Yêu cầu header `Authorization: Bearer <access-token>` và trả thông tin người dùng hiện tại.

## Booking

Tất cả API booking yêu cầu access token.

### `POST /api/bookings`

```json
{
  "flightId": 1,
  "fareId": 1,
  "passengers": [
    { "fullName": "Nguyen Van A", "documentNumber": "079123456789" }
  ]
}
```

Giữ chỗ bằng transaction và khóa pessimistic trên hạng giá để tránh bán vượt tồn ghế.

### `GET /api/bookings/my-bookings`

Trả danh sách đặt vé và vé điện tử của người dùng hiện tại.

### `GET /api/bookings/{id}`

Trả chi tiết đơn thuộc người dùng hiện tại.

### `POST /api/bookings/{id}/cancel`

Hủy đơn `PENDING` và hoàn lại tồn ghế.

## Payment

### `POST /api/payments`

```json
{
  "bookingId": 1,
  "method": "CARD"
}
```

Các phương thức mô phỏng: `CARD`, `BANK_TRANSFER`, `E_WALLET`. Giao dịch thành công cập
nhật đơn sang `PAID` và phát hành một vé điện tử cho mỗi hành khách.

## Administration

Các API `/api/admin/**` chỉ dành cho vai trò `ADMIN`:

- `GET /api/admin/dashboard`: báo cáo số chuyến bay, đơn, khách hàng, thanh toán và doanh thu.
- `GET /api/admin/customers`: danh sách tài khoản khách hàng, thông tin liên hệ và số đơn đã đặt.
- `PATCH /api/admin/customers/{accountId}/status`: khóa hoặc mở khóa tài khoản khách hàng
  bằng trạng thái `LOCKED` hoặc `ACTIVE`.
- `GET /api/admin/staff`: danh sách tài khoản Manager.
- `POST /api/admin/staff`: tạo tài khoản Manager.
- `PATCH /api/admin/staff/{accountId}/status`: khóa hoặc mở khóa Manager.
- `GET /api/admin/catalogs`: danh mục hãng bay, sân bay, máy bay và hạng vé.
- `POST`, `PUT`, `DELETE /api/admin/airlines`: thêm, sửa, xóa hãng hàng không.
- `POST`, `PUT`, `DELETE /api/admin/airports`: thêm, sửa, xóa sân bay.
- `POST`, `PUT`, `DELETE /api/admin/aircraft`: thêm, sửa, xóa máy bay.
- `POST`, `PUT`, `DELETE /api/admin/fare-classes`: thêm, sửa, xóa hạng vé. Dữ liệu đang
  được chuyến bay sử dụng không thể xóa.

Các API `/api/manager/**` chỉ dành cho vai trò `STAFF`:

- `GET /api/manager/dashboard`: số liệu phục vụ điều hành.
- `GET /api/manager/catalogs`: danh mục dùng để lập lịch bay.
- `GET /api/manager/flights`: danh sách chuyến bay cùng hạng giá và tồn ghế.
- `POST /api/manager/flights`: tạo chuyến bay và giá vé ban đầu.
- `PUT /api/manager/flights/{id}`: sửa lịch bay và hạn mức ghế.
- `PATCH /api/manager/flights/{id}/status`: cập nhật trạng thái vận hành.
- `GET /api/manager/bookings`: theo dõi toàn bộ đơn đặt vé.
- `POST /api/manager/bookings/{id}/cancel`: hủy đơn `PENDING` và hoàn lại tồn ghế.
- `POST /api/manager/bookings/{id}/refund`: hoàn đơn `PAID` trước khi chuyến bay khởi hành,
  chuyển thanh toán sang `REFUNDED`, vô hiệu hóa vé điện tử và hoàn lại tồn ghế.
- `POST /api/bookings/{id}/request-refund`: khách hàng gửi yêu cầu hoàn vé đã thanh toán;
  Manager duyệt yêu cầu tại cổng điều hành.

Frontend chạy tách cổng: `5171` cho `ADMIN`, `5172` cho `STAFF` và `5173` cho khách hàng.

## Flight search

`GET /api/flights/{id}/occupied-seats` trả về các ghế đang được giữ bởi đơn `PENDING` hoặc
`PAID`. Khi tạo đơn, mỗi hành khách bắt buộc chọn một ghế theo định dạng như `12A`; thao tác
đặt ghế được tuần tự hóa bằng khóa pessimistic trên chuyến bay để tránh trùng ghế.

### `GET /api/flights/search`

Query parameters:

- `departure`: mã IATA sân bay đi gồm 3 ký tự, ví dụ `SGN`.
- `arrival`: mã IATA sân bay đến gồm 3 ký tự, ví dụ `HAN`.
- `date`: ngày khởi hành theo định dạng `YYYY-MM-DD` và múi giờ Việt Nam.
- `passengers`: số hành khách từ 1 đến 9, mặc định là 1.

Ví dụ:

```http
GET /api/flights/search?departure=SGN&arrival=HAN&date=2026-10-12&passengers=2
```

Kết quả chỉ chứa chuyến bay `SCHEDULED` hoặc `DELAYED` có ít nhất một hạng vé đủ chỗ.

### `GET /api/flights/{id}`

Trả về thông tin chuyến bay, hãng, máy bay, sân bay và các hạng giá. Trả `404` nếu
không tồn tại chuyến bay.

### `GET /api/flights/upcoming`

Trả tối đa 12 chuyến bay nội địa sắp tới. Cả sân bay đi và sân bay đến bắt buộc thuộc
Việt Nam. Query `passengers` nhận giá trị từ 1 đến 9 và dùng để lọc số ghế còn trống.
