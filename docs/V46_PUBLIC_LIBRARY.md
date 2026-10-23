# V4.6 — Public multi-user learning library

## Product behavior

- The website is a full-stack Next.js application hosted on Vercel, with Supabase Auth and Postgres.
- Users register and log in with email + password. Supabase manages passwords and sessions; this app never stores raw passwords.
- Each website account connects its own Feishu account through user OAuth. The website does not use one administrator's Feishu token for every user.
- A user browses their Feishu Drive, selects a folder, and starts a resumable recursive metadata sync. The sync follows child folders and paginates large folders.
- TXT/MD/CSV, common image formats, and PDF can be previewed through authenticated server-side file proxy routes. Other binary files, including PPTX/DOCX/XLSX, can be downloaded; Feishu-native online documents link back to Feishu.
- The website stores a private index of file metadata, not a public copy of private courseware. File bytes are streamed from Feishu only after the owning website account is authenticated.

## Deploy once

### 1. Create a Supabase project

Create a project at https://supabase.com/dashboard. In SQL Editor, run the migration at supabase/migrations/202610220001_public_learning_library.sql.

Configure Authentication:
- Enable the Email provider.
- Set the Site URL to the deployed Vercel origin.
- Add the Vercel origin and local http://localhost:3000 to allowed redirect URLs.
- Keep **Confirm Email** enabled for email + password accounts.
- In Authentication → Email Templates → **Confirm sign up**, replace the confirmation-link body with an OTP code, e.g.:
  ```html
  <h2>知序邮箱验证</h2>
  <p>你的注册验证码为：<strong>{{ .Token }}</strong></p>
  <p>请回到知序网站输入这 6 位数字，不要转发给其他人。</p>
  ```
- Confirm the email OTP length is **6 digits** under Authentication email provider settings (default is 6). This project does not use a confirmation-link redirect.
- After signup the site opens /verify-email, where users type the email and six-digit code; successful verification signs them in or lets them log in with their password.
- The built-in Supabase SMTP server is for restricted testing only. Set up a custom SMTP provider before permitting general public signup.

Copy the project URL and Publishable key from the project's Connect dialog. Open **Project Settings → API Keys → Publishable and secret API keys**, then copy a server-only **Secret key** (`sb_secret_...`). New Supabase projects may not have the legacy `service_role` key. Never paste a secret key in GitHub, chat, or client-side environment variables.

### 2. Deploy the Next.js app on Vercel

Import the GitHub repository colddreamxiaowd/ContinueLeanringWithAI into Vercel and use web/ as the Root Directory. Vercel should detect Next.js automatically. Do not configure a static export.

Set these environment variables for Preview and Production:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
- SUPABASE_SECRET_KEY (recommended, `sb_secret_...`; legacy `SUPABASE_SERVICE_ROLE_KEY` remains supported)
- NEXT_PUBLIC_SITE_URL
- FEISHU_REDIRECT_URI
- FEISHU_APP_ID
- FEISHU_APP_SECRET
- FEISHU_TOKEN_ENCRYPTION_KEY

Generate the encryption key locally with:
~~~bash
openssl rand -hex 32
~~~
Use the same key for all deployments that share the database. Never commit it or paste it into issues or chat.

### 3. Configure the existing Feishu app

Reuse the existing custom app; do not create a second app unless the current app cannot be published for the intended users.

In Feishu Open Platform:
1. Register the exact callback URL https://YOUR_VERCEL_DOMAIN/api/feishu/callback under Security Settings / Redirect URLs.
2. Enable the read-only cloud-drive scope drive:drive:readonly and the offline_access scope for refresh tokens.
3. Ensure file download permission is enabled where required, publish the app version, and confirm that users in the intended audience can authorize it.
4. Add the same callback URL to FEISHU_REDIRECT_URI in Vercel.

Each user authorizes their own Feishu account. The app requests read-only access; it does not request write permission.

## First end-to-end acceptance

1. Open the deployed site and create an account using an email and a password of at least 10 characters.
2. Open the latest registration email, enter the 6-digit code at /verify-email, and continue into /library (or log in if requested).
3. Open 我的资料 and click 连接我的飞书.
4. Approve the Feishu authorization.
5. Browse to the folder containing learning materials and click 同步当前文件夹.
6. Wait for the paginated recursive sync to complete. The folder and nested files should appear under 我的资料.
7. Verify that TXT/MD/CSV displays as text, images display inline, PDFs open in the embedded viewer, and other binary files download. Try a second website account and confirm it cannot see the first account's index or content.

## Data and security model

- Feishu access/refresh tokens are encrypted with AES-256-GCM before being written to feishu_connections. The encryption key exists only in the server environment.
- Website session cookies are HttpOnly, SameSite=Lax, and Secure in production; the server refreshes Supabase sessions.
- The database records user ownership and has Row Level Security. Every server-side database lookup is also filtered by the authenticated Supabase user ID.
- The private library index is not embedded in the static website bundle. File bytes are proxied only after checking the current user owns the indexed item.
- OAuth state is random, short-lived, stored in an HttpOnly cookie, and bound to the initiating website account.
- The current version supports binary Drive files for in-browser previews. Feishu-native docs/sheets/base objects remain links to Feishu; PPTX/DOCX/XLSX can be downloaded but are not parsed into page-level reading views in this slice.

## Operational boundaries

- GitHub Pages is a legacy static preview and is no longer used for full-stack deployments. The public app requires Vercel (or another compatible Next.js server host) and Supabase.
- GitHub Actions runs tests and builds only; it has no production secrets and never calls Feishu.
- The current sync is user-triggered and resumable page by page; it is not a background scheduled sync.

## V4.7 — Reading materials on the actual website

- Users can paste an authorized Feishu folder URL (or opaque folder token) directly in /library to index nested folders without browsing Drive root first. The server checks read permission with that user's Feishu OAuth token.
- Once synced, an authenticated user can open PPTX, DOCX or XLSX in /library. The Office reader extracts slide text, Word paragraphs and spreadsheet rows on demand from Feishu. The site renders these sections as readable original-source material, not an AI-generated summary. TXT/MD/CSV, images, PDF keep their original preview modes.
- No course data are committed to the public repository and no source text is cached in the shared database. Server response uses private no-store, checks item ownership, and refuses documents larger than 15 MiB for the in-browser extractor.
- Fallback: for complex Office features, scanned slides, original layout and files above the size bound, download the original file. Full PPT slide-faithful rendering and AI-generated lessons are future work.
- Live acceptance still requires the deployed user's Feishu OAuth credentials and an actual folder: paste folder link → sync → open nested TXT/image/PPTX/DOCX/XLSX → verify original content is shown under the same login.
