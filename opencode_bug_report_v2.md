# Asyl AI - Autonomous Remediation Phase 2

The E2E verification showed that although progress was made, several critical issues persist. Please resolve exactly these items:

## 1. Fix CORS (Critical)
The frontend is running on `http://127.0.0.1:5173`. Currently, `main.py` only allows `http://localhost:5173`.
- **Action**: Add `http://127.0.0.1:5173` and `http://127.0.0.1:3000` to `allow_origins` in `backend/app/main.py`.
- **Action**: In `backend/app/main.py`, the `CORSMiddleware` MUST be added **AFTER** any custom middleware (like `AuditMiddleware`) to be the **OUTERMOST** layer on the request stack (Starlette's `add_middleware` prepends to the stack). If `CORSMiddleware` is at line 14 and `AuditMiddleware` is at line 27, then `AuditMiddleware` is **outer** to `CORSMiddleware`. This can cause issues if `AuditMiddleware` chokes on preflight requests. Move `app.add_middleware(CORSMiddleware, ...)` to the bottom (after line 27).

## 2. Fix Localization (Minor)
The UI is looking for `common.filters` but it is defined as `filters` in `ru.json`.
- **Action**: In `frontend/src/i18n/locales/ru.json` (and `kz.json` if possible), nest the `filters` object inside a `common` object, OR replace `filters` with `common` where appropriate.
- **Action**: Fix any other missing keys identified in the logs (e.g., `admin.stats`, `admin.title`, `admin.approve`, `admin.reject`, etc.) which appeared as raw keys in the recording. (Check `frontend/src/app/components/AdminVerification.tsx` for used keys).

## 3. Fix Parent Portal Route (Bug)
The subagent found a 404 on `/parent/portal`.
- **Action**: In `frontend/src/app/routes.ts`, add a route for `/parent/portal` or ensure `/parent` correctly handles the sub-route. (Currently it is `{ path: "/parent", Component: ParentPortal }`).

## 4. Final Verification
- **Action**: Run `python backend/seed_test_data.py` again to ensure the database is in a clean state with the new FK fixes.
- **Action**: Commit and Push all changes once done.
