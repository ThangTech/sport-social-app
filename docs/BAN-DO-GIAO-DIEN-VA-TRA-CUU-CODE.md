# Bản đồ giao diện và cách tìm code SocialSport

Cập nhật **12/10/2026**. Dùng cùng [bản nghiệp vụ](BAO-CAO-NGHIEP-VU-VA-KIEN-TRUC-HE-THONG.md).
Đường dẫn trong tài liệu tính từ `D:/sport-social-app`. Copy đường dẫn vào **Ctrl+P** trong VS Code.

## 1. Cách tìm khi thầy hỏi “nó nằm ở đâu?”

1. **Thay giao diện:** mở màn hình trong `mobile/src/app` hoặc `admin/src/pages`.
2. **Một khối dùng nhiều màn hình:** xem các import từ `components`, sửa component chung.
3. **Nút làm gì:** tìm `onPress` (mobile), `onClick`/`onFinish` (admin), rồi lần tới handler.
4. **Gọi API nào:** mở `mobile/src/services/*.service.ts` hoặc tìm `api(` trong trang admin.
5. **Quy tắc/kiểm tra quyền:** tra route trong controller backend, sau đó mở service được gọi.
6. **Lưu đâu:** xem entity, DbContext, repository và migration; không tìm trong file giao diện.

`[id].tsx` là route động, ví dụ `post/[id].tsx` nhận ID bài viết.
`(tabs)` và `(auth)` là nhóm route Expo, không phải đoạn bắt buộc trong URL.
`_layout.tsx` tổ chức màn hình/navigator/provider, không phải nội dung từng bài viết.

## 2. Khung giao diện app, màu sắc và phiên đăng nhập

| Muốn xem/sửa | File chính | Ghi chú |
| --- | --- | --- |
| Provider và Stack toàn app; điều hướng từ push | `mobile/src/app/_layout.tsx` | ThemeProvider, AuthProvider và các route cấp app |
| Thanh tab dưới, nút mở tạo bài | `mobile/src/app/(tabs)/_layout.tsx` | Tìm cấu hình Tabs, icon và nhãn |
| Khung nhóm màn hình đăng nhập | `mobile/src/app/(auth)/_layout.tsx` | Layout auth |
| Màu tối, spacing, hằng số giao diện | `mobile/src/constants/theme.ts` | Không đặt mọi màu trực tiếp ở từng màn hình |
| Màu sáng, bật/tắt, lưu lựa chọn | `mobile/src/contexts/ThemeContext.tsx` | `lightColors`, `toggleTheme`, `useTheme` |
| Header dùng chung | `mobile/src/components/AppHeader.tsx` | Tiêu đề và hành động header |
| Font/chữ dùng chung | `mobile/src/components/ui/AppText.tsx` | Variant và màu chữ |
| Avatar dùng chung | `mobile/src/components/Avatar.tsx` | Xem nơi dùng trước khi đổi kích thước mặc định |
| Nhãn môn thể thao | `mobile/src/components/SportBadge.tsx` | Badge |
| Thông tin người đang đăng nhập | `mobile/src/contexts/AuthContext.tsx` | Đọc bằng useAuth |
| Token và lưu phiên | `mobile/src/storage/token.storage.ts` | SecureStore/native, localStorage/web |
| API base URL, token, refresh, URL ảnh | `mobile/src/services/api.ts` | Không sửa host rải rác trong từng màn hình |
| Context mở màn hình tạo bài | `mobile/src/contexts/CreatePostContext.tsx` | Chuyển callback mở form; không phải nơi lưu bài vào DB |

## 3. Màn hình đăng nhập và tài khoản

| Màn hình | File UI | Gọi dữ liệu |
| --- | --- | --- |
| Đăng nhập | `mobile/src/app/(auth)/login.tsx` | `mobile/src/services/auth.service.ts` |
| Đăng ký | `mobile/src/app/(auth)/register.tsx` | auth.service |
| Quên mật khẩu | `mobile/src/app/(auth)/forgot-password.tsx` | auth.service |
| Đặt lại mật khẩu | `mobile/src/app/(auth)/reset-password.tsx` | auth.service |
| Trang cá nhân của mình | `mobile/src/app/(tabs)/profile.tsx` | AuthContext, user/post services |
| Hồ sơ người khác | `mobile/src/app/user/[id].tsx` | `mobile/src/services/user.service.ts` |
| Sửa hồ sơ | `mobile/src/app/user/edit-profile.tsx` | user.service, image-upload |
| Cài đặt tài khoản/sáng tối | `mobile/src/app/user/settings.tsx` | AuthContext, ThemeContext |
| Người theo dõi/đang theo dõi | `mobile/src/app/user/connections.tsx` | user.service |
| Danh sách đã chặn | `mobile/src/app/user/blocked-users.tsx` | user.service |

Khối cover/avatar/tên/thống kê hồ sơ: `mobile/src/components/profile/ProfileSummary.tsx`.
Danh sách bài trong hồ sơ: `mobile/src/components/profile/ProfilePostList.tsx`.
Chỉnh/cắt ảnh avatar-cover: `mobile/src/components/image/AvatarCoverImageEditor.tsx`.
Ô upload ảnh: `mobile/src/components/image/ImageUploadField.tsx`.
Trạng thái không tìm thấy người dùng: `mobile/src/components/UserNotFound.tsx`.

## 4. Feed, khám phá và cấu trúc một thẻ bài viết

| Phần | File |
| --- | --- |
| Trang chủ/feed, tải thêm, tìm kiếm | `mobile/src/app/(tabs)/index.tsx` |
| Khám phá bài/nhóm/người dùng | `mobile/src/app/(tabs)/explore.tsx` |
| Ô gợi ý “tạo bài viết” | `mobile/src/components/CreatePostPrompt.tsx` |
| Thẻ bài hoàn chỉnh, media, state tương tác và handler chia sẻ | `mobile/src/components/PostCard.tsx` |
| Đầu thẻ: tác giả, thời gian, menu | `mobile/src/components/post/PostCardHeader.tsx` |
| Hàng reaction/bình luận/chia sẻ | `mobile/src/components/post/PostCardActions.tsx` |
| Chi tiết một bài và bình luận | `mobile/src/app/post/[id].tsx` |
| Danh sách người reaction | `mobile/src/app/post/reactions/[id].tsx` |
| Bài đã lưu | `mobile/src/app/post/saved-posts.tsx` |
| API feed | `mobile/src/services/feed.service.ts` |
| API khám phá | `mobile/src/services/explore.service.ts` |
| API bài và tương tác | `mobile/src/services/post.service.ts` |
| Chuyển DTO thành dữ liệu Post cho UI | `mobile/src/mappers/post.mapper.ts` |
| Kiểu dữ liệu thẻ bài | `mobile/src/types/post.ts` |
| Chia sẻ web/copy/fallback prompt | `mobile/src/utils/share-web.ts` |

```text
Feed / Hồ sơ / Chi tiết bài
           -> PostCard
               -> PostCardHeader
               -> nội dung và media
               -> PostCardActions
```

Đổi icon nút chia sẻ: `PostCardActions.tsx`. Đổi URL hoặc cách chia sẻ: `PostCard.tsx` và `share-web.ts`.
Đổi một component chung có thể tác động cả feed, hồ sơ và màn hình chi tiết.

## 5. Tạo và sửa bài: màn hình và các mảnh form

| Phần muốn sửa | File |
| --- | --- |
| Đăng bài cá nhân, handler gửi | `mobile/src/app/modal/create-post.tsx` — `handleCreatePost` |
| Đăng bài trong nhóm | `mobile/src/app/group/create-post/[id].tsx` |
| Sửa bài | `mobile/src/app/post/edit/[id].tsx` |
| Nội dung form, TextInput, thông tin tác giả | `mobile/src/components/post/editor/PostEditorForm.tsx` |
| Header form/nút hành động | `mobile/src/components/post/editor/PostEditorHeader.tsx` |
| Chọn Public/Followers/Private | `mobile/src/components/post/editor/PostAudienceSelector.tsx` |
| Chọn môn thể thao | `mobile/src/components/post/editor/PostSportSelector.tsx` |
| Nút chọn ảnh | `mobile/src/components/post/editor/PostImagePickerButton.tsx` |
| Xem trước ảnh | `mobile/src/components/post/editor/PostImagePreview.tsx` |
| Chuẩn bị dữ liệu upload | `mobile/src/services/image-upload.ts` |
| Lọc nội dung trước khi gửi | `mobile/src/utils/moderation.ts` |

Form chỉ hiển thị và truyền callback. Luồng create/upload/finalize nằm ở handler màn hình và service gọi API.
Ví dụ sửa placeholder/chiều cao ô nhập: PostEditorForm. Đổi quy tắc bài phải chờ duyệt: backend PostService.

## 6. Bình luận

| Phần | File |
| --- | --- |
| Danh sách và xử lý bình luận của bài | `mobile/src/components/post/PostCommentsSection.tsx` |
| Một bình luận/reply, menu, badge vai trò | `mobile/src/components/CommentItem.tsx` |
| Ô nhập và nút gửi | `mobile/src/components/post/CommentComposer.tsx` |
| HTTP tạo/sửa/xóa/lấy bình luận | `mobile/src/services/comment.service.ts` |
| Kiểu dữ liệu | `mobile/src/types/comment.ts` |
| Backend quyền và xử lý | `backend/src/SocialSport.Api/Services/Implementations/CommentService.cs` |

## 7. Nhóm và màn hình Group Admin/Moderator

**Quản trị nhóm nằm trong app người dùng**, không phải các trang System Admin ở `admin/`.

| Màn hình/khối | File |
| --- | --- |
| Tab cộng đồng, danh sách nhóm | `mobile/src/app/(tabs)/community.tsx` |
| Chi tiết nhóm, thao tác theo quyền | `mobile/src/app/group/[id].tsx` |
| Tạo nhóm | `mobile/src/app/group/create.tsx` |
| Sửa nhóm | `mobile/src/app/group/edit/[id].tsx` |
| Form nhóm dùng chung | `mobile/src/components/group/GroupForm.tsx` |
| Cover/avatar/tóm tắt nhóm | `mobile/src/components/group/GroupSummary.tsx` |
| Một nhóm trong danh sách | `mobile/src/components/group/GroupListItem.tsx` |
| Danh sách thành viên và thao tác vai trò | `mobile/src/app/group/members/[id].tsx` |
| Một hàng thành viên | `mobile/src/components/group/GroupMemberListItem.tsx` |
| Duyệt yêu cầu tham gia | `mobile/src/app/group/join-requests/[id].tsx` |
| Thành viên bị ban | `mobile/src/app/group/banned-members/[id].tsx` |
| Hàng đợi duyệt bài nhóm | `mobile/src/app/group/post-review-queue/[id].tsx` |
| Ảnh và khung nhận diện logo khi duyệt | `mobile/src/components/post/LogoReviewImage.tsx` |
| API nhóm | `mobile/src/services/group.service.ts` |
| DTO/kiểu nhóm | `mobile/src/types/group.ts` |
| Backend nghiệp vụ và kiểm tra quyền | `backend/src/SocialSport.Api/Services/Implementations/GroupService.cs` |

## 8. Thông báo, trạng thái duyệt, báo cáo và bản quyền

| Màn hình | File UI | Điểm xử lý liên quan |
| --- | --- | --- |
| Danh sách thông báo/đánh dấu đọc/nhấn mở | `mobile/src/app/notifications.tsx` | `mobile/src/services/notification.service.ts` |
| Mở app từ push | `mobile/src/app/_layout.tsx` | `mobile/src/services/push-notification.service.ts` |
| Bài cá nhân chờ duyệt/bị từ chối và lý do | `mobile/src/app/user/post-reviews.tsx` | `backend/src/SocialSport.Api/Controllers/MyPostReviewsController.cs` |
| Gửi báo cáo vi phạm | `mobile/src/app/report.tsx` | `mobile/src/services/report.service.ts` |
| Theo dõi báo cáo của mình | `mobile/src/app/user/reports.tsx` | report.service |
| Hồ sơ bản quyền/kháng nghị | `mobile/src/app/user/copyright.tsx` | `mobile/src/services/copyright.service.ts` |
| Không tìm thấy route | `mobile/src/app/+not-found.tsx` | Điều hướng |

Muốn đổi câu thông báo quyết định: sửa nơi tạo `Notification.Message` trong `AdminController.PostStatus`.
Muốn đổi cách trình bày dòng lý do: sửa `post-reviews.tsx`.
Muốn đổi loại thông báo/điều hướng: đối chiếu cả enum backend, `mobile/src/types/notification.ts`, notifications và `_layout`.

## 9. Toàn bộ nhóm giao diện System Admin

Định tuyến ở `admin/src/App.tsx`. Trang users/groups/posts **dùng chung ResourcePage**, không có ba file riêng UserPage/GroupPage/PostPage.

| Đường dẫn/màn hình | File chính | Khi sửa cần chú ý |
| --- | --- | --- |
| Đăng nhập | `admin/src/pages/LoginPage.tsx` | Hiển thị khi chưa có phiên admin |
| Khung/sidebar/header/tìm chức năng | `admin/src/components/AdminLayout.tsx` | `navigationGroups`, `Sider`, `Header`, `Content` |
| `/` Dashboard | `admin/src/pages/DashboardPage.tsx` | KPI, chart, health, recent audit |
| `/users` Người dùng | `admin/src/pages/ResourcePage.tsx` | Nhánh `resource="users"` |
| `/groups` Nhóm | `admin/src/pages/ResourcePage.tsx` | Nhánh `resource="groups"` |
| `/posts` Bài viết | `admin/src/pages/ResourcePage.tsx` | Nhánh `resource="posts"`, lọc chờ duyệt, mở review |
| Modal Xem và duyệt bài | `admin/src/components/PostReview.tsx` | Nội dung/media, lý do bắt buộc, request quyết định |
| `/reports` Báo cáo | `admin/src/pages/ReportsPage.tsx` | List và `ReportInspection`; media ở `ProtectedReportMedia` |
| `/copyright` Bản quyền | `admin/src/pages/CopyrightPage.tsx` | Hồ sơ, quyết định/kháng nghị |
| `/sports` Môn thể thao | `admin/src/pages/SportsPage.tsx` | Table và form danh mục |
| `/roles` Vai trò | `admin/src/pages/RolesPage.tsx` | Cấp/thu hồi System Admin |
| `/operations` Vận hành | `admin/src/pages/OperationsPage.tsx` | Task/change request |
| `/incidents` Sự cố/dự phòng | `admin/src/pages/IncidentsPage.tsx` | Incident/contingency plan |
| `/audit` Nhật ký | `admin/src/pages/AuditPage.tsx` | Actor/action/target/summary/thời gian |
| Tiêu đề và trạng thái trang dùng chung | `admin/src/components/ui.tsx` | PageHeader, PageState |
| Theme Ant Design toàn cục | `admin/src/main.tsx` | ConfigProvider và tokens |
| CSS toàn cục/Tailwind | `admin/src/index.css` | Kiểu nền/tổng thể |
| Các chuỗi class tiện ích | `admin/src/lib/styles.ts` | Kiểm tra import trước khi đổi vì không phải mọi nút đều dùng |
| HTTP, token, app link, định dạng ngày | `admin/src/lib/api.ts` | API base URL và hàm api/apiBlob |
| Kiểu response dùng chung | `admin/src/lib/types.ts` | PageData, AdminRow... |

Sidebar đứng yên nhờ style `position: "fixed"`, `height: "100dvh"`, `overflowY: "auto"` tại AdminLayout.
Main Layout có marginLeft bù chiều rộng sidebar. Sửa width phải xem cả margin và trạng thái collapsed/mobile.
Màu Ant Design có thể ghi đè utility class; kiểm tra computed style nếu class đã đổi nhưng giao diện chưa đổi.

## 10. Bài tập sửa giao diện thường gặp

| Thầy yêu cầu | Mở file nào trước | Thao tác cần tìm |
| --- | --- | --- |
| Đổi nền sáng thành trắng | `mobile/src/contexts/ThemeContext.tsx` | `lightColors.background`; không đổi màu tối ngoài ý muốn |
| Đổi nút sáng/tối ở cá nhân | `mobile/src/app/(tabs)/profile.tsx` hoặc `mobile/src/app/user/settings.tsx` | `toggleTheme`, icon/Switch |
| Đổi font/khoảng cách cả app | `mobile/src/components/ui/AppText.tsx`, `mobile/src/constants/theme.ts` | Typography và SPACING; vẫn có style riêng từng màn hình |
| Đổi nhãn/icon tab | `mobile/src/app/(tabs)/_layout.tsx` | Cấu hình Tabs.Screen |
| Thẻ bài bo góc hơn, ảnh cao hơn | `mobile/src/components/PostCard.tsx` | JSX và `createStyles`/StyleSheet ở cuối file |
| Đổi hàng nút tương tác | `mobile/src/components/post/PostCardActions.tsx` | Pressable và icon/text; giữ callback handler |
| Đưa nút Đăng sang vị trí khác | `mobile/src/components/post/editor/PostEditorHeader.tsx` | Bố trí header; kiểm tra màn hình truyền callback |
| Thay ô nhập nội dung | `mobile/src/components/post/editor/PostEditorForm.tsx` | TextInput và styles |
| Đổi kiểu comment | `mobile/src/components/CommentItem.tsx` | Avatar, tên, reply, badge, nội dung |
| Đổi cover/tên nhóm | `mobile/src/components/group/GroupSummary.tsx` | Layout phần tóm tắt |
| Đổi card duyệt bài nhóm | `mobile/src/app/group/post-review-queue/[id].tsx` | Card và nút duyệt; LogoReviewImage nếu sửa khung ảnh |
| Đổi sidebar admin | `admin/src/components/AdminLayout.tsx` | navigationGroups, width, background, collapsed |
| Thêm cột trong bảng bài admin | `admin/src/pages/ResourcePage.tsx` | Columns theo resource; kiểm tra DTO có trường cần dùng |
| Đổi form lý do duyệt/từ chối | `admin/src/components/PostReview.tsx` | Input.TextArea, reason state, submit |
| Đổi layout báo cáo hai cột | `admin/src/pages/ReportsPage.tsx` | List và ReportInspection |
| Đổi cách hiển thị nhật ký | `admin/src/pages/AuditPage.tsx` | Columns/DisplaySummary; nội dung thật từ backend |
| Đổi URL server | `mobile/src/services/api.ts`, `admin/src/lib/api.ts` và env | Đừng sửa component giao diện |

Với mobile: tìm `const styles = createStyles(COLORS)` và khối `StyleSheet.create`.
Thay padding/margin/fontSize/borderRadius ở style tương ứng, dùng màu từ `useTheme` để cả hai chế độ hoạt động.
Với admin: kiểm tra JSX Ant Design, thuộc tính `style`, `className`, và theme token trong main.tsx.

## 11. Ví dụ lần theo một nút từ UI xuống database

### Ví dụ A — từ chối bài cá nhân

```text
admin/src/pages/ResourcePage.tsx
 -> admin/src/components/PostReview.tsx (reason, nút từ chối)
 -> admin/src/lib/api.ts (PATCH /admin/posts/{id}/status)
 -> backend/src/SocialSport.Api/Controllers/AdminController.cs : PostStatus
 -> Post.SystemModerationReason + Notification.Message + AdminAuditLog.Summary
 -> SaveChangesAsync
 -> mobile/src/app/notifications.tsx
 -> mobile/src/app/user/post-reviews.tsx
```

### Ví dụ B — duyệt người tham gia nhóm riêng tư

```text
mobile/src/app/group/join-requests/[id].tsx
 -> mobile/src/services/group.service.ts
 -> backend/src/SocialSport.Api/Controllers/GroupController.cs : Approve
 -> backend/src/SocialSport.Api/Services/Implementations/GroupService.cs : ApproveMemberAsync
 -> GroupMember.Status = Active và thông báo
```

### Ví dụ C — sửa hàng nút chia sẻ

```text
PostCardActions.tsx : giao diện nút
 -> PostCard.tsx : handleShare và dựng URL
 -> utils/share-web.ts : Web Share / clipboard / manual copy
```

## 12. Cách mở/tìm nhanh và kiểm tra sau khi sửa

Các lệnh chạy ở thư mục gốc dự án trong PowerShell:

```powershell
# Tìm các nơi dùng component
rg -n 'PostCardActions' mobile/src

# Tìm quy tắc duyệt bài
rg -n 'SystemModerationStatus|PostStatus\(' backend/src/SocialSport.Api

# Tìm vị trí tạo và hiển thị lý do
rg -n 'SystemModerationReason|DisplaySummary|request.Reason' backend/src/SocialSport.Api admin/src mobile/src
```

Đường dẫn có `(tabs)` hoặc `[id]` cần dùng chuỗi có nháy và `-LiteralPath` khi đọc bằng PowerShell:

```powershell
Get-Content -LiteralPath 'mobile/src/app/(tabs)/profile.tsx'
Get-Content -LiteralPath 'mobile/src/app/group/[id].tsx'
```

Sau sửa mobile: trong thư mục `mobile`, chạy `npx tsc --noEmit`, `npm run lint`, rồi mở màn hình kiểm tra.
Sau sửa admin: trong thư mục `admin`, chạy `npm run build`, `npm run lint`, rồi kiểm tra trên trình duyệt.
Nếu chỉ đổi UI thì giữ nguyên callback và dữ liệu truyền xuống; nếu thêm trường mới cần cập nhật cả DTO/service/API tương ứng.
Trước build backend, dừng phiên `dotnet run` cũ bằng Ctrl+C để tránh lỗi MSB3021 khóa file exe.
Các bước chạy đầy đủ ở [LOCAL-SETUP.md](LOCAL-SETUP.md).
