# Identified Improvements

This file tracks improvements identified during refactoring but not implemented to preserve current UI functionality.

## Format

| Date | Area | Description | Reason to Update |
|------|------|------------|-----------------|
| 2026-04-23 | ServiceModal | Add support for dynamic form fields | More flexible |
| 2026-04-23 | ServiceTable | Add column sorting, filtering | Better UX |
| 2026-04-23 | API Gateway | Consolidate 32→10 modals | Reduce file count |
| 2026-04-23 | IAM | Consolidate 18→10 modals | Reduce file count |
| 2026-04-23 | Lambda | Merge create/edit/delete to single modal | Already complex |

## Priority

1. **Low**: ServiceModal form field support (existing works fine)
2. **Low**: ServiceTable sorting/filtering (existing table works)
3. **Medium**: API Gateway consolidation (high file count)
4. **Medium**: IAM consolidation (high file count)
5. **Low**: Lambda consolidation (already structured well)

## Notes

- Generic components created: ServiceModal, ServiceTable, UniversalCreateDeleteModal, UniversalViewModal
- These can be used for NEW services following ADDING_SERVICES.md
- Existing services continue to work unchanged
- Consolidation of existing services requires significant testing

---

## Files Created During Refactor

| File | Purpose |
|------|---------|
| components/common/ServiceModal.vue | Generic mode-based modal |
| components/common/ServiceTable.vue | Generic table component |
| components/common/UniversalCreateDeleteModal.vue | Create/Delete confirmation |
| components/common/UniversalViewModal.vue | View details wrapper |
| composables/useGenericCrud.ts | Generic CRUD operations |
| components/lambda/index.ts | Barrel export |
| ADDING_SERVICES.md | New service guide |
| README.md | Updated with Development section |