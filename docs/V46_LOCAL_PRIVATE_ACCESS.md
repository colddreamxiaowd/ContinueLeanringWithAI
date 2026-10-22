# V4.6 — Local Private Access Gateway

Status: first implementation slice; review required. This is a personal, loopback-only prototype, not an internet-facing production service.

## Scope

- Reads an explicitly selected V4.3 content store through \`scripts/v43_import.py\`.
- Serves the existing Next.js static export from \`web/out\` and a separate private browser at \`/private/\`.
- Uses only local authentication; no database, external identity provider, upload, delete, Feishu write, or publish API.
- Tests create a temporary store from the repository's synthetic PPTX builder. They never read the user's real \`.local/v43\` store.

## Build and run with synthetic data (PowerShell)

Run from the repository root. Do not use a real private store for this first-slice test.

\`\`\`powershell
$env:CLAI_PRIVATE_ACCESS_TOKEN = (python -c "import secrets; print(secrets.token_hex(32))")
python scripts/v45_export_synthetic.py --store .local/v46-demo-store --output web/src/data/v45-demo
Push-Location web
npm ci
npm run build
Pop-Location
python scripts/v46_private_server.py --store .local/v46-demo-store --static-root web/out --port 8765
\`\`\`

Open \`http://127.0.0.1:8765/private/\`. Keep the PowerShell session open while using the service. The access token is held in the environment and typed into the login form; the browser does not save it to localStorage or sessionStorage.

To stop the service, press Ctrl+C. The session cookie expires after 30 minutes. Changing the access token invalidates existing signatures.

## Security behavior

- The server binds only to \`127.0.0.1\`; there is no CLI option to bind to a LAN or public interface.
- Startup requires an explicit existing \`--store\`, an existing static export, a private UI directory, and \`CLAI_PRIVATE_ACCESS_TOKEN\` with at least 32 non-whitespace characters.
- Store paths inside \`web/\`, the static export, or the private UI tree are rejected.
- Host headers are limited to \`127.0.0.1:<port>\` and \`localhost:<port>\`. Login and logout require an exact same-origin \`Origin\` header.
- The session cookie is HMAC-signed, time-limited to 30 minutes, and marked \`HttpOnly\`, \`SameSite=Strict\`, \`Path=/\`, and \`Max-Age=1800\`. It is not marked \`Secure\` because this prototype uses local plain HTTP; the service must remain loopback-only.
- Private API responses use \`Cache-Control: no-store\`; server request logging is disabled to avoid recording paths, tokens, or content.
- Errors are reduced to stable codes and do not include exception text, store paths, or document text.
- The V4.3 importer validates document IDs and relative content paths. The gateway exposes only list/read operations.

## Boundaries and limitations

This is a single-user local prototype. It has no remote authentication, HTTPS termination, multi-user authorization, audit log, password-reset flow, or server-side session revocation list. Do not expose it through port forwarding, a reverse proxy, a LAN address, or a public host. A signed cookie can be replayed until it expires; rotate the access token to invalidate all existing sessions.

The gateway can read whichever store the operator explicitly supplies. This PR's automated tests use synthetic content only; they do not read or validate real courseware. Do not point the gateway at a real private store until the owner explicitly authorizes that test and the local credential/data boundary is confirmed.

## Verification

Run the complete Python regression suite:

\`\`\`powershell
python -m unittest discover -s tests -p "test_*.py" -v
\`\`\`

The website test workflow also runs this command before the existing V4.5 data reproducibility check, Web tests, typecheck, and static builds. This change does not modify the GitHub Pages deployment workflow and must not trigger a deployment.
