# Phân tích mã nguồn — zalo-auth-sdk

> Tài liệu này được tạo dựa trên phân tích cấu trúc (knowledge graph qua GitNexus) và đọc trực tiếp mã nguồn.

## 1. Mục đích

`zalo-auth-sdk` là **SDK JavaScript thuần (vanilla, không framework)** cho đăng nhập Zalo OAuth 2.0 qua popup + PKCE — mô tả trong `package.json`: *"Standalone Zalo Authentication SDK using sign in with popup flow"*. Đây là phiên bản không phụ thuộc React, dùng `<script>` tag thuần và để tích hợp vào bất kỳ trang HTML nào.

Đây là dự án **anh em (sibling)** với [react-zalo-auth-kit](../react-zalo-auth-kit/ANALYZE.md) — cùng giải quyết bài toán Zalo OAuth+PKCE, nhưng SDK này dành cho môi trường không có React/bundler.

## 2. Thống kê (GitNexus index)

| Metric | Giá trị |
|---|---|
| Files | 12 |
| Symbols (nodes) | 106 |
| Edges | 187 |
| Clusters | 6 |
| Execution flows (processes) | 10 |
| Circular imports | Không có |
| File-to-file imports (ES module) | **0** — không dùng module system, chỉ nạp qua `<script>` tag |

## 3. Cấu trúc thư mục

```
index.html                  trang demo — nạp script theo thứ tự cố định
main.js                      logic demo app (login button, sessionStorage, loading overlay)
gulpfile.js                  dev server (gulp + browser-sync), không có build/transpile step
src/
├─ zalo-auth-sdk.js          SDK chính — IIFE, export global `ZaloAuth.login()` / `ZaloAuth.refreshSession()`
└─ pkce.js                   bản PKCE generator độc lập (window.crypto) — KHÔNG được nạp/tham chiếu ở đâu (dead code)
stories/, .storybook/        Storybook cho LoadingOverlay, ZaloAuthButton, ZaloAuthFlow
```

Không có thư mục `dist/`, không có script build/publish trong `package.json` — khác với `react-zalo-auth-kit`, dự án này có vẻ là **bản demo/tham khảo**, chưa đóng gói để phân phối qua npm.

## 4. Kiến trúc

- **Không dùng ES module / bundler**: GitNexus xác nhận **0 edge IMPORTS** giữa các file — toàn bộ nạp qua `<script src="...">` trong `index.html`, theo đúng thứ tự: `src/zalo-auth-sdk.js` → `main.js`. Biến `ZaloAuth` là global, `main.js` gọi trực tiếp `ZaloAuth.login(...)`.
- **`src/zalo-auth-sdk.js`** dùng pattern Module IIFE (`const ZaloAuth = (() => {...})()`), expose 2 method:
  - `login({clientId, redirectUri, state, scopes, popupTimeOut})`: mở popup OAuth, **polling `windowPopup.location.href` mỗi 50ms** để bắt redirect (do popup cùng-origin sau khi Zalo redirect về `redirectUri`), đổi `code` → `access_token`/`refresh_token` (`getZaloToken`), rồi lấy profile (`getZaloProfile`). Có timeout 60s và phát hiện popup bị đóng.
  - `refreshSession({clientId, refreshToken, scopes})`: đổi `refreshToken` lấy access token mới + profile.
- **PKCE runtime**: SDK **không dùng** dependency npm `pkce-challenge` đã khai báo trong `package.json`. Thay vào đó, hàm `pkceChallenge()` (`src/zalo-auth-sdk.js:85`) **tự inject script CDN** `https://cdn.jsdelivr.net/npm/oauth-pkce@0.0.2/dist/oauth-pkce.min.js` lúc runtime rồi gọi hàm global `getPkce()` do script đó cung cấp.
- **`src/pkce.js`** chứa một bản triển khai PKCE generator khác (dùng `window.crypto.subtle.digest('SHA-256', ...)`, định nghĩa sẵn `getPkce`/`b64Uri`) — về chức năng **gần như trùng với thư viện CDN** đang được inject, nhưng file này **không hề được nạp** trong `index.html` hay tham chiếu bởi `zalo-auth-sdk.js`. Đây là dead code / bản nháp chưa được wire vào.
- **`injectDebugger()`**: tiện ích inject CDN `eruda` (debug console di động) — dùng cho debug trên thiết bị thật, không bắt buộc trong flow chính.
- **`main.js`**: demo app — lưu token/profile vào `sessionStorage`, toggle UI giữa trạng thái chưa/đã đăng nhập, tạo loading overlay bằng cách chèn/xoá DOM node thủ công (không qua framework).

## 5. Luồng đăng nhập

1. User click nút → `handleLogin()` (`main.js:4`) → nếu chưa có `refreshToken` trong `sessionStorage`, gọi `ZaloAuth.login({clientId, redirectUri})`.
2. `login()` inject script PKCE từ CDN → sinh `codeVerifier`/`codeChallenge` → mở popup tới `https://oauth.zaloapp.com/v4/permission?...&code_challenge=...`.
3. Polling mỗi 50ms để đọc `windowPopup.location.href`; khi URL bắt đầu bằng `redirectUri` (popup đã redirect về app) → đóng popup, lấy `code` từ query string.
4. `getZaloToken()` POST tới `oauth.zaloapp.com/v4/access_token` đổi `code` (+ `code_verifier`) lấy `access_token`/`refresh_token`.
5. `getZaloProfile()` GET tới `graph.zalo.me/v2.0/me?fields=...` lấy thông tin user theo `scopes`.
6. Resolve về `ZaloProfile` (chuẩn hoá field: `userId`, `displayName`, `photoUrl`, kèm `accessToken`/`refreshToken`) → `main.js` lưu vào `sessionStorage` và cập nhật UI.
7. Lần sau nếu đã có `refreshToken` trong `sessionStorage`, gọi `refreshSession()` thay vì mở lại popup.

## 6. Vấn đề phát hiện qua phân tích

- **Dead code**: `src/pkce.js` không được `index.html` hay bất kỳ file nào nạp/tham chiếu — chức năng bị trùng với thư viện `oauth-pkce` đang được inject từ CDN lúc runtime. Cần xoá hoặc quyết định dùng bản local thay vì tải CDN.
- **Dependency khai báo nhưng không dùng**: `package.json` khai báo `pkce-challenge` (npm) là dependency, nhưng code thực tế không `require`/dùng thư viện này ở đâu — PKCE thực tế lấy từ CDN khác (`oauth-pkce@0.0.2`). Khai báo dependency gây hiểu nhầm.
- **Rủi ro chuỗi cung ứng (supply chain)**: SDK inject 2 script bên thứ ba từ CDN lúc runtime (`oauth-pkce`, và `eruda` khi debug) mà **không có Subresource Integrity (SRI) hash** — nếu CDN bị thay đổi nội dung độc hại, ứng dụng sẽ chạy mã không kiểm soát.
- **Polling tần suất cao**: đọc `windowPopup.location.href` mỗi 50ms trong vòng đời popup — gây tốn CPU nhẹ; có thể thay bằng cơ chế `postMessage` từ trang redirect về (giống cách `react-zalo-auth-kit` dùng `window.opener.handleZaloResponse`) để tránh polling liên tục.
- **Không có build/publish pipeline**: khác `react-zalo-auth-kit` (có Babel/Rollup + script `auto` để publish npm), `zalo-auth-sdk` chỉ có `gulpfile.js` chạy dev server (`browser-sync`) — phù hợp cho demo cục bộ, chưa có cách đóng gói/phân phối SDK ra ngoài (`main: "main.js"` trong `package.json` trỏ vào script của demo app, không phải entry point thực sự của SDK).
- **Phụ thuộc thứ tự nạp script chặt (script tag order)**: vì không có module system, `main.js` phải được nạp **sau** `src/zalo-auth-sdk.js` và dựa vào biến global `ZaloAuth` — dễ vỡ nếu thay đổi thứ tự `<script>` trong `index.html`.

## 7. So sánh nhanh với `react-zalo-auth-kit`

| | zalo-auth-sdk | react-zalo-auth-kit |
|---|---|---|
| Môi trường | Vanilla JS, `<script>` tag | React component/hook |
| Module system | Không có (global IIFE) | ES modules (Babel/Rollup) |
| PKCE | Inject CDN (`oauth-pkce`) lúc runtime | npm package `pkce-challenge` |
| Phát hiện redirect | Polling `windowPopup.location.href` (50ms) | Polling `window.location.search` ở tab cha (5000ms) |
| Tích hợp Firebase | Không | Có (Custom Token Flow) |
| Build/publish | Chưa có | Có (Babel build + npm publish) |

## 8. Gợi ý cải thiện (nếu refactor)

1. Xoá `src/pkce.js` (dead code) hoặc thay thế cơ chế CDN injection bằng bundler + npm package (`pkce-challenge`/`oauth-pkce`) đã cài sẵn, tránh phụ thuộc CDN không SRI.
2. Loại bỏ dependency `pkce-challenge` khỏi `package.json` nếu không dùng, hoặc dùng thật nó thay cho CDN.
3. Thay polling 50ms bằng `postMessage` giữa popup và window cha để giảm tải CPU và tránh giới hạn truy cập cross-origin trong các trình duyệt mới.
4. Thêm SRI hash cho các script CDN được inject runtime, hoặc tự host các thư viện này.
5. Định nghĩa rõ entry point SDK (ví dụ tách `src/zalo-auth-sdk.js` thành package riêng có thể `npm install`), thay vì để `main` trỏ vào script demo.
