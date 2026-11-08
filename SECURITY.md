# Security Audit & Hardening Report (`SECURITY.md`)

## 1. Executive Summary

**Cerebra** operates as a **100% offline-capable, zero-telemetry client application** across both its Web/PWA target (`/src`) and Native Android target (`/android`). All 10,000 puzzle levels, hints, and explanations are deterministically computed on-device without external API calls, third-party trackers, or remote code execution.

---

## 2. Security Audit Checklist & Verification

### A. Secrets & Credential Hygiene
- **Zero Hardcoded Secrets**: Audited the entire repository (`src/`, `android/`, `scripts/`, `.github/`, config files) to confirm zero API keys, tokens, private keys, or internal cloud instance URLs are present.
- **Git Ignore Rules**: `.gitignore` explicitly blocks `.env*` (except `.env.example`), Android keystores (`*.jks`, `*.keystore`), `local.properties`, and build output directories (`dist/`, `dev-dist/`, `build/`, `*.apk`, `*.aab`).

### B. DOM & Input Hardening (XSS & Injection Prevention)
- **Zero Unsafe DOM Sinks**: The React codebase contains zero instances of `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `eval()`, or `new Function()`.
- **Strict Text Normalization**: Free-text answer inputs (used in *Number Sequence*, *Lateral Thinking*, and *Math Mystery*) are normalized via `.trim().toLowerCase()` and compared strictly against deterministic answer strings and keyword arrays without dynamic regex compilation from user input.

### C. Local Storage Deserialization & Prototype Pollution Protection
- **Schema Sanitization (`src/data/storage.ts`)**:
  - Uses `Object.prototype.hasOwnProperty.call` when reading persisted game records to prevent prototype pollution.
  - Enforces integer clamping (`clampInt`) on all numeric fields (`unlockedLevel` clamped to `[1, 1000]`, `completedLevels` filtered and deduplicated within `[1, 1000]`, and counters bounded to safe non-negative integers).
  - Validates ISO date strings (`^\d{4}-\d{2}-\d{2}$`) and achievement IDs against the static `ACHIEVEMENTS_LIST` allowlist before hydrating state.

### D. Native Android Security Hardening (`android/app/src/main/AndroidManifest.xml`)
- **Backup Extraction Disabled**: Configured `android:allowBackup="false"`, `android:fullBackupContent="false"`, and `android:dataExtractionRules="@null"` to prevent unauthorized ADB backup extraction of application storage.
- **Cleartext Traffic Blocked**: Configured `android:usesCleartextTraffic="false"` to disallow unencrypted HTTP network traffic.
- **Minimal Permissions**: Requests only `android.permission.VIBRATE` for optional tactile haptic feedback; zero dangerous runtime permissions (camera, location, contacts, microphone, or external storage) are requested.
- **R8 / ProGuard Minification**: Enabled `isMinifyEnabled = true` for release builds with explicit keep rules in `android/app/proguard-rules.pro`.

---

## 3. Automated Integrity Verification

Run the automated verification and type-check suite at any time:

```bash
npm run lint
npm test
npm run build
```
