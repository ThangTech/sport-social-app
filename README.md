# SocialSport

Monorepo gồm ASP.NET Core API (`backend/`), Expo React Native (`mobile/`) và Vite React System Admin (`admin/`).

## Yêu cầu

- .NET SDK theo `backend/global.json`
- SQL Server
- Node.js và npm
- Không commit secret hoặc file `.env`

## Cấu hình

Backend đọc cấu hình từ environment variables, user-secrets hoặc appsettings cục bộ. Production tối thiểu cần:

```text
ConnectionStrings__DefaultConnection
Jwt__Key
Jwt__Issuer
Jwt__Audience
Cors__AllowedOrigins__0
DataProtection__KeyRingPath
```

Email reset-password cần các biến tương ứng của section `Email`. Đặt JWT key đủ dài, ngẫu nhiên; không dùng giá trị Development. `AllowedOrigins` phải liệt kê chính xác origin Admin/Web, không dùng wildcard khi gửi credential. `DataProtection__KeyRingPath` phải trỏ tới volume bền vững và dùng chung giữa các instance API để signed URL media vẫn hợp lệ sau restart hoặc scale-out.

Push notification vẫn lưu inbox trong database nếu Expo Push không khả dụng. Khi bật push production, cấu hình thêm access token bằng secret manager:

```text
Expo__AccessToken
```

Quét bản quyền âm thanh trong video là tích hợp tùy chọn. Khi chưa cấu hình,
upload video và đối chiếu SHA-256 nội bộ vẫn hoạt động bình thường. Khi bật,
đặt token trong secret manager, không ghi vào `appsettings.json`:

```text
CopyrightScanning__Enabled=true
CopyrightScanning__FailClosed=true
CopyrightScanning__AppealWindowDays=14
CopyrightScanning__Provider=AcrCloud
CopyrightScanning__ApiBaseUrl=https://api-ap-southeast-1.acrcloud.com/
CopyrightScanning__BearerToken
CopyrightScanning__ContainerId
```

`ApiBaseUrl` phải đúng region của File Scanning container. `FailClosed=true` giữ
bài ở trạng thái ẩn trong lúc quét hoặc khi nhà cung cấp lỗi. ACRCloud nhận diện
nhạc/âm thanh và derivative works theo cấu hình container; nó không thay thế
việc đối chiếu hình ảnh/video trực quan hay quyết định của System Admin.

Mobile cần `mobile/.env` (đã bị ignore):

```text
EXPO_PUBLIC_API_URL=https://api.example.com/api/v1
EXPO_PUBLIC_EAS_PROJECT_ID=00000000-0000-0000-0000-000000000000
```

`EXPO_PUBLIC_EAS_PROJECT_ID` là project ID, không phải secret. Push trên thiết bị thật còn cần EAS project, APNs/FCM credentials và development/release build; Expo Go không đại diện cho cấu hình phát hành.

Admin cần `admin/.env.local` (đã bị ignore):

```text
VITE_API_URL=https://api.example.com/api/v1
```

## Database và Backend

```powershell
cd backend
dotnet restore
dotnet ef database update --project src/SocialSport.Api
dotnet run --project src/SocialSport.Api
```

Không tự chạy migration khi app production khởi động. Sao lưu DB, xem SQL migration và áp dụng trong bước release riêng. Role hệ thống hiện dùng `ADMIN`; role `USER` là mặc định. Group Owner/Admin/Moderator không cấp quyền System Admin.

Build release:

```powershell
dotnet publish src/SocialSport.Api -c Release -o artifacts/api
```

## Mobile

```powershell
cd mobile
npm ci
npx tsc --noEmit
npx eslint .
npx expo start
```

Build store cần cấu hình signing/EAS riêng; repo không chứa key ký.

## Admin

```powershell
cd admin
npm ci
npm run lint
npm run build
```

Deploy nội dung `admin/dist` lên static host và đặt `VITE_API_URL` trước build. API vẫn xác thực role `ADMIN`; kiểm tra role ở client chỉ nhằm cải thiện UX.

Admin hiện có dashboard sức khỏe hệ thống, quản lý người dùng/nhóm/bài viết/report, quyền System Admin, tác vụ vận hành, change request, incident, contingency plan, audit log và xử lý bản quyền. Quyền Owner/Admin/Moderator trong nhóm không cấp quyền vào các API này.

## Upload và vận hành

- `wwwroot/uploads` phải nằm trên persistent storage hoặc object storage; container filesystem tạm sẽ làm mất file. Nếu chạy nhiều instance, mọi instance phải nhìn thấy cùng một storage.
- Giới hạn upload được kiểm tra ở service, nhưng reverse proxy cũng cần giới hạn request body và timeout.
- Avatar, cover và ảnh nhóm là media công khai. Media bài viết không còn được phục vụ trực tiếp từ `/uploads/posts`; API cấp signed URL hết hạn sau một giờ và kiểm tra lại trạng thái bài/nhóm khi tải.
- Persist key ring Data Protection bên cạnh upload storage. Nếu mất key ring, các signed URL đang còn hạn và token do Data Protection tạo ra sẽ mất hiệu lực.
- Reverse proxy phải terminate TLS; production bật HTTPS redirect.
- Log lỗi server có `traceId`; response 500 không trả nội dung exception. Không log token, password hoặc raw secret.
- Cần backup DB và upload storage cùng một lịch, kèm bài test restore.

## Checklist release

1. Chạy `dotnet build`/`publish`, Mobile ESLint/TypeScript/Expo config và Admin lint/build.
2. Áp dụng migrations trên staging và kiểm tra rollback/backup.
3. Smoke test Auth, Feed, Post, Profile, Groups, Notifications, Reports và Admin bằng nhiều role.
4. Kiểm tra CORS từ origin thật, upload qua reverse proxy và link media.
5. Xác nhận secret chỉ nằm trong secret manager/environment.
6. Chưa deploy/push nếu chưa xử lý các rủi ro được liệt kê bên dưới.

## Rủi ro/chưa hoàn tất

- Chưa có test project tự động cho Backend và chưa có E2E Mobile/Admin; các luồng đa role vẫn cần smoke test bằng database staging và thiết bị/emulator thật.
- Push đã gửi qua Expo Push Service nhưng chưa có background job lấy push receipts sau khi gửi; lỗi ticket trực tiếp được xử lý, lỗi giao nhận muộn chưa tự vô hiệu hóa token.
- `npm audit` của Mobile còn cảnh báo trong toolchain Expo (`image-size`, `postcss`); bản sửa tự động còn lại yêu cầu nâng major/breaking và phải được kiểm thử riêng trước khi áp dụng.
- Admin access token lưu localStorage và chưa dùng refresh-token rotation; production nên cân nhắc cookie HttpOnly/BFF.
- Danh sách report của người gửi chỉ hiển thị trạng thái, chưa có ghi chú quyết định công khai.
- Bản quyền hiện phát hiện trùng khớp SHA-256 chính xác và có hàng đợi duyệt/kháng nghị. Chưa có perceptual image hash, audio/video fingerprint hoặc tích hợp kho quyền của bên thứ ba, nên nội dung đã crop, encode lại hay chỉnh sửa vẫn cần kiểm duyệt thủ công.
- Cần credential staging cho ma trận test Owner, Group Admin, Moderator, Member, Pending, Banned, outsider và System Admin.
