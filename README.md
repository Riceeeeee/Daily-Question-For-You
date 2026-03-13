# Câu Hỏi Cho Em Mỗi Ngày

Một ứng dụng web nhỏ, lãng mạn, để em có thể mở mỗi ngày (ví dụ bằng cách quét thẻ NFC) và nhận một câu hỏi dễ thương từ anh.

Ứng dụng được xây dựng bằng:
- HTML, CSS, JavaScript (vanilla)
- Supabase (database + API) để lưu trạng thái và câu trả lời

## Tính năng hiện tại

- Trang chính:
  - Hiển thị lời chào theo thời gian trong ngày và ngày hiện tại.
  - Mỗi ngày một câu hỏi khác, lấy từ `questions.json` theo day-of-year.
  - Ô cho em nhập câu trả lời và nút **Gửi câu trả lời ❤️**.
  - Gửi câu trả lời lên Supabase bảng `answers` (lưu câu hỏi, câu trả lời, thời gian, day_number).
  - Hiện câu phản hồi dễ thương ngẫu nhiên sau khi gửi thành công.
  - Có thẻ surprise hiển thị ngẫu nhiên một thông điệp dễ thương (~10%).
- Hệ thống Love Streak và tokens (Supabase bảng `love_state`):
  - Lưu `current_streak`, `last_answer_date`, `tokens`, `time_capsule_active`.
  - Khi em trả lời liên tiếp, `current_streak` tăng dần và hiện thông báo dạng  
    `🔥 Em đã trả lời X ngày liên tiếp rồi đó` (đặc biệt ở mốc 7 ngày).
  - Thưởng token ở mốc streak 7 ngày (+1 token) và 30 ngày (+3 tokens).
  - Time Capsule kích hoạt khi em nghỉ 2 ngày liên tiếp, cho phép cứu streak ở lần trả lời tiếp theo.
  - Token Rescue cho phép dùng token để cứu streak nếu nghỉ từ 3 ngày trở lên.
- Giao diện Love Streak & Tokens:
  - Hiển thị số tokens hiện có.
  - Hiển thị trạng thái Time Capsule đang bật hay tắt.
  - Nút **Dùng token để cứu streak** (chỉ bật khi còn token).
- Trang admin:
  - Trang `admin.html` yêu cầu mật mã để mở (dành cho anh).
  - Sau khi nhập mật mã loveadmin, anh có thể chọn ngày và xem danh sách câu trả lời từ Supabase.
  - Mỗi câu trả lời hiển thị thời gian, câu hỏi và nội dung em đã trả lời.
- Trải nghiệm hình ảnh:
  - Nền gradient, thẻ card bo tròn, hiệu ứng trái tim bay.
  - Thiết kế tối ưu cho màn hình điện thoại, phù hợp dùng với thẻ NFC.

## Cấu trúc dự án

Thư mục chính: `love-daily-app`

- `index.html` – Giao diện chính của trang
- `style.css` – Giao diện, màu sắc, hiệu ứng trái tim
- `app.js` – Logic câu hỏi hằng ngày, streak, thông điệp bất ngờ
- `questions.json` – Danh sách câu hỏi tiếng Việt
- `supabase.js` – Khởi tạo Supabase
- `README.md` – Tài liệu hướng dẫn

## Cấu hình Supabase

1. Tạo dự án trên Supabase:  
   Vào trang Supabase, tạo một Project mới.

2. Lấy URL và ANON KEY:  
   - Vào phần Project Settings → API  
   - Sao chép:
     - `Project URL`
     - `anon public`

3. Mở file `supabase.js` và thay thế:

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

Thành giá trị tương ứng từ dự án Supabase của bạn.

## Tạo bảng `answers` trong Supabase

Trong Supabase:

1. Vào mục **Table Editor**
2. Tạo bảng mới:
   - Tên bảng: `answers`
3. Thêm các cột:
   - `id` – `uuid` – `default: uuid_generate_v4()` – Primary key
   - `question` – `text`
   - `answer` – `text`
   - `created_at` – `timestamp with time zone` – `default: now()`

Lưu lại cấu hình bảng.

## Cách ứng dụng lưu câu trả lời

Khi người dùng nhấn nút **"Gửi câu trả lời ❤️"**:
- Ứng dụng sẽ:
  - Lấy câu hỏi của ngày hôm đó
  - Lấy nội dung câu trả lời trong ô `textarea`
  - Gửi vào Supabase, bảng `answers` với các cột:
    - `question`
    - `answer`
    - `created_at`

Nếu gửi thành công, trang sẽ hiển thị một câu phản hồi dễ thương ngẫu nhiên.

## Daily question (câu hỏi hằng ngày)

- Ứng dụng lấy danh sách câu hỏi từ `questions.json`
- Tính **ngày trong năm** (day of year)
- Áp dụng công thức:  
  `day_of_year % number_of_questions`
- Dùng kết quả đó làm chỉ số để chọn câu hỏi tương ứng

Như vậy, mỗi ngày sẽ tự động hiện một câu hỏi khác nhau.

## Daily streak (chuỗi ngày trả lời liên tiếp)

- Ứng dụng sử dụng `localStorage` trên trình duyệt:
  - Lưu ngày trả lời gần nhất
  - Lưu số ngày liên tiếp đã trả lời
- Nếu người dùng trả lời liên tiếp mỗi ngày:
  - Hiển thị thông báo dạng:
    - `🔥 Em đã trả lời X ngày liên tiếp rồi đó`

## Hiệu ứng bất ngờ (surprise message)

Khi tải trang:
- Có khoảng 10% khả năng sẽ hiện một hộp nhỏ với một thông điệp dễ thương, ví dụ:
  - "💌 Chỉ muốn nói là anh rất thích em"
  - "Hy vọng hôm nay em có một ngày thật vui"

## Chạy ứng dụng trên máy

Vì đây là ứng dụng frontend tĩnh, bạn có thể:

- Mở trực tiếp file `index.html` trong trình duyệt  
  (một số trình duyệt có thể chặn `fetch` từ `file://`. Nếu bị lỗi, nên dùng server tĩnh bên dưới)

Hoặc dùng một server tĩnh đơn giản, ví dụ:
- Sử dụng `VS Code Live Server`
- Hoặc `npx serve` từ thư mục `love-daily-app`

## Deploy ứng dụng

Bạn có thể deploy thư mục `love-daily-app` lên:

- GitHub Pages
- Netlify
- Vercel
- Hoặc bất kỳ dịch vụ hosting tĩnh nào

Chỉ cần:
- Thư mục `love-daily-app` là root hoặc public folder
- Đảm bảo các file giữ đúng đường dẫn tương đối:
  - `style.css`
  - `app.js`
  - `questions.json`
  - `supabase.js`

## Gợi ý dùng với thẻ NFC

- Deploy trang
- Lấy URL cuối cùng (ví dụ từ Netlify/Vercel)
- Ghi URL đó vào thẻ NFC
- Mỗi khi em chạm điện thoại vào thẻ:
  - Trình duyệt sẽ mở trang
  - Hiện lời chào, ngày, câu hỏi hôm nay, chỗ trả lời, streak và các thông điệp dễ thương.
