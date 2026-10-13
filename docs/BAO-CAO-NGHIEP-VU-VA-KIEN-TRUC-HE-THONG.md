# SocialSport — nghiệp vụ hiện tại và nơi xử lý trong code

Cập nhật theo code trong workspace ngày **12/10/2026**. Bản này thay thế báo cáo ngày 05/10/2026.
Mục đích: dùng khi trình bày đồ án, giải thích nghiệp vụ và mở đúng file để chứng minh.

- Tra giao diện và bài tập sửa trực tiếp: [Bản đồ giao diện](BAN-DO-GIAO-DIEN-VA-TRA-CUU-CODE.md).
- Chạy local, migration, dữ liệu test: [Hướng dẫn local](LOCAL-SETUP.md).
- Các đường dẫn bên dưới tính từ thư mục gốc `D:/sport-social-app`.
- Dùng **Ctrl+P** trong VS Code để mở đường dẫn; **Ctrl+F** tìm tên hàm trong file.

## 1. Những thay đổi mới nhất cần trình bày

| Nội dung | Hành vi hiện tại | Nơi chứng minh |
| --- | --- | --- |
| Duyệt bài cá nhân | Cả Public, Followers, Private đều phải qua System Admin trước khi hiển thị bình thường | `backend/src/SocialSport.Api/Services/Implementations/PostService.cs`: `CreateAsync`, `ApplyPersonalPublicationStateAsync` |
| Upload trước, duyệt sau | Bài cá nhân có media bắt đầu ở Draft; upload và finalize xong mới Pending | Cùng file: `UploadMediaAsync`, `FinalizeAsync` |
| Sửa phải duyệt lại | Sửa bài cá nhân/thay đổi media đưa bài về chờ duyệt, xóa lý do của lần duyệt trước | Cùng file: `UpdateAsync`, `UploadMediaAsync`, `UpdateMediaAsync`, `DeleteMediaAsync` |
| Quyết định có lý do | Duyệt/từ chối bắt buộc lý do; chống duyệt phiên bản nội dung cũ bằng RowVersion | `backend/src/SocialSport.Api/Controllers/AdminController.cs`: `PostStatus` |
| Thông báo tác giả | Lưu quyết định, audit, thông báo trong một lần SaveChanges; push gửi sau khi lưu | Cùng hàm `PostStatus` |
| Nhật ký chi tiết | Hiển thị quyết định, trạng thái trước/sau và lý do thật đã lưu | `backend/src/SocialSport.Api/Controllers/AdminOperationsController.cs`: `AuditLog`, `Dashboard` |
| Lọc ngôn từ | Từ điển tiếng Việt cục bộ ở client và server; áp dụng bài cá nhân, nhóm, bình luận | `mobile/src/utils/moderation.ts`; backend `Services/Implementations/TextModeration.cs` |
| Logo ảnh | Model YOLOv5s ONNX 15 nhãn chạy trong .NET trên CPU; người duyệt xem nhãn/độ tin cậy/khung | backend `Services/Implementations/LocalLogoDetector.cs` |
| Không dùng dịch vụ trả phí | ACRCloud và Google Vision đang bị tắt trong cấu hình đăng ký dịch vụ | backend `Extensions/DependencyInjection.cs` |
| Sáng/tối | Lưu lựa chọn trên thiết bị; chế độ sáng nền trắng và chữ tối | `mobile/src/contexts/ThemeContext.tsx` |
| Chia sẻ local | Lấy host/port phù hợp; web có fallback clipboard và sao chép thủ công | `mobile/src/components/PostCard.tsx`; `mobile/src/utils/share-web.ts` |
| Layout admin | Sidebar cố định cao 100dvh, có vùng cuộn riêng | `admin/src/components/AdminLayout.tsx` |

## 2. Các ứng dụng và luồng dữ liệu

| Phần | Công nghệ/trách nhiệm | Điểm vào |
| --- | --- | --- |
| API | ASP.NET Core 9, EF Core, SQL Server, Identity; kiểm tra quyền và nghiệp vụ | `backend/src/SocialSport.Api/Program.cs` |
| App người dùng | Expo, React Native, Expo Router; chạy native hoặc web | `mobile/src/app/_layout.tsx` |
| Web quản trị | React, Vite, Ant Design; chỉ System Admin đăng nhập quản trị | `admin/src/main.tsx`, `admin/src/App.tsx` |

```text
Màn hình -> service gọi HTTP -> Controller -> Service nghiệp vụ
                                           -> Repository/DbContext -> SQL Server
Màn hình <- state/component <- DTO JSON <--- kết quả xử lý
```

Đây là sơ đồ phổ biến, không phải mọi API đều qua đủ các lớp: `AdminController`,
`AdminOperationsController`, `MyPostReviewsController` dùng DbContext trực tiếp.
Không có `FeedService`: `FeedController` gọi `PostService.GetFeedAsync`.

| Thành phần backend | Vị trí | Trách nhiệm |
| --- | --- | --- |
| Đăng ký dịch vụ/cấu hình | `backend/src/SocialSport.Api/Extensions/DependencyInjection.cs` | DI, JWT, DB, CORS, logo, tắt provider trả phí |
| Entity và enum | `backend/src/SocialSport.Api/Models/Entities`, `Models/Enums` | Dữ liệu lưu và các trạng thái |
| DTO | `backend/src/SocialSport.Api/DTOs` | Dữ liệu request/response, validation |
| Database | `backend/src/SocialSport.Api/Data/ApplicationDbContext.cs` | DbSet và cấu hình EF |
| Truy vấn | `backend/src/SocialSport.Api/Repositories/Implementations` | Truy vấn/lưu dữ liệu theo đối tượng |
| Lỗi tập trung | `backend/src/SocialSport.Api/Middleware/GlobalExceptionHandler.cs` | Chuyển lỗi nghiệp vụ thành phản hồi HTTP |

## 3. Vai trò: phải phân biệt System Admin và quản trị nhóm

| Vai trò | Cách lưu | Quyền chính |
| --- | --- | --- |
| Người dùng | Identity role `USER` | Hồ sơ, follow/block, bài, bình luận, báo cáo, tham gia nhóm |
| System Admin | Identity role `ADMIN` | Quản trị toàn hệ thống; xem nội dung kiểm duyệt qua API admin, kể cả bài riêng tư |
| Chủ nhóm | `Group.OwnerId`, đồng thời membership Admin | Sở hữu nhóm, sửa/xóa nhóm, quản lý vai trò và thành viên |
| Group Admin | `GroupMemberRole.Admin` | Duyệt thành viên, quản lý thành viên/bài trong giới hạn hierarchy |
| Moderator | `GroupMemberRole.Moderator` | Duyệt bài, gỡ bài và quản lý Member theo giới hạn; không có quyền System Admin |
| Member | `GroupMemberRole.Member` | Đăng/tương tác trong nhóm khi membership Active |

Backend kiểm tra quyền; ẩn nút trên giao diện chỉ hỗ trợ UX.
System Admin dùng `[Authorize(Roles = "ADMIN")]` tại các controller admin.
Quyền nhóm nằm ở `backend/src/SocialSport.Api/Services/Implementations/GroupService.cs`:
`UpdateMemberRoleAsync`, `RemoveMemberAsync`, `BanMemberAsync`, `EnsureCanModeratePostsAsync`.
Moderator không được quản lý thành viên ngang/cao hơn mình; không có quyền duyệt yêu cầu tham gia như Group Admin.

## 4. Đăng ký, đăng nhập và hồ sơ

| Nghiệp vụ | Backend | Phía app |
| --- | --- | --- |
| Đăng ký/đăng nhập bằng email | `Controllers/AuthController.cs` -> `Services/Implementations/AuthService.cs` | `mobile/src/app/(auth)/register.tsx`, `login.tsx`; `mobile/src/services/auth.service.ts` |
| Refresh/logout | `AuthService.cs`, `Repositories/Implementations/RefreshTokenRepository.cs` | `mobile/src/services/api.ts`, `mobile/src/storage/token.storage.ts`, `mobile/src/contexts/AuthContext.tsx` |
| Quên/đặt lại mật khẩu | `AuthService.cs`, `Services/Implementations/EmailService.cs` | `mobile/src/app/(auth)/forgot-password.tsx`, `reset-password.tsx` |
| Sửa hồ sơ/avatar/cover | `Controllers/UserController.cs` -> `Services/Implementations/UserService.cs` | `mobile/src/app/user/edit-profile.tsx`, `mobile/src/services/user.service.ts` |
| Follow, unfollow, block | `UserService.cs`; follow/block repositories | `mobile/src/app/user/[id].tsx`, `connections.tsx`, `blocked-users.tsx` |

Trong bảng này và các bảng nghiệp vụ sau, đường dẫn backend rút gọn bắt đầu tại `backend/src/SocialSport.Api/`.
Token mobile native lưu qua SecureStore, web dùng localStorage; code chính ở `token.storage.ts`.
Admin có phiên riêng ở `admin/src/lib/api.ts` và `admin/src/App.tsx`.
Email reset-password cần cấu hình dịch vụ gửi email; có màn hình không đồng nghĩa SMTP đã hoạt động.

## 5. Bài cá nhân: tạo, duyệt, sửa và quyền xem

### 5.1. Quy trình tạo bài

1. `mobile/src/app/modal/create-post.tsx` nhận nội dung và media; dùng `PostEditorForm` và bộ lọc client.
2. `mobile/src/services/post.service.ts` gọi `POST /api/v1/posts`.
3. `Controllers/PostController.cs` chuyển tới `PostService.CreateAsync`.
4. Backend kiểm tra nội dung lại. Không media: `Hidden + Pending`. Có media: `Hidden + Draft`.
5. Upload qua `POST /api/v1/posts/{id}/media`; kiểm tra file, lưu file, phân tích logo ảnh.
6. `POST /api/v1/posts/{id}/finalize` chuyển bài cá nhân Draft sang Pending sau khi hoàn tất upload.
7. System Admin xem nội dung rồi duyệt. Chỉ khi hợp lệ và không còn blocker mới Published.

**Hai loại trạng thái không giống nhau:** `Post.Status` nói bài đang Published/Hidden/Removed/Deleted;
`SystemModerationStatus` nói tiến trình Draft/Pending/Approved/Rejected.
`Post.Visibility` xác định đối tượng được xem sau khi duyệt; duyệt Private không biến thành Public.

### 5.2. Quyết định của System Admin

- Giao diện: `admin/src/pages/ResourcePage.tsx` với `resource="posts"` -> `admin/src/components/PostReview.tsx`.
- Xem chi tiết: `GET /api/v1/admin/posts/{id}/review` -> `AdminController.ReviewPost`.
- Gửi quyết định: `PATCH /api/v1/admin/posts/{id}/status` -> `AdminController.PostStatus`.
- Request: `DTOs/Admin/UpdateAdminStatusRequest.cs`, gồm `Status`, `Reason`, `RowVersion`.
- Lý do rỗng bị từ chối; tối đa 1.000 ký tự. RowVersion cũ trả 409, yêu cầu tải lại bài.
- Không duyệt bản Draft chưa upload xong, không khôi phục bài đã xóa, không bỏ qua hồ sơ bản quyền đang chặn.
- Bài, `AdminAuditLog`, `Notification` được commit cùng nhau. Gửi Expo push sau commit; lỗi push không hủy kết quả duyệt đã lưu.
- Tác giả xem tại `GET /api/v1/posts/reviews/mine`, controller `MyPostReviewsController.cs`.
- Màn hình `mobile/src/app/user/post-reviews.tsx` hiển thị trạng thái và `SystemModerationReason`.

### 5.3. Xem, sửa và tương tác

| Quy tắc | File/hàm cần mở |
| --- | --- |
| Tác giả sửa nội dung/phạm vi, thay/xóa media; bài cá nhân phải duyệt lại | `Services/Implementations/PostService.cs`: `UpdateAsync`, `UpdateMediaAsync`, `DeleteMediaAsync` |
| Xem bài Published, kiểm tra block hai chiều, Public/Followers/Private | `Services/Implementations/PostAccessService.cs`: `CanViewAsync` |
| Chỉ member Active tương tác bài trong nhóm | Cùng file: `EnsureCanInteractAsync` |
| Feed có tìm kiếm/phân trang | `Controllers/FeedController.cs` -> `PostService.GetFeedAsync`; truy vấn ở `Repositories/Implementations/PostRepository.cs` |
| Khám phá bài/nhóm/người dùng | `Controllers/ExploreController.cs` -> `Services/Implementations/ExploreService.cs` |
| Reaction và lưu bài | `PostService.ReactAsync`, `RemoveReactionAsync`, `SavePostAsync`, `UnsavePostAsync` |
| Xóa mềm | `PostService.DeleteAsync`; trạng thái Deleted và thời điểm xóa |

## 6. Nhóm công khai/riêng tư và kiểm duyệt nhóm

Điểm vào API: `Controllers/GroupController.cs`; phần lớn quy tắc ở `Services/Implementations/GroupService.cs`.

| Thao tác | Quy tắc | Hàm trong GroupService |
| --- | --- | --- |
| Tạo nhóm | Người tạo thành Owner và có membership Admin | `CreateAsync` |
| Tham gia | Public thành Active; Private tạo Pending | `JoinAsync` |
| Duyệt/từ chối tham gia | Group Admin xử lý; tạo thông báo kết quả | `ApproveMemberAsync`, `RejectMemberAsync` |
| Rời nhóm | Rời hoặc hủy yêu cầu; Owner không được rời nhóm của mình | `LeaveAsync` |
| Cấp vai trò | Kiểm tra hierarchy, quyền Owner và Admin | `UpdateMemberRoleAsync` |
| Ban/bỏ ban | Phạm vi quyền theo vai trò; ban hạ vai trò về Member | `BanMemberAsync`, `UnbanMemberAsync` |
| Member đăng bài | Hidden + GroupModerationStatus.Pending | `CreatePostAsync` |
| Owner/Admin/Mod đăng bài | Được duyệt nhóm ngay tại bước tạo; media/bản quyền còn xử lý riêng | `CreatePostAsync` |
| Hàng đợi bài | Owner/Admin/Mod có quyền duyệt | `GetPendingPostsAsync`, `EnsureCanModeratePostsAsync` |
| Duyệt/từ chối bài nhóm | Cập nhật trạng thái nhóm và thông báo tác giả | `ApprovePostAsync`, `RejectPostAsync` |
| Gỡ bài | Tác giả hoặc quản trị theo hierarchy | `RemovePostAsync` |

Bài nhóm dùng `GroupModerationStatus`, không áp dụng hàng đợi Pending bài cá nhân.
Form bắt buộc lý do vừa thêm là cho System Admin; API duyệt nhóm hiện không nhận trường lý do tương tự.
Nhóm Public cho người ngoài xem bài Published nhưng tương tác cần membership Active.
Nhóm Private chỉ member Active xem bài; membership Banned bị chặn.

## 7. Bình luận và bộ lọc từ nhạy cảm

- API: `Controllers/CommentController.cs`; xử lý `Services/Implementations/CommentService.cs`.
- Có comment gốc và reply theo `ParentCommentId`, thông báo cho người liên quan; xóa/gỡ giữ cấu trúc cây.
- Kiểm tra quyền xem/tương tác bài; tác giả sửa bình luận; quản trị nhóm gỡ theo quyền.
- Bộ lọc mới: `Services/Implementations/TextModeration.cs`, hàm `Normalize`, `EnsureAllowed`.
- Dữ liệu backend: `Data/Moderation/sensitive-words.json`; mobile: `mobile/src/data/sensitive-words.json`.
- Nguồn và thông tin bộ từ: `Data/Moderation/README.md`. Đây là snapshot cục bộ, không gọi GitHub mỗi lần đăng.
- Chuẩn hóa Unicode NFKC, chữ thường, bỏ ký tự ẩn, đổi dấu phân cách thành khoảng trắng, so khớp từ/cụm từ.
- Không mô tả bộ lọc này là hiểu ngữ cảnh hoặc loại bỏ được mọi cách lách chữ. Nó không tự bỏ hết dấu tiếng Việt.
- Client chặn sớm qua `mobile/src/utils/moderation.ts`; server vẫn kiểm tra khi gọi API trực tiếp.
- Backend còn đọc từ bổ sung ở `CommentModeration:BlockedTerms`.

## 8. Ảnh, video, logo và bản quyền

| Công việc | File |
| --- | --- |
| Kiểm tra loại/dung lượng/chữ ký file | `Services/Implementations/MediaFileValidator.cs` |
| Upload và gọi phân tích | `Services/Implementations/PostService.cs`: `UploadMediaAsync`, `AnalyzeMediaAsync` |
| Chạy ONNX, giải mã box và lọc kết quả | `Services/Implementations/LocalLogoDetector.cs` |
| API phân tích ảnh riêng cho ADMIN | `Controllers/LogoDetectorController.cs`: `POST /api/v1/logo-detector/analyze-logo` |
| Model/config nhãn | `Models/brand-logos-yolov5s.onnx`, `Models/brand-logos-yolov5s.json` |
| Nguồn/giấy phép/xuất lại model | `Models/LOGO-MODEL.md`, thư mục gốc `scripts/logo-model/` |
| Lưu kết quả phân tích ảnh | `Models/Entities/PostMedia.cs`, DTO media |
| Khung logo trong app duyệt nhóm | `mobile/src/components/post/LogoReviewImage.tsx` |
| Khung logo trong admin | `admin/src/components/PostReview.tsx` |
| URL ảnh/video có bảo vệ | `Services/Implementations/MediaUrlService.cs`, `Controllers/MediaController.cs` |
| Hồ sơ bản quyền/kháng nghị | `Controllers/CopyrightController.cs`, `Services/Implementations/CopyrightService.cs`, `ExternalCopyrightScanService.cs` |

Model thực tế hiện là **YOLOv5s 15 nhãn xuất ONNX**, không phải tên model YOLOv8 minh họa ban đầu.
.NET dùng ONNX Runtime; chạy app không cần Python. Ảnh cũ không tự được phân tích lại.
Có logo chỉ là gợi ý cho người duyệt, không khẳng định vi phạm bản quyền và không tự duyệt bài.
Video hiện xem thủ công. Thiếu model/lỗi quét báo trạng thái để kiểm tra thủ công.
Google Vision/ACRCloud bị tắt tại đăng ký cấu hình dịch vụ; code provider cũ và màn hình hồ sơ vẫn còn.
Luồng hồ sơ bản quyền đang tồn tại không có nghĩa hệ thống đang gọi dịch vụ trả phí.

## 9. Thông báo, báo cáo vi phạm và nhật ký

| Nghiệp vụ | Nơi xử lý |
| --- | --- |
| Danh sách thông báo, chưa đọc, đánh dấu đọc | `Controllers/NotificationController.cs` -> `Services/Implementations/NotificationService.cs` |
| Push thiết bị | `Services/Implementations/ExpoPushNotificationSender.cs`; `mobile/src/services/push-notification.service.ts` |
| Nội dung quyết định System Admin | `AdminController.PostStatus` lưu `Notification.Message` chứa lý do tại thời điểm quyết định |
| Type thông báo mới | `Models/Enums/NotificationType.cs`, `mobile/src/types/notification.ts`: SystemPostApproved/Rejected |
| Mở thông báo trong app hoặc từ push | `mobile/src/app/notifications.tsx`, `mobile/src/app/_layout.tsx` |
| Báo cáo đối tượng User/Post/Comment/Group | `Controllers/ReportController.cs` -> `Services/Implementations/ReportService.cs` |
| Admin xem mục tiêu và xử lý report | `AdminController.ReportTarget`, `ReportStatus`; `admin/src/pages/ReportsPage.tsx` |
| Audit | `AdminController.AddAudit`, `AdminOperationsController.AuditLog`; `admin/src/pages/AuditPage.tsx` |

Report kiểm tra đối tượng có thể xem, không tự báo cáo, giới hạn tần suất và tránh report trùng còn mở.
Đóng report Resolved/Rejected cần ghi chú. **Đóng report không tự gỡ bài**: quyết định với đối tượng là thao tác riêng.
Audit duyệt bài dùng action `post.approved`/`post.rejected`, không chỉ nhãn chung “đổi trạng thái”.
`DisplaySummary` lấy nội dung Summary đã lưu, cả ở trang nhật ký và dashboard.
Thông báo trong app được lưu DB; không nên đồng nhất việc có thông báo DB với việc push đã tới điện thoại.
Trang “Trạng thái bài viết” hiện chỉ liệt kê bài cá nhân ngoài nhóm chưa Deleted.

## 10. Những chức năng System Admin còn lại

| Chức năng | Backend/hàm | Giao diện |
| --- | --- | --- |
| Tổng quan/health | `AdminOperationsController.Dashboard`, `Health` | `admin/src/pages/DashboardPage.tsx` |
| Khóa tài khoản/ẩn nhóm | `AdminController.UserStatus`, `GroupStatus` | `admin/src/pages/ResourcePage.tsx` |
| Danh mục môn thể thao | `AdminController.Sports`, `CreateSport`, `UpdateSport` | `admin/src/pages/SportsPage.tsx` |
| Cấp/thu hồi System Admin | `AdminOperationsController.GrantAdministrator`, `RevokeAdministrator` | `admin/src/pages/RolesPage.tsx` |
| Task/change request | `AdminOperationsController.Tasks`, `CreateTask`, `UpdateTask`, `Changes`, `CreateChange`, `UpdateChange` | `admin/src/pages/OperationsPage.tsx` |
| Incident/runbook | `AdminOperationsController.Incidents`, `CreateIncident`, `UpdateIncident`, `Plans`, `CreatePlan`, `UpdatePlan` | `admin/src/pages/IncidentsPage.tsx` |

Cấp quyền có bảo vệ tự thu hồi/thu hồi Admin cuối cùng. Task, change, incident, runbook là các bản ghi
quản lý vận hành; ghi plan không đồng nghĩa hệ thống đã tự chạy backup/deploy/rollback.

## 11. Local, database và dữ liệu trình diễn

- Kết nối SQL local: `backend/src/SocialSport.Api/appsettings.Development.json`; DbContext dùng EF Core Code First.
- Các migration: `backend/src/SocialSport.Api/Data/Migrations/`. Local đã áp dụng 12 migration.
- Hai migration mới: `20261011075957_AddSystemPostReviewAndLogoAnalysis.cs` và `20261012135352_AddPostDecisionReasons.cs`.
- Migration mới nhất thêm lý do bài, message thông báo, tăng độ dài summary audit; model snapshot đồng bộ schema.
- Migration dựng lại cấu trúc và seed đã khai báo, không khôi phục dữ liệu máy cũ nếu thiếu backup.
- Backend CORS: `Extensions/DependencyInjection.cs`; áp dụng middleware ở `Program.cs`.
- Backend listen port/host: `Properties/launchSettings.json`. Local API 5016, admin 5173, app web 8081.
- App tự lấy host local: `mobile/src/services/api.ts`; admin: `admin/src/lib/api.ts`.
- Cấu hình ghi đè: `mobile/.env.example`, `admin/.env.example`. Đổi Wi-Fi cần khởi động Expo và dùng địa chỉ LAN mới.
- CORS không giúp địa chỉ LAN truy cập được từ mạng Internet khác.
- Tài khoản local: `admin@ss.test`, `user@ss.test`, `mod@ss.test`, `group@ss.test`; mật khẩu trong file local `artifacts/local-accounts.json`.
- Hai nhóm Public: Chạy bộ cuối tuần, Cầu lông giao lưu. Hai nhóm Private: Tennis bạn bè, Gym cùng tiến bộ.
- `group` sở hữu bốn nhóm, `mod` là moderator; `user` chờ duyệt vào Gym, đã tham gia ba nhóm còn lại.
- Các tài khoản/nhóm này là dữ liệu đã tạo trên DB máy này, không phải seed tự động của migration.

## 12. Câu hỏi thường gặp khi bảo vệ

| Thầy hỏi | Cách giải thích và mở code |
| --- | --- |
| Bài đăng tại sao chưa hiện? | Ngoài nhóm phải Pending trước; mở `PostService.CreateAsync`, `ApplyPersonalPublicationStateAsync`, rồi `AdminController.PostStatus` |
| Bài riêng tư có bị public sau duyệt? | Không. Duyệt thay trạng thái; phạm vi xem vẫn do Visibility và `PostAccessService.CanViewAsync` |
| Tắt lọc ở frontend có đăng từ cấm được không? | Server có `TextModeration.EnsureAllowed` được service bài/bình luận gọi lại |
| Hai admin xem cùng một bài, một người duyệt bản cũ? | Request mang RowVersion; `PostStatus` kiểm tra và trả 409 khi không khớp |
| Từ chối xong thông báo ở đâu? | `PostStatus` tạo Notification có Message; `NotificationService` đọc; app notifications mở post-reviews |
| Lý do được lưu bảng nào? | Posts.SystemModerationReason; snapshot trong Notifications.Message và AdminAuditLogs.Summary |
| Mod có phải System Admin? | Không. Một bên membership trong nhóm, một bên Identity role ADMIN |
| Logo dùng API mất tiền không? | ONNX cục bộ; mở LocalLogoDetector và file model. Provider trả phí đang tắt |
| Logo có chứng minh vi phạm? | Không. Nhãn và box hỗ trợ người quyết định; video đang xem thủ công |
| Chia sẻ local sao phải fallback? | HTTP LAN có thể thiếu Web Share/Clipboard; mở `share-web.ts` và hàm chia sẻ trong PostCard |
| Đổi nền trắng ở đâu? | ThemeContext lightColors; nút ở profile/settings; component đọc useTheme |
| Sidebar sao không cuộn theo nội dung? | AdminLayout Sider position fixed, height 100dvh, overflowY auto |

## 13. Kiểm chứng và giới hạn hiện tại

Đợt kiểm tra 12/10: 72 assertion backend đạt; admin build/lint và mobile TypeScript/lint đạt.
Kiểm thử trình duyệt đã kiểm tra form lý do, sidebar khi cuộn bài/report, chia sẻ LAN HTTP và mở thông báo từ chối.
Code kiểm tra backend: `backend/tests/SocialSport.SmokeTests/Program.cs`.
Log local: `artifacts/admin-updates-tests.log`, `artifacts/admin-browser-tests.log`, `artifacts/mobile-admin-browser-tests.log`.
Test backend dùng DB tạm; các ca UI mới dùng phản hồi API mẫu. Chưa kiểm tra trên điện thoại vật lý.
Model có kiểm thử ảnh mẫu, không phải cam kết nhận diện mọi thương hiệu/ảnh.
ImageSharp 3.1.12 vẫn có cảnh báo NuGet; việc build thành công không đồng nghĩa đã khắc phục dependency này.
