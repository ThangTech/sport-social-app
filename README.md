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
```

Email reset-password cần các biến tương ứng của section `Email`. Đặt JWT key đủ dài, ngẫu nhiên; không dùng giá trị Development. `AllowedOrigins` phải liệt kê chính xác origin Admin/Web, không dùng wildcard khi gửi credential.

Mobile cần `mobile/.env` (đã bị ignore):

```text
EXPO_PUBLIC_API_URL=https://api.example.com/api/v1
```

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

## Upload và vận hành

- `wwwroot/uploads` phải nằm trên persistent storage hoặc object storage; container filesystem tạm sẽ làm mất file.
- Giới hạn upload được kiểm tra ở service, nhưng reverse proxy cũng cần giới hạn request body và timeout.
- Hiện `UseStaticFiles()` phục vụ URL upload công khai. Ảnh/bài của nhóm private không có authorization ở đường dẫn file trực tiếp. Trước khi coi media private là đã bảo vệ, chuyển file private sang endpoint/object storage có signed URL và kiểm tra quyền group/post.
- Reverse proxy phải terminate TLS; production bật HTTPS redirect.
- Log lỗi server có `traceId`; response 500 không trả nội dung exception. Không log token, password hoặc raw secret.
- Cần backup DB và upload storage cùng một lịch, kèm bài test restore.

## Checklist release

1. `dotnet build`/`publish`, Mobile TypeScript, Admin lint/build đều đạt.
2. Áp dụng migrations trên staging và kiểm tra rollback/backup.
3. Smoke test Auth, Feed, Post, Profile, Groups, Notifications, Reports và Admin bằng nhiều role.
4. Kiểm tra CORS từ origin thật, upload qua reverse proxy và link media.
5. Xác nhận secret chỉ nằm trong secret manager/environment.
6. Chưa deploy/push nếu chưa xử lý các rủi ro được liệt kê bên dưới.

## Rủi ro/chưa hoàn tất

- Chưa có test project tự động cho Backend và chưa có E2E Mobile/Admin.
- Media của private group hiện vẫn truy cập trực tiếp nếu biết URL.
- Notifications là inbox pull; chưa có push notification/WebSocket realtime.
- Admin access token lưu localStorage và chưa dùng refresh-token rotation; production nên cân nhắc cookie HttpOnly/BFF.
- Danh sách report của người gửi chỉ hiển thị trạng thái, chưa có ghi chú quyết định công khai.
- Cần credential staging cho ma trận test Owner, Group Admin, Moderator, Member, Pending, Banned, outsider và System Admin.
