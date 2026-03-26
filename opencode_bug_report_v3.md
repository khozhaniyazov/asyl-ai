# Opencode Remediation Report: Phase 3 (i18n & UI Polish)

The Phase 2 fixes successfully resolved the CORS issue and the Parent Portal 404. However, some i18n regressions were introduced, and some keys are mismatched between the frontend and the translation files.

## Summary of Remaining Issues
1. **Marketplace Filters (Object Error)**: The `common.filters` key is now an object in `ru.json`/`kk.json`. The frontend `MarketplaceSearch.tsx` tries to render `t("common.filters")` directly, which returns an object and crashes/shows an error. 
2. **Parent Portal (Missing Keys)**: The frontend `ParentPortal.tsx` and `ParentLogin.tsx` use the `parent` namespace (e.g., `parent.portal`), but the translation files use the `portal` root key.
3. **Translation Key Cleanup**: Ensure all keys used in `ParentPortal.tsx`, `ParentLogin.tsx`, and `MarketplaceSearch.tsx` exist in both `ru.json` and `kk.json`.

## Required Fixes

### [Component] Frontend: Marketplace & i18n
- **[MODIFY] [MarketplaceSearch.tsx](file:///c:/asyl-ai/frontend/src/app/components/MarketplaceSearch.tsx)**:
    - Change `t("common.filters")` to `t("common.filters.title")` (around line 101).
- **[MODIFY] [ru.json](file:///c:/asyl-ai/frontend/src/i18n/locales/ru.json)** & **[kk.json](file:///c:/asyl-ai/frontend/src/i18n/locales/kk.json)**:
    - Rename the root `portal` key to `parent`.
    - Ensure `parent.portal`, `parent.portalDesc`, `parent.phoneNumber`, `parent.sendCode`, etc. (keys used in `ParentLogin.tsx`) exist.
    - Ensure `parent.homeworkCompleted`, `parent.paymentDue`, `parent.nextSession`, etc. (keys used in `ParentPortal.tsx`) exist.

### [Component] Frontend: Parent Portal UI
- **[MODIFY] [ParentPortal.tsx](file:///c:/asyl-ai/frontend/src/app/components/ParentPortal.tsx)**:
    - Ensure all `t()` calls match the updated `parent` namespace.
- **[MODIFY] [ParentLogin.tsx](file:///c:/asyl-ai/frontend/src/app/components/ParentLogin.tsx)**:
    - Ensure all `t()` calls match the updated `parent` namespace.

## Todos
1. [ ] Correct `common.filters` usage in `MarketplaceSearch.tsx`.
2. [ ] Rename `portal` -> `parent` in `ru.json` and `kk.json`.
3. [ ] Verify and add missing keys for `ParentLogin.tsx` and `ParentPortal.tsx`.
4. [ ] Run a quick check to ensure no other `t("common.filters")` calls exist.
5. [ ] Commit and push all changes.
