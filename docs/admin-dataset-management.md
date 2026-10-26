# Admin dataset management (edit / delete, single + bulk)

Admins (`admin@dev.local` / `devpassword1` in `dev:mocks`) manage datasets
directly in the catalog: the **VIEW / EDIT MODE** toggle in the catalog
sub-header (`/?mode=edit`) switches the same page into management mode.
There is no separate admin datasets route.

## UI (`client/src/components/admin/DatasetEditor.tsx`, mounted by `CatalogPage`)

- Lists **all** datasets regardless of status (`READY`, `FAILED`,
  `UPLOADING`, `PROCESSING` badges), with price, row count, purchase count,
  upload date and description. Failed uploads — which are hidden from the
  public catalog — are visible here so they can be cleaned up.
- **Per row:** `EDIT` (title, description, price) and `DELETE`.
- **Bulk:** tick rows (or the select-all box in the sub-header) to reveal
  `EDIT SELECTED`, `DELETE SELECTED` and `CLEAR`.
  - Bulk edit applies a new **price** and/or **description** to every
    selected dataset; fields left blank are kept as-is. Title is deliberately
    single-item only (many datasets sharing one title is never intended).
- All edits/deletes go through confirmation/edit modals (`Escape`/overlay
  closes them), show a success toast, and refresh both the admin list and the
  public catalog immediately.
- Deleting a dataset never deletes purchases. A dataset nobody bought is
  removed for real; a purchased one is only removed from the catalog (soft
  delete), and its buyers keep it under **My Purchases** (flagged
  "REMOVED FROM CATALOG") with download still working.

## API (`server/src/routes/files.routes.ts`; all but `GET /files` are `requireAuth` + `requireAdmin`)

| Method | Path | Body | Result |
|--------|------|------|--------|
| `GET` | `/files` | — | the catalog; for an admin caller it also includes unpublished files (any status) + `orderCount`, `sizeBytes` |
| `PATCH` | `/files/:id` | `{ title?, description?, priceCents? }` (≥1 field) | updated file |
| `DELETE` | `/files/:id` | — | `204`; hard-deletes an unpurchased file (+ stored objects), soft-deletes a purchased one |
| `PATCH` | `/files/bulk` | `{ ids: uuid[], description?, priceCents? }` (≥1 field) | `{ updated: n }` |
| `POST` | `/files/bulk-delete` | `{ ids: uuid[] }` | `{ deleted: n }` |

Validation (zod): title 1–200 chars, description 1–2000 chars, `priceCents`
a positive integer. Non-admins get `403`, anonymous users `401`, unknown ids
`404`. Bulk routes are registered before the `/:id` routes so `bulk` is never
parsed as an id.

Orders are never deleted. Unpurchased files are hard-deleted together with
their stored objects; purchased files get `deleted_at` set, keep their full
file (buyers can still download) and only lose the public sample. Storage
cleanup happens via `deleteStoredObjects()`, which is a deliberate no-op in
real-R2 mode since 3rd-party integration changes are out of scope.

## Verified (dev:mocks, scripted Chromium + direct SQLite inspection)

Single edit persisted to `files` (title/description/price) → catalog shows
the new title/price; invalid price rejected client- and server-side; bulk
price edit of 2 rows; single delete of a purchased dataset (warning shown,
order row removed, storage objects removed); select-all bulk delete; empty
state; failed upload visible + deletable; non-admin / anonymous access
rejected.
