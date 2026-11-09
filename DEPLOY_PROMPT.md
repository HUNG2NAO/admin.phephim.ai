# Prompt cho AI triển khai

Tôi đã có project source `phephim-admin` ở thư mục riêng, không được copy vào Toolnet-Phim-Auto hoặc repo website phephim.

Mục tiêu: deploy project Next.js này lên Vercel với domain `admin.phephim.ai`, quản lý toàn bộ phim trên `www.phephim.ai`.

Quy trình bắt buộc:

1. Đọc `README.md`, `db/001_admin_overrides.sql`, `site-integration/README.md`, và các API route.
2. Kiểm tra quyền Vercel team và GitHub organization. Tạo repository riêng `phephim-admin` và Vercel project riêng, không thay đổi project hiện có.
3. Cấu hình Clerk, xác định Clerk user ID của chủ tài khoản và đặt trong `ADMIN_CLERK_USER_IDS`. Tuyệt đối không công khai panel admin hoặc endpoint ghi dữ liệu; không hardcode mật khẩu/token.
4. Kết nối Neon hiện tại bằng server-only `DATABASE_URL`, ưu tiên PostgreSQL role chỉ có quyền SELECT catalog và quyền ghi lên `phe_admin`. Backup DB trước khi áp dụng migration additive mới.
5. Nếu cần tải bìa từ máy: tạo Vercel Blob store cho project admin và cấu hình `BLOB_READ_WRITE_TOKEN`. Nếu chưa có Blob, URL HTTPS vẫn hoạt động.
6. Run `npm install`, `npm run typecheck`, `npm run build`, kiểm tra lint/security, thử đăng nhập/không đủ quyền, truy vấn phim, sửa tiêu đề, sửa ảnh và ẩn/khôi phục phim trên bản thử.
7. Trong repo website PHEPHIM.AI, áp dụng patch read-only của `site-integration` ở bản staging. Cần bảo đảm `catalog()`, `movie_for_slug`, trang chủ, trang chi tiết, tìm kiếm, sitemap và cache đều tôn trọng `phe_admin.movie_overrides` để thay đổi xuất hiện trên website. Không sửa Toolnet-Phim-Auto Step 1–9.
8. Kiểm tra một phim STATIC và một phim PUBLISHED, cùng trường hợp DRAFT không bị vô tình công khai. Kiểm tra sau khi pipeline tự đăng thêm phim thì chỉnh sửa tên và ảnh của admin vẫn còn hiệu lực.
9. Cấu hình DNS `admin` trên Cloudflare theo giá trị Vercel thực tế hiển thị, xác minh TLS, redirect HTTPS, bảo vệ API.
10. Chỉ promote deployment khi tất cả test pass, ghi lại commit và rollback plan. Chưa được xóa video, Telegram message, SRT, metadata gốc hay xóa DB thật.

Không được báo "deploy thành công" nếu chưa có URL Vercel có thể truy cập. Không được báo "website đã đồng bộ" khi patch website chưa được merge và deploy. Lưu log thay đổi admin vào `phe_admin.movie_audit_log`.
