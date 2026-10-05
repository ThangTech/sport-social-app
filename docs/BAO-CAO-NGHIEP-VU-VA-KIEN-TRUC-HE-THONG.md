# Báo cáo nghiệp vụ và kiến trúc hệ thống SocialSport

> Ngày rà soát: 05/10/2026
>
> Phạm vi: `backend/`, `mobile/`, `admin/` tại trạng thái working tree hiện tại
>
> Mục đích: mô tả contract API, nghiệp vụ, phân quyền, lưu phiên, luồng dữ liệu từ API lên màn hình và các phần còn thiếu/rủi ro.

## 1. Tóm tắt hệ thống

SocialSport là monorepo gồm ba ứng dụng:

| Thành phần | Công nghệ | Trách nhiệm |
| --- | --- | --- |
| Backend | ASP.NET Core 9, EF Core, SQL Server, ASP.NET Identity | Xác thực, phân quyền, nghiệp vụ, lưu dữ liệu, upload, media có chữ ký, thông báo, báo cáo, bản quyền và API System Admin |
| Mobile/Web người dùng | Expo 54, React Native 0.81, Expo Router | Auth, Feed, bài viết, bình luận, hồ sơ, nhóm, khám phá, thông báo, báo cáo, bản quyền và chia sẻ link |
| Web System Admin | React 19, Vite 8, Ant Design 6, Ant Design Charts, Tailwind CSS 4 | Dashboard, người dùng, nhóm, bài viết, báo cáo, bản quyền, thẻ thể thao, quyền Admin, vận hành, sự cố và audit log |

Luồng tổng quát:

```text
Mobile / Expo Web                         Admin Web
        |                                    |
        | Bearer access token                | Bearer access token
        +----------------+-------------------+
                         |
                  ASP.NET Core API
                         |
       +-----------------+-------------------+
       |                 |                   |
   SQL Server       Upload storage      Dịch vụ tùy chọn
   nghiệp vụ        ảnh/video           Expo Push,
                                        Google Vision,
                                        ACRCloud
```

Nguyên tắc hiện có:

- Backend là nguồn sự thật cho quyền và trạng thái nghiệp vụ.
- Mobile/Admin chỉ ẩn hoặc hiện nút theo dữ liệu nhận được; không thay thế kiểm tra quyền tại API.
- Quyền System Admin và quyền trong nhóm là hai hệ quyền độc lập.
- Bản quyền từ AI/nhà cung cấp chỉ là tín hiệu; System Admin là người ra quyết định cuối cùng.
- Bài viết, nhóm và bình luận chủ yếu dùng trạng thái để ẩn/gỡ/xóa mềm; dữ liệu không bị xóa cứng trong luồng người dùng thông thường.

## 2. Kiến trúc Backend

### 2.1. Các lớp chính

| Lớp | Vị trí | Vai trò |
| --- | --- | --- |
| Controllers | `backend/src/SocialSport.Api/Controllers` | Nhận HTTP request, lấy user ID từ JWT, gọi service và trả DTO |
| Services | `backend/src/SocialSport.Api/Services/Implementations` | Quy tắc nghiệp vụ, quyền theo đối tượng, thông báo, xử lý media, báo cáo và bản quyền |
| Repositories | `backend/src/SocialSport.Api/Repositories` | Truy vấn và lưu các aggregate phổ biến như Post, Group, Comment, Follow |
| EF Core DbContext | `backend/src/SocialSport.Api/Data/ApplicationDbContext.cs` | Identity và các bảng nghiệp vụ |
| Entities/Enums | `backend/src/SocialSport.Api/Models` | Mô hình lưu trữ và trạng thái |
| DTOs | `backend/src/SocialSport.Api/DTOs` | Contract request/response của API |
| Middleware | `backend/src/SocialSport.Api/Middleware/GlobalExceptionHandler.cs` | Chuẩn hóa lỗi thành Problem Details |

Các nhóm dữ liệu chính trong database:

- Identity: users, roles, user roles và refresh tokens.
- Social: follows, user blocks, posts, post media, reactions, saved posts và comments.
- Groups: groups và group members.
- Trust & Safety: reports, notifications, device tokens, copyright assets/cases và external copyright scans.
- System Admin: audit logs, operational tasks, change requests, incidents và contingency plans.
- Danh mục: sports.

### 2.2. Xử lý lỗi HTTP

Backend trả `application/problem+json`/Problem Details với các trường chính:

```json
{
  "title": "Forbidden",
  "status": 403,
  "detail": "Bạn không có quyền thực hiện thao tác này.",
  "traceId": "..."
}
```

Ánh xạ hiện tại:

| Exception | HTTP | Ý nghĩa |
| --- | --- | --- |
| `InvalidOperationException` | 400 | Dữ liệu hoặc chuyển trạng thái nghiệp vụ không hợp lệ |
| Authentication middleware | 401 | Thiếu/sai/hết hạn access token |
| `UnauthorizedAccessException` | 403 | Đã xác định request nhưng không có quyền theo vai trò hoặc đối tượng |
| `KeyNotFoundException` | 404 | Đối tượng không tồn tại hoặc cố ý không để lộ đối tượng không được xem |
| Exception khác | 500 | Lỗi hệ thống; response không trả stack trace, log server gắn `traceId` |

## 3. Xác thực, phiên đăng nhập và nơi lưu biến

### 3.1. Contract xác thực Backend

Đăng nhập và đăng ký trả:

- `accessToken`: JWT chứa user ID, username, email, JTI và role.
- `accessTokenExpiresAt`: thời điểm hết hạn access token.
- `refreshToken`: chuỗi ngẫu nhiên 64 byte ở dạng Base64.
- `refreshTokenExpiresAt`: thời điểm hết hạn refresh token.
- `user`: thông tin tài khoản và danh sách role.

Backend chỉ lưu SHA-256 của refresh token, không lưu raw refresh token. Khi refresh:

1. Client gửi raw refresh token.
2. Backend hash token và tìm bản ghi.
3. Token cũ bị đánh dấu `RevokedAt`.
4. Backend phát access token và refresh token mới.

Reset mật khẩu cập nhật security stamp và thu hồi toàn bộ refresh token của user. Access token đã phát vẫn sống tới hết hạn vì chưa có blacklist/revocation theo JTI.

Tương tự, khi System Admin khóa user hoặc thu hồi role `ADMIN`, JWT cũ vẫn chứa trạng thái role tại thời điểm phát và có thể tiếp tục được chấp nhận đến khi hết hạn. Muốn vô hiệu hóa ngay cần thêm kiểm tra security stamp/token version hoặc cơ chế revoke access token.

### 3.2. Storage của Mobile và Expo Web

| Biến | Android/iOS | Expo Web | Ghi chú |
| --- | --- | --- | --- |
| `accessToken` | Expo `SecureStore` | `localStorage` key `socialsport.accessToken` | Gắn vào Bearer header |
| `refreshToken` | Expo `SecureStore` | `localStorage` key `socialsport.refreshToken` | Dùng rotation khi access token gần hết hạn/nhận 401 |
| `accessTokenExpiresAt` | Expo `SecureStore` | `localStorage` key có prefix `socialsport.` | Chủ động refresh trước hạn 2 phút |
| `refreshTokenExpiresAt` | Expo `SecureStore` | `localStorage` key có prefix `socialsport.` | Được lưu nhưng hiện chưa được client đọc để dự báo hết phiên |
| `expoPushToken` | Expo `SecureStore` | Không lưu trên Web | Chỉ đăng ký trên thiết bị Android/iOS thật |
| `socialsport.pendingPath` | Biến memory | `sessionStorage` | Giữ route người dùng định mở, ví dụ `/post/{id}`, trong quá trình chuyển sang Login |
| `user` hiện tại | React state trong `AuthContext` | React state trong `AuthContext` | Mất khi reload và được phục hồi bằng `GET /auth/me` |

Không có password được lưu trong client storage.

Luồng khôi phục phiên Mobile:

1. `AuthProvider` đọc access token.
2. Nếu có token, gọi `GET /auth/me` qua API client.
3. API client chủ động refresh nếu access token còn không quá 2 phút.
4. Nếu request nhận 401, chỉ một refresh request được chạy; các request khác dùng chung `refreshPromise`.
5. Refresh thành công thì request ban đầu được gọi lại một lần.
6. Refresh thất bại thì xóa token và đưa người dùng về Login.
7. Sau Login thành công, app lấy `pendingPath` và mở lại nội dung người dùng định xem.

Lưu ý bảo mật:

- `SecureStore` phù hợp hơn cho native vì dữ liệu được đưa vào kho bảo mật của hệ điều hành.
- Trên Web, `localStorage` đọc được bằng JavaScript. Nếu có XSS, token có thể bị lấy. Đây là giới hạn hiện tại của Expo Web.
- `sessionStorage` chỉ giữ đường dẫn điều hướng, không giữ token. Nó bị xóa khi tab đóng.

### 3.3. Storage của Admin Web

Admin không dùng `sessionStorage` và không dùng Secure Storage.

| Biến | Nơi lưu | Vòng đời |
| --- | --- | --- |
| `adminAccessToken` | `localStorage` | Còn sau khi đóng/mở lại trình duyệt, tới khi logout, nhận 401 hoặc người dùng tự xóa storage |
| User Admin hiện tại | Không lưu | Header đang hiển thị nhãn tĩnh `System Admin`/`SA` |
| Refresh token | Không lưu | Admin không có refresh flow |

Luồng Admin:

1. `POST /auth/login`.
2. UI kiểm tra response có role `ADMIN`.
3. Lưu duy nhất access token vào `localStorage`.
4. Mỗi API request đọc token và gắn `Authorization: Bearer`.
5. Nhận 401 thì xóa token, phát event `admin-session-expired` và hiện lại Login.
6. Nhận 403 thì giữ phiên và hiển thị lỗi không có quyền.
7. Nút Logout chỉ xóa local token; không gọi `POST /auth/logout`.

Backend vẫn kiểm tra `[Authorize(Roles = "ADMIN")]` cho mọi API quản trị. Việc client thấy key trong `localStorage` chỉ là guard giao diện, không phải lớp bảo mật thực sự.

## 4. Vai trò và phân quyền

### 4.1. Role toàn hệ thống

| Role | Phạm vi |
| --- | --- |
| `USER` | Người dùng thông thường, được gán khi đăng ký |
| `ADMIN` | System Admin, được gọi toàn bộ `/api/v1/admin/*` và các action bản quyền cấp hệ thống |

Migration chỉ seed role `USER`, `ADMIN` và danh mục thể thao; không seed tài khoản/mật khẩu Admin mặc định. Đây là lựa chọn an toàn, nhưng cần có thủ tục bootstrap Admin cho môi trường mới.

### 4.2. Vai trò trong nhóm

| Khái niệm | Cách lưu | Quyền chính |
| --- | --- | --- |
| Owner/Chủ nhóm | `Group.OwnerId` | Sửa/xóa nhóm, ảnh nhóm, cấp Admin, quản lý mọi thành viên, duyệt/gỡ bài |
| Group Admin | `GroupMemberRole.Admin` | Duyệt thành viên, phân vai theo giới hạn, quản lý thành viên/bài viết nhưng không được xóa nhóm |
| Moderator | `GroupMemberRole.Moderator` | Duyệt/gỡ bài và quản lý Member theo giới hạn |
| Member | `GroupMemberRole.Member` | Xem/tương tác/đăng bài theo chính sách nhóm |

Khi tạo nhóm, Owner vừa được lưu ở `OwnerId`, vừa có membership role `Admin`. Vì vậy nghiệp vụ phải kiểm tra `OwnerId` ở các thao tác chỉ dành riêng cho chủ nhóm, đặc biệt là xóa nhóm.

Group Owner/Admin/Moderator không tự động có role hệ thống `ADMIN`; gọi API System Admin phải nhận 403.

## 5. Danh mục API người dùng

Ký hiệu quyền:

- `Public`: không bắt buộc đăng nhập, nhưng có thể trả dữ liệu khác khi có JWT.
- `JWT`: bắt buộc access token hợp lệ.
- `ADMIN`: bắt buộc role hệ thống `ADMIN`.

### 5.1. Auth

| Method | Route | Quyền | Nghiệp vụ |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Public | Tạo user, gán role `USER`, phát token |
| POST | `/api/v1/auth/login` | Public | Kiểm tra email/password và `UserStatus.Active`, phát token |
| POST | `/api/v1/auth/refresh` | Public | Rotation refresh token và phát cặp token mới |
| POST | `/api/v1/auth/logout` | JWT | Thu hồi refresh token thuộc user hiện tại |
| GET | `/api/v1/auth/me` | JWT | Trả user và roles hiện tại |
| POST | `/api/v1/auth/forgot-password` | Public | Gửi email nhưng không để lộ email có tồn tại hay không |
| POST | `/api/v1/auth/reset-password` | Public | Đổi mật khẩu, đổi security stamp, thu hồi refresh token |

### 5.2. Người dùng, follow và block

| Method | Route | Quyền | Nghiệp vụ |
| --- | --- | --- | --- |
| GET | `/api/v1/users/{id}` | Public | Hồ sơ; dữ liệu quan hệ phụ thuộc người xem |
| PATCH | `/api/v1/users/me` | JWT | Sửa hồ sơ của mình |
| PUT/DELETE | `/api/v1/users/me/avatar` | JWT | Upload hoặc xóa avatar |
| PUT/DELETE | `/api/v1/users/me/cover` | JWT | Upload hoặc xóa cover |
| GET | `/api/v1/users/{id}/followers` | Public | Danh sách người theo dõi |
| GET | `/api/v1/users/{id}/following` | Public | Danh sách đang theo dõi |
| POST/DELETE | `/api/v1/users/{id}/follow` | JWT | Theo dõi/bỏ theo dõi; follow tạo thông báo |
| POST/DELETE | `/api/v1/users/{id}/block` | JWT | Chặn/bỏ chặn; ảnh hưởng khả năng xem bài giữa hai người |
| GET | `/api/v1/users/me/blocked-users` | JWT | Danh sách đã chặn |

### 5.3. Feed, khám phá và danh mục

| Method | Route | Quyền | Phân trang/lọc |
| --- | --- | --- | --- |
| GET | `/api/v1/feed` | JWT | Cursor, `limit`, `search` |
| GET | `/api/v1/explore/posts` | JWT | Page/pageSize, search, sportId, recommended/latest |
| GET | `/api/v1/explore/groups` | JWT | Page/pageSize, search, recommended/latest |
| GET | `/api/v1/explore/users` | JWT | Page/pageSize, search, recommended/latest |
| GET | `/api/v1/sports` | Public | Danh sách sport đang hoạt động |

### 5.4. Bài viết và media

| Method | Route | Quyền | Nghiệp vụ |
| --- | --- | --- | --- |
| POST | `/api/v1/posts` | JWT | Tạo bài cá nhân; có media thì tạo trạng thái ẩn chờ upload/finalize |
| GET | `/api/v1/posts/{id}` | Public | Xem nếu qua PostAccess |
| PATCH | `/api/v1/posts/{id}` | JWT | Chỉ tác giả sửa; đổi Private sang phạm vi rộng có thể kích hoạt scan |
| DELETE | `/api/v1/posts/{id}` | JWT | Xóa mềm bằng `PostStatus.Deleted` + `DeletedAt` |
| POST | `/api/v1/posts/{id}/media` | JWT | Upload media của bài |
| PUT | `/api/v1/posts/{postId}/media/{mediaId}` | JWT | Thay media |
| DELETE | `/api/v1/posts/{postId}/media/{mediaId}` | JWT | Xóa media và dữ liệu review liên quan |
| POST | `/api/v1/posts/{id}/finalize` | JWT | Chốt trạng thái xuất bản bài cá nhân có media |
| POST/DELETE | `/api/v1/posts/{id}/reactions` | JWT | Thả/gỡ cảm xúc; tạo notification khi là người khác |
| GET | `/api/v1/posts/{id}/reactions` | Public | Cursor pagination danh sách reaction |
| POST/DELETE | `/api/v1/posts/{id}/save` | JWT | Lưu/bỏ lưu bài |
| GET | `/api/v1/posts/saved` | JWT | Danh sách bài đã lưu |
| GET | `/api/v1/users/{userId}/posts` | Public | Bài của user mà người xem có quyền xem |
| GET | `/api/v1/media/posts/{mediaId}?token=...` | Signed URL | Stream ảnh/video, hỗ trợ range cho video |

Quy tắc PostAccess:

- Chỉ bài `Published` mới được xem/tương tác bình thường.
- User bị block theo một trong hai chiều không xem được bài của nhau.
- Bài cá nhân Public: mọi người xem được.
- Bài Followers: chỉ follower đăng nhập xem được.
- Bài Private: chỉ tác giả xem được.
- Bài nhóm Public: người ngoài xem được nhưng chỉ thành viên Active mới tương tác.
- Bài nhóm Private: chỉ thành viên Active xem được.
- Member bị ban không được xem/tương tác bài nhóm.

Media bài viết không được public trực tiếp qua static files. DTO chứa signed URL 15 phút. Endpoint media kiểm tra token, trạng thái bài và trạng thái nhóm trước khi stream. Tuy nhiên token là capability URL, chưa gắn với user cụ thể; ai có URL còn hạn có thể dùng URL đó.

### 5.5. Bình luận

| Method | Route | Quyền | Nghiệp vụ |
| --- | --- | --- | --- |
| GET | `/api/v1/posts/{postId}/comments` | Public | Kiểm tra quyền xem bài, trả cây comment/replies |
| POST | `/api/v1/posts/{postId}/comments` | JWT | Tạo comment hoặc reply qua `parentCommentId` |
| PATCH | `/api/v1/comments/{id}` | JWT | Chỉ tác giả sửa |
| DELETE | `/api/v1/comments/{id}` | JWT | Tác giả xóa; Owner/Admin/Moderator gỡ theo hierarchy nhóm |

Nghiệp vụ bổ sung:

- Nội dung 1–3000 ký tự.
- Chặn tối đa từ comment thứ 6 trong một phút cho cùng user.
- Bộ lọc ngôn từ chuẩn hóa chữ thường, bỏ dấu, bỏ ký tự ngăn cách và kiểm tra cả chuỗi compact.
- Danh sách từ cấm hiện cấu hình tĩnh trong `appsettings.json`; chưa có trang Admin quản lý từ khóa, chưa có AI moderation.
- Reply tạo notification cho tác giả comment cha; comment tạo notification cho tác giả bài.
- DTO trả `ReplyToUserName` để Mobile hiển thị người được trả lời.
- Bình luận trong nhóm hiển thị badge `Chủ nhóm`, `Quản trị viên`, `Kiểm duyệt viên`; Member không cần badge.
- Comment đã xóa/gỡ vẫn giữ node với nội dung thay thế, tránh làm gãy cây reply.

### 5.6. Nhóm

| Method | Route | Quyền | Nghiệp vụ |
| --- | --- | --- | --- |
| POST | `/api/v1/groups` | JWT | Tạo nhóm, user trở thành Owner |
| GET | `/api/v1/groups` | Public/JWT | Cursor, search, scope All/Public/Private/Joined |
| GET | `/api/v1/groups/{id}` | Public/JWT | Chi tiết nhóm Active |
| PATCH | `/api/v1/groups/{id}` | JWT | Sửa theo quyền quản lý |
| PUT/DELETE | `/api/v1/groups/{id}/avatar` | JWT | Owner thay/xóa avatar |
| PUT/DELETE | `/api/v1/groups/{id}/cover` | JWT | Owner thay/xóa cover |
| DELETE | `/api/v1/groups/{id}` | JWT | Chỉ Owner; xóa mềm `Removed` + `DeletedAt` |
| POST | `/api/v1/groups/{id}/join` | JWT | Public vào Active ngay; Private tạo Pending |
| DELETE | `/api/v1/groups/{id}/leave` | JWT | Rời nhóm hoặc hủy Pending; Owner không được rời |
| GET | `/api/v1/groups/{id}/members` | Public/JWT | Private chỉ member Active; banned bị từ chối |
| GET | `/api/v1/groups/{id}/join-requests` | JWT | Owner/Group Admin |
| POST | `/api/v1/groups/{id}/join-requests/{userId}/approve` | JWT | Duyệt và gửi notification |
| DELETE | `/api/v1/groups/{id}/join-requests/{userId}` | JWT | Từ chối và gửi notification |
| PATCH | `/api/v1/groups/{id}/members/{userId}/role` | JWT | Phân vai theo hierarchy |
| DELETE | `/api/v1/groups/{id}/members/{userId}` | JWT | Xóa member theo hierarchy |
| POST | `/api/v1/groups/{id}/members/{userId}/ban` | JWT | Ban, đưa role về Member |
| GET | `/api/v1/groups/{id}/members/banned` | JWT | Owner/Group Admin |
| DELETE | `/api/v1/groups/{id}/members/{userId}/ban` | JWT | Bỏ ban |
| POST | `/api/v1/groups/{id}/posts` | JWT | Thành viên đăng bài nhóm |
| GET | `/api/v1/groups/{id}/post-review-queue` | JWT | Owner/Admin/Moderator xem hàng đợi |
| POST | `/api/v1/groups/{id}/post-review-queue/{postId}/approve` | JWT | Duyệt bài và thông báo tác giả |
| POST | `/api/v1/groups/{id}/post-review-queue/{postId}/reject` | JWT | Từ chối bài và thông báo tác giả |
| GET | `/api/v1/groups/{id}/posts` | Public/JWT | Cursor, tuân thủ privacy/member/ban |
| DELETE | `/api/v1/groups/{id}/posts/{postId}` | JWT | Gỡ bài theo hierarchy nhóm |

Luồng kiểm duyệt bài nhóm:

- Owner, Group Admin và Moderator đăng bài được duyệt ngay.
- Member đăng bài vào `GroupPostModerationStatus.Pending`, bài ở trạng thái ẩn.
- Người có quyền xem hàng đợi rồi Approve/Reject.
- System Admin không cần xử lý hàng đợi thường ngày của nhóm; System Admin chỉ xử lý vi phạm toàn hệ thống, report hoặc bản quyền.

### 5.7. Thông báo

| Method | Route | Quyền | Nghiệp vụ |
| --- | --- | --- | --- |
| GET | `/api/v1/notifications` | JWT | Cursor pagination, tối đa 50/trang |
| GET | `/api/v1/notifications/unread-count` | JWT | Badge thật theo DB |
| PATCH | `/api/v1/notifications/{id}/read` | JWT | Chỉ chủ notification được đánh dấu |
| PATCH | `/api/v1/notifications/read-all` | JWT | Đánh dấu tất cả của user hiện tại |
| DELETE | `/api/v1/notifications` | JWT | Xóa toàn bộ notification của user hiện tại |
| POST/DELETE | `/api/v1/notifications/devices` | JWT | Đăng ký/vô hiệu Expo push token |

Sự kiện đang có:

- Người khác follow.
- Người khác reaction/comment/reply bài.
- Kết quả join group.
- Bài nhóm chờ duyệt/được duyệt/bị từ chối.
- Bản quyền đang review, vi phạm, được bác bỏ, kết quả appeal và kết quả external scan.

Khi trả danh sách, Backend dựng message tiếng Việt và chỉ gắn `postId`/`groupId` nếu đối tượng còn tồn tại và user còn quyền. Mobile vì vậy có thể báo “nội dung không còn khả dụng” thay vì mở link hỏng.

### 5.8. Báo cáo

| Method | Route | Quyền | Nghiệp vụ |
| --- | --- | --- | --- |
| POST | `/api/v1/reports` | JWT | Báo cáo User/Post/Comment/Group |
| GET | `/api/v1/reports/me` | JWT | Tối đa 100 báo cáo gần nhất của chính user |
| GET | `/api/v1/reports/{id}` | JWT | Chỉ reporter sở hữu report được xem |

Quy tắc:

- Lý do hợp lệ: `spam`, `harassment`, `hate`, `violence`, `sexual`, `impersonation`, `other`.
- `other` bắt buộc mô tả; mô tả tối đa 3000 ký tự.
- Không được tự báo cáo mình/nội dung của mình.
- Chỉ báo cáo đối tượng user thật sự xem được.
- Không tạo trùng khi report trước cùng reporter/target còn Pending hoặc Reviewing.
- Tối đa 10 report/user/24 giờ.
- Người dùng chỉ thấy report của mình; System Admin xem toàn hệ thống.
- Đổi trạng thái report không tự động gỡ đối tượng. Gỡ/khóa là hành động riêng và có audit riêng.

### 5.9. Bản quyền và AI bên thứ ba

| Method | Route | Quyền | Nghiệp vụ |
| --- | --- | --- | --- |
| GET | `/api/v1/copyright/cases/me` | JWT | Case đối chiếu reference của user |
| POST | `/api/v1/copyright/cases/{id}/appeal` | JWT | Kháng nghị case đã xác nhận |
| GET | `/api/v1/copyright/external-scans/me` | JWT | Kết quả quét AI/provider của user |
| POST | `/api/v1/copyright/external-scans/{id}/appeal` | JWT | Kháng nghị vi phạm từ external scan |
| POST | `/api/v1/copyright/assets` | ADMIN | Đăng ký reference nội bộ |
| GET | `/api/v1/copyright/cases` | ADMIN | Hàng đợi case nội bộ |
| GET | `/api/v1/copyright/assets/{id}/media` | ADMIN | Media reference bảo vệ |
| GET | `/api/v1/copyright/cases/{id}/media` | ADMIN | Media bị match bảo vệ |
| PATCH | `/api/v1/copyright/cases/{id}/decision` | ADMIN | Quyết định case/appeal |
| GET | `/api/v1/copyright/external-scans` | ADMIN | Hàng đợi scan phân trang |
| GET | `/api/v1/copyright/external-scans/{id}/media` | ADMIN | Media cần review |
| POST | `/api/v1/copyright/external-scans/{id}/refresh` | ADMIN | Gọi lại provider |
| PATCH | `/api/v1/copyright/external-scans/{id}/decision` | ADMIN | Xác nhận vi phạm/cho phép/appeal |

Luồng hiện tại:

1. Upload luôn tính SHA-256 cho ảnh/video.
2. Ảnh còn được tính perceptual hash.
3. Internal reference matching tồn tại trong code nhưng mặc định `InternalReferenceMatchingEnabled=false`.
4. Bài Private ngoài nhóm không gửi media sang bên thứ ba.
5. Bài Public/Followers hoặc bài trong nhóm có thể gửi ảnh sang Google Vision nếu bật và video sang ACRCloud nếu bật.
6. Google Vision dùng Web Detection để tìm ảnh trùng/ảnh gần giống/trang liên quan. Đây không phải bằng chứng quyền sở hữu.
7. ACRCloud nhận dạng âm thanh trong video; hiện sample tối đa 5 MB.
8. Có tín hiệu thì bài bị ẩn và vào hàng đợi System Admin.
9. Provider lỗi được ghi trạng thái `Failed`; Admin có thể quét lại hoặc quyết định thủ công.
10. Admin quyết định vi phạm/không vi phạm. Quyết định vi phạm gỡ bài; cho phép có thể khôi phục nếu không còn blocker khác.
11. User nhận notification, xem kết luận và có một luồng kháng nghị trong thời hạn cấu hình.

Trạng thái tích hợp tại repo:

- Google Vision và ACRCloud đều là tùy chọn, mặc định tắt.
- Credential chỉ đọc từ `.env`/environment, không được đưa vào Git.
- Admin hiện tập trung vào external signals. Mobile vẫn còn mục “Đối chiếu reference”; khi matching nội bộ tắt và Admin không tạo reference, mục này sẽ luôn rỗng. Đây là phần legacy nên bỏ hoặc ẩn để UI nhất quán.
- Trạng thái `Failed` hiện được loại khỏi danh sách blocker khi finalize/approve, tức chính sách kỹ thuật đang là **fail-open**: bài có thể được xuất bản dù provider lỗi. Nếu bài tập yêu cầu “mọi kết quả AI đều vào hàng đợi Admin”, logic này cần đổi hoặc ít nhất phải được chốt thành chính sách rõ ràng.

## 6. API System Admin chi tiết

Tất cả route dưới đây bắt buộc role `ADMIN` tại Backend.

### 6.1. Dashboard và health

| Method | Route | Dữ liệu/hiển thị |
| --- | --- | --- |
| GET | `/api/v1/admin/dashboard` | Tổng user/group/post/sport, report/copyright pending, task/incident mở, activity 7 ngày, 8 audit gần nhất |
| GET | `/api/v1/admin/health` | Trạng thái API, kết nối DB và thư mục upload |

Dashboard Admin biến dữ liệu thật thành:

- 4 KPI cards.
- Column chart cho tổng user/group/post/report phát sinh trong 7 ngày.
- Donut chart phân bổ tổng dữ liệu hiện tại.
- Danh sách health service.
- Quick actions và timeline audit.

Biểu đồ 7 ngày hiện là số tổng hợp của cả khoảng 7 ngày, chưa phải chuỗi từng ngày.

### 6.2. Quản lý tài nguyên hệ thống

| Method | Route | Nghiệp vụ |
| --- | --- | --- |
| GET | `/api/v1/admin/users?page&pageSize` | Danh sách user phân trang |
| PATCH | `/api/v1/admin/users/{id}/status` | Active/Suspended/Banned/Deactivated; cấm Admin tự đổi trạng thái mình |
| GET | `/api/v1/admin/groups?page&pageSize` | Danh sách nhóm phân trang |
| PATCH | `/api/v1/admin/groups/{id}/status` | Active/Hidden/Removed, ghi audit |
| GET | `/api/v1/admin/posts?page&pageSize` | Danh sách bài phân trang |
| PATCH | `/api/v1/admin/posts/{id}/status` | Published/Hidden/Removed/Deleted, ghi audit |
| PATCH | `/api/v1/admin/comments/{id}/remove` | Gỡ comment vi phạm, giữ tombstone và ghi audit |
| GET | `/api/v1/admin/post-media/{mediaId}` | Stream media bảo vệ để Admin xem ngay trong trang report |

Admin Web dùng một `ResourcePage` chung cho users/groups/posts:

```text
GET page -> PageData -> AntD Table
                   -> Select trạng thái
                   -> PATCH status
                   -> reload page
```

Group/Post có link mở Expo Web qua `VITE_APP_URL`. Link này vẫn tuân thủ phiên và quyền của app người dùng. Khi kiểm duyệt report, Admin không phụ thuộc link đó: media được tải bằng endpoint Admin có Bearer token.

### 6.3. Reports

| Method | Route | Nghiệp vụ |
| --- | --- | --- |
| GET | `/api/v1/admin/reports?page&pageSize` | Reporter, target, reason, mô tả, reviewer, note, trạng thái |
| GET | `/api/v1/admin/reports/{id}/target` | Snapshot đối tượng User/Post/Comment/Group và protected media path |
| PATCH | `/api/v1/admin/reports/{id}/status` | Pending/Reviewing/Resolved/Rejected; đóng report bắt buộc note |

Màn hình Reports có list phân trang bên trái, vùng inspection bên phải, xem ảnh/video bằng Blob URL, mở app link khi phù hợp và action riêng để gỡ comment. Resolved/Rejected chỉ cập nhật report, không tự động gỡ target.

### 6.4. Sports tags

| Method | Route | Nghiệp vụ |
| --- | --- | --- |
| GET | `/api/v1/admin/sports` | Danh sách tag và số bài |
| POST | `/api/v1/admin/sports` | Tạo tag; name/slug duy nhất |
| PATCH | `/api/v1/admin/sports/{id}` | Sửa hoặc bật/tắt tag |

Tag bị tắt không bị xóa dữ liệu lịch sử; Mobile lấy danh sách active từ `GET /sports`.

### 6.5. Roles và administrators

| Method | Route | Nghiệp vụ |
| --- | --- | --- |
| GET | `/api/v1/admin/roles` | Mô tả role ADMIN, responsibilities, permission labels và user count |
| GET | `/api/v1/admin/administrators` | Danh sách System Admin |
| POST | `/api/v1/admin/administrators/{userId}` | Cấp role ADMIN |
| DELETE | `/api/v1/admin/administrators/{userId}` | Thu hồi; chặn tự thu hồi và chặn xóa Admin cuối cùng |

### 6.6. Operations và change management

| Method | Route | Nghiệp vụ |
| --- | --- | --- |
| GET/POST | `/api/v1/admin/operations/tasks` | Liệt kê/tạo tác vụ vận hành |
| PATCH | `/api/v1/admin/operations/tasks/{id}` | Status, người phụ trách, deadline, completed time |
| GET/POST | `/api/v1/admin/operations/changes` | Liệt kê/tạo change request |
| PATCH | `/api/v1/admin/operations/changes/{id}/status` | Duyệt/hoàn tất/thất bại/rollback và lưu người duyệt |

Change request có implementation plan và rollback plan riêng, phù hợp nghiệp vụ thay đổi hệ thống có kiểm soát.

### 6.7. Incidents và contingency plans

| Method | Route | Nghiệp vụ |
| --- | --- | --- |
| GET/POST | `/api/v1/admin/incidents` | Liệt kê/tạo sự cố |
| PATCH | `/api/v1/admin/incidents/{id}` | Status, owner, response notes, root cause, resolved time |
| GET/POST | `/api/v1/admin/contingency-plans` | Liệt kê/tạo runbook dự phòng |
| PUT | `/api/v1/admin/contingency-plans/{id}` | Sửa plan, tăng version |

### 6.8. Audit log

| Method | Route | Nghiệp vụ |
| --- | --- | --- |
| GET | `/api/v1/admin/audit?page&pageSize` | Actor, action, target, nhãn tiếng Việt, mô tả và thời điểm |

Các action quản trị chính đều tạo audit: trạng thái user/group/post/report, gỡ comment, sport, cấp/thu hồi Admin, task/change, incident/plan và quyết định bản quyền.

## 7. Cách API hiển thị lên Mobile

### 7.1. Pipeline chung

```text
Screen focus / user action
        -> service cụ thể
        -> api<T>(endpoint, options)
        -> Bearer + refresh/retry
        -> JSON DTO
        -> mapper nếu cần
        -> React state
        -> FlatList/ScrollView/component
```

`api<T>`:

- Tự đặt `Content-Type: application/json`, trừ `FormData`.
- Gắn Bearer khi `auth: true`.
- Parse validation errors từ `errors` và Problem Details từ `detail/title`.
- Trả `undefined` cho 204.
- Có proactive refresh và retry một lần khi 401.

`getFileUrl()` đổi đường dẫn tương đối thành origin Backend; avatar/cover có thể thêm cache key. Signed URL media bài đã chứa query token nên cache key được nối bằng `&`.

### 7.2. Mapping theo màn hình

| Màn hình | API/service | Cách hiển thị và trạng thái |
| --- | --- | --- |
| Login/Register | Auth service | Form validation, field errors, loading; register xong quay lại Login |
| Feed | `GET /feed` | `FeedPostDto -> mapFeedPostToPost -> PostCard`; cursor, search, pull-to-refresh, load more, empty/error |
| Post detail | `GET /posts/{id}` + comments | PostCard, comment tree, reply composer; 403/404 hiện lỗi không mở được |
| Create post | POST post -> upload media -> finalize | Chỉ đóng modal khi chuỗi hoàn tất; lỗi upload thì xóa mềm draft; có cảnh báo chờ bản quyền |
| Edit post | GET/PATCH post + PUT/DELETE media | Form dùng dữ liệu thật, thay/xóa media và cập nhật bài |
| Explore | `/explore/posts|groups|users` | 3 tab, search, sort, filter sport cho bài; page pagination và chống response cũ ghi đè |
| Khám phá nhóm | `GET /groups?scope=...` | Tách Public/Private/Joined; cursor, search, refresh, load more |
| Group detail | group detail/posts | Summary, join/leave, menu quản lý theo role, list bài cursor |
| Group management | members/requests/banned/review queue | Các màn riêng, chỉ hiện action theo contract role |
| Profile | user profile + user posts | Load song song, reset state khi đổi account, refresh, edit avatar/cover/bio |
| Notifications | list/unread/read/delete | Cursor list, badge thật, read state, empty/error/retry, mở đúng Post/Group/User/Copyright |
| Reports | create + `/reports/me` | Form lý do/mô tả và lịch sử trạng thái của user |
| Copyright của tôi | cases/me + external-scans/me | Kết luận, lỗi provider, note Admin, appeal modal và pull-to-refresh |

Mobile dùng `useFocusEffect` ở các màn cần làm mới khi quay lại. Feed/Profile giữ `currentUserIdRef` để response của tài khoản cũ không ghi vào state sau khi đổi tài khoản.

### 7.3. Media và video

- Picker cho phép ảnh/video; UI hiện tại chỉ chọn một media cho mỗi lần tạo/sửa bài dù backend hỗ trợ danh sách media.
- Backend kiểm tra magic bytes, không chỉ tin MIME/đuôi file.
- Định dạng: JPEG, PNG, WebP, MP4, MOV, WebM.
- Giới hạn upload bài: 20 MB/file.
- Preview trước upload dùng URI local qua `expo-video` cho video.
- Sau upload, ảnh hiển thị trong PostCard; video hiện là khối “Video bài viết” và mở URL bằng trình phát ngoài khi bấm, chưa phát inline trong Feed.
- Endpoint stream bật range processing để tua/phát video.

### 7.4. Chia sẻ và deep link

Thứ tự tạo URL chia sẻ:

1. `EXPO_PUBLIC_APP_URL` nếu đã cấu hình.
2. `window.location.origin` trên Expo Web.
3. Trong development native, lấy IP Metro và dùng cổng Web 8082.
4. Cuối cùng mới dùng Expo scheme `socialsportapp://...`/`exp://...`.

Web dùng Web Share API nếu có, nếu không copy clipboard. Khi người nhận chưa đăng nhập, `sessionStorage` giữ `/post/{id}` và mở lại sau Login.

Link chỉ dùng được từ máy khác nếu origin là IP/domain mà máy đó truy cập được; `localhost` chỉ trỏ về chính máy đang mở link.

## 8. Cách API hiển thị lên Admin Web

Pipeline chung:

```text
Page mount
  -> load()
  -> api(path) + Bearer
  -> Backend kiểm tra ADMIN
  -> DTO/PageData
  -> useState
  -> Ant Design Table/List/Card/Chart
  -> mutation POST/PATCH/DELETE
  -> Backend SaveChanges + audit
  -> reload danh sách
```

Media bảo vệ:

```text
DTO trả protected API path
  -> apiBlob(path) + Bearer ADMIN
  -> Blob
  -> URL.createObjectURL
  -> <img> hoặc <video controls>
  -> revokeObjectURL khi unmount
```

Trạng thái UI:

- `PageState` chuẩn hóa loading skeleton, empty, Alert lỗi và Retry.
- Resource và Reports có server pagination 20 item/trang.
- Sports dùng client pagination.
- Audit/Copyright/Operations/Incidents hiện lấy tối đa 100 item ở trang đầu và chưa có nút chuyển trang.
- Ô search trên header chỉ tìm chức năng/menu, không tìm user/group/post toàn hệ thống.
- Chuông ở header hiện là badge tĩnh, chưa nối API hoặc action thật.

## 9. Cấu hình môi trường và dữ liệu nhạy cảm

### Backend

Các cấu hình cần đưa qua environment/user-secrets/secret manager:

- `ConnectionStrings__DefaultConnection`
- `Jwt__Key`, issuer, audience và thời hạn
- `Cors__AllowedOrigins__*`
- Email SMTP
- `Expo__AccessToken`
- `DataProtection__KeyRingPath`
- Credential Google Vision/ACRCloud khi bật

### Mobile

- `EXPO_PUBLIC_API_URL`: base `/api/v1`.
- `EXPO_PUBLIC_APP_URL`: origin Expo Web/deep link public.
- `EXPO_PUBLIC_EAS_PROJECT_ID`: project ID cho push, không phải secret.

### Admin

- `VITE_API_URL`: base `/api/v1`.
- `VITE_APP_URL`: origin Expo Web để mở Post/Group.

Mọi biến `EXPO_PUBLIC_*` và `VITE_*` đều có thể xuất hiện trong bundle client, do đó tuyệt đối không đặt secret vào các biến này.

Kiểm tra Git hiện không tìm thấy API key Google Vision hoặc secret ACRCloud trong file tracked. Tuy nhiên:

- `appsettings.Development.json` đang được track và chứa tên máy/connection local; nên chuyển phần riêng máy sang user-secrets hoặc file ignore.
- Một số file upload bài mẫu đang được track.
- `.gitignore` chưa chặn toàn bộ `wwwroot/uploads/` và `App_Data/`, nên có nguy cơ commit nhầm media runtime/reference.

## 10. Persistence, migration và soft delete

Repo có các migration cho:

- Schema ban đầu và seed role/sport.
- Reaction pagination index.
- Copyright protection và external scanning.
- Admin operations.
- Group post moderation.
- Report resolution note.
- Perceptual hash và appeals.

Không tự chạy migration trong `Program.cs`; môi trường cần chạy `dotnet ef database update` theo bước release.

Soft delete/status:

- Group: `GroupStatus.Removed` + `DeletedAt`; service không trả detail/list/member/post của group không còn Active.
- Post: `Deleted`/`Removed`/`Hidden`; các API view/interact yêu cầu Published.
- Comment: `Deleted` bởi tác giả hoặc `Removed` bởi moderation; giữ record để không gãy reply tree.
- User: chuyển `UserStatus`; Login chỉ cho `Active`.
- Report và copyright không xóa, giữ lịch sử reviewer/note/time.

## 11. Những điểm đang làm tốt

- Quyền `ADMIN` được enforce ở API, không dựa vào giao diện.
- Có object-level authorization cho post, private group, block, report ownership và notification ownership.
- Refresh token lưu dạng hash và có rotation.
- Mobile native dùng SecureStore; Web có nhánh storage riêng nên không gọi API SecureStore không hỗ trợ.
- Có xử lý pending route sau Login cho link chia sẻ.
- Danh sách chính có loading/empty/error/retry và nhiều nơi có refresh/pagination.
- Group deletion và post deletion dùng trạng thái/xóa mềm.
- Report status tách riêng khỏi hành động gỡ nội dung.
- Admin xem protected media qua API riêng, không cần mật khẩu của user đăng bài.
- Notification tránh link hỏng bằng cách kiểm tra lại quyền khi dựng DTO.
- Media kiểm tra magic bytes, signed URL hết hạn và range streaming.
- Bản quyền có SHA-256, perceptual hash, provider tùy chọn, Admin review, notification và appeal.
- Audit log đã chuyển sang nhãn/nội dung tiếng Việt dễ đọc hơn mã kỹ thuật.

## 12. Khoảng trống và rủi ro cần ưu tiên

### P0 — cần xử lý trước khi coi là production-ready

1. **Không có test tự động của dự án**: chưa có Backend test project, Mobile/Admin unit test hoặc E2E. Build pass không chứng minh các luồng đa role đúng.
2. **Runtime upload/reference có thể lọt vào Git**: bổ sung ignore cho upload và `App_Data`, rồi dùng persistent/object storage ngoài source tree.
3. **Admin token trong localStorage**: chấp nhận được cho bài tập lớn, nhưng production dễ bị lấy khi có XSS. Phương án mạnh hơn là cookie HttpOnly/Secure/SameSite hoặc BFF.
4. **Admin không có refresh hoặc server logout**: access token hết hạn thì bị đẩy ra Login; Logout chỉ xóa local token. Login Admin còn làm Backend sinh refresh token nhưng client bỏ đi.
5. **Secret đã từng chia sẻ ngoài code cần được rotate**: dù không thấy trong Git, key bên thứ ba đã xuất hiện trong kênh trao đổi nên không nên coi là bí mật lâu dài.
6. **Khóa user/thu hồi Admin chưa vô hiệu JWT ngay**: refresh token chưa được revoke bởi các Admin action và access token cũ còn role/status tới hết hạn.

### P1 — ảnh hưởng nghiệp vụ/UX thực tế

1. Admin khởi tạo chỉ kiểm tra token có tồn tại, chưa gọi `/auth/me`; token hết hạn có thể render layout rồi mới bị 401.
2. `apiBlob()` Admin chưa xử lý 401 giống API JSON, nên media hết phiên chỉ báo lỗi chung mà không tự logout.
3. Admin Users/Groups/Posts chỉ có list + đổi status; chưa có search/filter/detail drawer, reason/note/confirm cho hành động nhạy cảm.
4. Pagination Admin còn thiếu ở Audit, Copyright, Operations và Incidents; dữ liệu quá 100 record sẽ không được xem.
5. Header Admin có chuông badge giả và tên/avatar Admin tĩnh.
6. Cấp System Admin bằng raw UUID, chưa có search/chọn user.
7. Incident vẫn dùng browser prompt cho response note/root cause; contingency plan có API update nhưng chưa có UI edit.
8. Mobile “Đối chiếu reference” là phần legacy trong khi matching nội bộ mặc định tắt và Admin UI không còn quản lý reference.
9. User reports và user posts/saved posts chưa có pagination đầy đủ; dữ liệu lớn sẽ khó mở rộng.
10. Mobile chỉ chọn một media dù backend có collection; video trong Feed chưa phát inline.
11. Google Vision Web Detection và ACRCloud chỉ là tín hiệu, không thể tự chứng minh bản quyền. Khi provider lỗi/billing tắt phải có quy trình review thủ công rõ ràng.
12. ACRCloud chỉ nhận sample tối đa 5 MB trong khi API cho upload video 20 MB; chưa có bước tách audio ngắn nên nhiều video thực tế có thể rơi vào `Failed`.
13. Sai email/mật khẩu hiện ném `UnauthorizedAccessException` và bị global handler ánh xạ thành 403; về chuẩn HTTP nên trả 401, còn 403 dành cho user đã xác thực nhưng thiếu quyền.
14. Report duplicate mới được chặn trong service, chưa có ràng buộc DB nên hai request đồng thời vẫn có khả năng tạo trùng.

### P2 — chất lượng và vận hành

1. Mobile còn `console.log` cho raw API error và response đăng ký; response đăng ký chứa token. Cần xóa hoặc bọc logger chỉ bật development trước release.
2. Cấu hình CORS policy đang được đăng ký ở cả `Program.cs` và `DependencyInjection.cs`; nên giữ một nguồn cấu hình để tránh lệch hành vi.
3. Admin chưa có AbortController/request cancellation; dev StrictMode có thể gọi load hai lần.
4. `apiFileUrl()` Admin hiện không có consumer.
5. Dashboard chart 7 ngày là aggregate, chưa phải time series.
6. Push notification chưa có background job đọc Expo receipts muộn và tự vô hiệu token hỏng.
7. Chưa có rate limiting tổng quát ở gateway/API; hiện mới có giới hạn nghiệp vụ cho comment/report.
8. Chưa có hướng dẫn SPA fallback cho Admin `BrowserRouter` khi deploy static hosting.
9. `README.md` còn mô tả bản quyền cũ ở phần rủi ro và cần đồng bộ với perceptual hash/external review hiện tại.
10. File media được ghi trước khi toàn bộ transaction DB/scan hoàn tất; lỗi giữa chừng có thể để lại orphan file.
11. Notification type `GroupInvite` đã có trong enum nhưng chưa có luồng tạo tương ứng; khi Member gửi bài chờ duyệt, hiện chưa thấy notification riêng gửi tới Owner/Admin/Moderator.
12. Health endpoint mới kiểm tra DB và sự tồn tại thư mục upload, chưa kiểm tra dung lượng đĩa, SMTP, Expo Push hoặc provider bản quyền.

## 13. Ma trận test nghiệp vụ đề xuất

| Luồng | Tài khoản cần | Kết quả cần xác nhận |
| --- | --- | --- |
| Auth/session | User A | Login, refresh rotation, logout, access hết hạn, reset password thu hồi refresh |
| Chia sẻ bài | Người chưa login + A | Mở link, Login, quay đúng post; private/followers/group trả đúng 403/404 |
| Feed/search | A/B | Cursor không trùng, search, refresh, đổi account không lẫn state |
| Post media | A | Ảnh/video hợp lệ, file giả MIME, >20 MB, preview trước đăng, signed URL hết hạn |
| Visibility | A/B/follower | Public, Followers, Private đúng quyền xem và tương tác |
| Comment | A/B/Mod | Reply + tag hiển thị, notification, từ cấm có/không dấu, spam 6 comment/phút, hierarchy gỡ |
| Group Public | Owner/Admin/Mod/Member/Outsider | Join ngay, xem bài, outsider không tương tác, role/hierarchy |
| Group Private | Owner/Pending/Member/Banned/Outsider | Pending, approve/reject/cancel, privacy, ban/unban |
| Queue bài nhóm | Owner/Admin/Mod/Member | Member vào hàng đợi; người có quyền duyệt/từ chối; notification và trạng thái sau reload |
| Xóa nhóm | Owner/Group Admin | Owner xóa mềm; Group Admin 403; mọi endpoint group không còn trả dữ liệu |
| Notifications | A/B | Badge thật, cursor, read/read-all/delete-all, link target bị xóa không crash |
| Reports | A/B/C/System Admin | Không trùng, không lộ report, Group Admin 403, note được lưu, xử lý report không tự gỡ target |
| System Admin | Admin + user thường | Login role, lock user, hide/remove group/post, sports, role grant/revoke, audit |
| Copyright ảnh | A/Admin | Public/Followers gửi Vision khi bật; Private không gửi; signal -> hidden -> Admin decision -> notification/appeal |
| Copyright video | A/Admin | ACRCloud clear/match/error, giới hạn sample, manual decision, notification/appeal |
| Admin session | Admin | Reload browser, access hết hạn, 401 JSON, 401 protected media, logout |
| Release | Staging | Migration, CORS origin thật, HTTPS, persistent upload/key ring, SPA fallback, backup/restore |

## 14. Các file nguồn chính đã đối chiếu

### Backend

- `backend/src/SocialSport.Api/Program.cs`
- `backend/src/SocialSport.Api/Extensions/DependencyInjection.cs`
- `backend/src/SocialSport.Api/Data/ApplicationDbContext.cs`
- `backend/src/SocialSport.Api/Controllers/*.cs`
- `backend/src/SocialSport.Api/Services/Implementations/*.cs`
- `backend/src/SocialSport.Api/Models/Entities/*.cs`
- `backend/src/SocialSport.Api/Models/Enums/*.cs`
- `backend/src/SocialSport.Api/Data/Migrations/*.cs`

### Mobile

- `mobile/src/storage/token.storage.ts`
- `mobile/src/services/api.ts`
- `mobile/src/services/*.service.ts`
- `mobile/src/contexts/AuthContext.tsx`
- `mobile/src/app/_layout.tsx`
- `mobile/src/app/**/*.tsx`
- `mobile/src/components/**/*.tsx`

### Admin

- `admin/src/lib/api.ts`
- `admin/src/App.tsx`
- `admin/src/components/AdminLayout.tsx`
- `admin/src/components/ui.tsx`
- `admin/src/pages/*.tsx`
- `admin/.env.example`

## 15. Kết quả kiểm tra tại thời điểm rà soát

| Thành phần | Lệnh | Kết quả |
| --- | --- | --- |
| Backend | `dotnet build SocialSport.sln --no-restore` | Đạt, 0 warning, 0 error |
| Mobile | `npx tsc --noEmit` | Đạt, không có lỗi TypeScript |
| Admin TypeScript | Phần `tsc -b` của `npm run build` | Đạt |
| Admin Vite | `npm run build` vào `admin/dist` | Không hoàn tất vì Windows khóa file cũ trong `dist` (`EPERM unlink`), không phải lỗi source |
| Admin Vite đối chứng | `npx vite build --outDir <thư mục tạm>` | Đạt; có warning bundle lớn hơn 500 kB |

Những lệnh trên chỉ là kiểm tra biên dịch/build. Chưa chạy emulator, thiết bị thật, provider thật hoặc UAT đa role trong lần rà soát tài liệu này.

## 16. Kết luận

Nghiệp vụ cốt lõi của SocialSport đã liên kết được từ Backend sang Mobile và Admin: xác thực, feed/post/profile, nhóm và moderation, thông báo, report, System Admin, protected media và bản quyền có review/appeal. Phần hiện tại phù hợp để hoàn thiện bài tập lớn và UAT có kiểm soát.

Để gọi là ứng dụng store/production hoàn chỉnh, ba việc quan trọng nhất còn lại là:

1. Thêm test tự động và chạy UAT đa role trên database staging/thiết bị thật.
2. Làm sạch storage/secret/runtime files và hoàn thiện session bảo mật của Admin.
3. Hoàn thiện các khoảng trống Admin/UX có dữ liệu lớn: search, detail, pagination, confirmation/note và loại bỏ placeholder/legacy UI.
