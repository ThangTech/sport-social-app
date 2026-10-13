# Chạy trên máy mới

Database: `DESKTOP-PKQJ4NC` / `SocialSportDb`, Windows Authentication.
Đã áp dụng 12 migration; seed gồm 6 môn thể thao và vai trò USER, ADMIN.
Migration không khôi phục tài khoản, bài viết hoặc dữ liệu cũ không có backup.

Bốn tài khoản local nằm trong `artifacts/local-accounts.json`:
`admin@ss.test` (System Admin), `user@ss.test` (người dùng),
`mod@ss.test` (moderator nhóm), `group@ss.test` (quản trị nhóm).
Đăng nhập bằng email. Mật khẩu test lưu ở file này, không đưa vào Git.
Các tài khoản cũ đã được đổi email và mật khẩu, giữ nguyên dữ liệu và quyền.
JWT key lưu trong .NET User Secrets.

Nhóm mẫu: Chạy bộ cuối tuần, Cầu lông giao lưu (công khai);
Tennis bạn bè, Gym cùng tiến bộ (riêng tư). Tài khoản group sở hữu cả bốn nhóm,
mod là moderator. Tài khoản user đã tham gia ba nhóm đầu và đang chờ duyệt
tham gia Gym cùng tiến bộ. Chi tiết nằm trong `artifacts/local-sample-groups.json`.

## Khởi động

Mở ba terminal tại thư mục dự án:

```powershell
dotnet run --project backend/src/SocialSport.Api --launch-profile http
```

```powershell
cd mobile
npm start -- --lan
```

```powershell
cd admin
npm run dev
```

Admin: http://localhost:5173. Mobile web: http://localhost:8081.
API: http://localhost:5016/api/v1/sports.
Quét QR Expo bằng điện thoại cùng mạng Wi-Fi với máy tính.

Không cần đặt `EXPO_PUBLIC_API_URL` khi chạy Expo trên LAN: app lấy hostname
từ máy đang chạy Expo. Mobile web và admin lấy hostname hiện tại của trình duyệt.
Nếu có `.env` cũ chứa IP cũ, xóa giá trị đó và khởi động lại Expo bằng `npx expo start --clear --lan`.

Đổi Wi-Fi: khởi động lại Expo và quét QR mới. Backend nghe trên `0.0.0.0:5016`.
CORS cho phép mọi origin, header và method; các API yêu cầu JWT vẫn kiểm tra quyền.
Rule firewall `SocialSport Local Development` mở TCP 5016, 8081, 5173 cho LocalSubnet.
CORS không giúp điện thoại khác mạng truy cập IP nội bộ. Với 4G, Expo tunnel hoặc bản
build độc lập, đặt `EXPO_PUBLIC_API_URL` thành địa chỉ backend có thể truy cập từ điện thoại.
Production bắt buộc cấu hình URL thật; không dùng địa chỉ localhost.

## Kiểm duyệt

- Bài ngoài nhóm, gồm riêng tư/người theo dõi/công khai, chờ System Admin duyệt.
- Bài có media chỉ vào hàng đợi sau khi upload và finalize hoàn tất.
- Sửa nội dung/phạm vi hoặc thay/xóa media phải duyệt lại.
- Admin → Bài viết → lọc chờ duyệt → Xem và duyệt để xem nội dung và ảnh/video.
- Duyệt hoặc từ chối phải nhập lý do. Quyết định, nhật ký và thông báo cho tác giả
  được lưu cùng một giao dịch. Nhật ký hiển thị quyết định và lý do cụ thể.
- Tác giả mở thông báo để xem trạng thái và lý do trong Trạng thái bài viết của tôi.
- Quyền xem riêng tư/người theo dõi được giữ nguyên sau khi duyệt.
- Phiên bản bài đã thay đổi sẽ trả HTTP 409 khi admin cố duyệt bản cũ.
- Cá nhân → Tài khoản → Trạng thái bài viết của tôi theo dõi kết quả duyệt.
- Bộ lọc tiếng Việt dùng cùng snapshot cục bộ trên mobile và backend, áp dụng cả
  tạo/sửa bài và bình luận. Luồng quản trị nhóm vẫn hoạt động riêng.
- ACRCloud và Google Vision bị tắt trong cấu hình dịch vụ, kể cả khi còn biến môi trường cũ.

Đổi sáng/tối ở biểu tượng trên Trang cá nhân hoặc công tắc trong Tài khoản.

Thanh bên quản trị cố định theo chiều cao màn hình, có vùng cuộn riêng.
Chia sẻ trên web dùng địa chỉ hiện tại; khi trình duyệt LAN HTTP không hỗ trợ
chia sẻ hoặc clipboard, app thử sao chép kiểu cũ rồi cho phép sao chép thủ công.
Liên kết LAN chỉ truy cập được từ thiết bị có kết nối tới mạng đó.

## Model logo

Model `backend/src/SocialSport.Api/Models/brand-logos-yolov5s.onnx` chạy trực tiếp
trên CPU bằng ONNX Runtime trong .NET. Đã cấu hình sẵn 15 nhãn, gồm Nike, Adidas,
Puma, Under Armour, The North Face và NFL. Không cần Python hay API key khi chạy app.
Model được copy cùng đầu ra build/publish; giữ thư mục `Models` khi chuyển máy.
Ảnh đăng mới hoặc thay thế được quét và hiển thị tên logo, độ tin cậy, khung đánh dấu
cho System Admin và Group Admin. Ảnh cũ không được tự quét lại.
Xem `backend/src/SocialSport.Api/Models/LOGO-MODEL.md` để biết nguồn model, checksum,
giấy phép đi kèm, cách xuất lại và định dạng cấu hình.
Không có model / quét lỗi / video đều báo cần kiểm tra thủ công, không tự duyệt.
Phát hiện logo chỉ hỗ trợ người duyệt, không chứng minh vi phạm bản quyền.

## Kiểm tra lại

Kết quả ngày 11/10/2026: 65 kiểm tra backend đạt sau khi tích hợp model thật.
Ngày 12/10/2026: 72 kiểm tra backend đạt, gồm bắt buộc lý do, thông báo đúng tác giả,
lý do trong trạng thái bài viết và nhật ký quyết định.
Build/lint admin và TypeScript/lint mobile đều đạt sau thay đổi.
Kiểm thử trình duyệt đạt: thanh bên cố định khi cuộn bài viết/báo cáo,
form bắt buộc lý do, chia sẻ trên LAN HTTP khi thiếu clipboard,
và mở thông báo từ chối tới màn hình hiển thị lý do.
Các ca giao diện dùng phản hồi API mẫu; kiểm thử backend dùng database riêng.
Log: `artifacts/admin-browser-tests.log`, `artifacts/mobile-admin-browser-tests.log`,
`artifacts/admin-updates-tests.log`.
8 ảnh mẫu từ bộ validation được nhận diện đúng nhãn Nike, Adidas, Puma và Under Armour
(2 ảnh mỗi nhãn). Đây là kiểm tra tích hợp, không phải đánh giá độ chính xác tổng quát.
ONNX đã được so sánh với PyTorch; bản publish chứa model và checksum khớp bản nguồn.
TypeScript và lint của mobile, build và lint admin đã đạt ở đợt kiểm tra giao diện trước.
Đã chạy trình duyệt kiểm tra sáng/tối, lưu theme sau reload,
admin xem media của bài riêng tư và duyệt, tác giả xem trạng thái đã duyệt.
API qua địa chỉ LAN của máy trả HTTP 200. Ảnh kiểm tra và log nằm trong `artifacts/`.

```powershell
dotnet tool restore
dotnet ef database update --project backend/src/SocialSport.Api -- --environment Development
dotnet run --project backend/tests/SocialSport.SmokeTests
```

Chỉ kiểm tra model, không cần kết nối SQL:

```powershell
dotnet run --project backend/tests/SocialSport.SmokeTests -- --logos-only
```

Log tích hợp model: `artifacts/logo-full-smoke.log`, `artifacts/logo-inference-tests.log`,
`artifacts/logo-export.log`. Bản publish kiểm tra nằm tại `artifacts/logo-publish`.

Smoke test tạo database SQL tên ngẫu nhiên `SocialSportSmoke_*`, xác minh đúng tên
trước khi chạy và xóa chính database đó sau test. Không dùng database ứng dụng để test.
Test mặc định dùng SQL Server của máy này; cần chỉnh server nếu chuyển máy lần nữa.

```powershell
cd mobile
npx tsc --noEmit
npm run lint
```

```powershell
cd admin
npm run build
npm run lint
```

Giới hạn: chưa kiểm tra trên điện thoại vật lý. Model chỉ biết 15 nhãn được huấn luyện;
kiểm thử ảnh mẫu không đảm bảo nhận diện được mọi logo, ảnh mờ hoặc logo bị che khuất.
NuGet vẫn cảnh báo bảo mật ở ImageSharp 3.1.12 có sẵn trong dự án. Không tự nâng lên
bản yêu cầu license mới; cần xử lý dependency này trước khi triển khai công khai.
