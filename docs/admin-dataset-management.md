# Admin dataset management (edit / delete, single + bulk)

Admins (`admin@dev.local` / `devpassword1` in `dev:mocks`) can now manage
every dataset from **DATASETS** in the header → `/admin/datasets`.

## UI (`client/src/pages/AdminDatasetsPage.tsx`)

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
- Deleting warns when the selection has purchases: those orders are removed
  too, and buyers lose "download again" for that dataset.

## API (`server/src/routes/files.routes.ts`, all `requireAuth` + `requireAdmin`)

| Method | Path | Body | Result |
|--------|------|------|--------|
| `GET` | `/files/admin/list` | — | every file (any status) + `orderCount`, `sizeBytes` |
| `PATCH` | `/files/:id` | `{ title?, description?, priceCents? }` (≥1 field) | updated file |
| `DELETE` | `/files/:id` | — | `204`; deletes the file, its orders, and its stored objects |
| `PATCH` | `/files/bulk` | `{ ids: uuid[], description?, priceCents? }` (≥1 field) | `{ updated: n }` |
| `POST` | `/files/bulk-delete` | `{ ids: uuid[] }` | `{ deleted: n }` |

Validation (zod): title 1–200 chars, description 1–2000 chars, `priceCents`
a positive integer. Non-admins get `403`, anonymous users `401`, unknown ids
`404`. Bulk routes are registered before the `/:id` routes so `bulk` is never
parsed as an id.

Deletes run `order.deleteMany` + `file.delete` in one Prisma transaction
(the schema's `orders.file_id` FK is `RESTRICT`, and no schema change was
needed). Stored objects (full CSV + public sample) are removed from the local
mock storage via `deleteStoredObjects()`; in real-R2 mode that helper is a
deliberate no-op, since 3rd-party integration changes are out of scope.

## Verified (dev:mocks, scripted Chromium + direct SQLite inspection)

Single edit persisted to `files` (title/description/price) → catalog shows
the new title/price; invalid price rejected client- and server-side; bulk
price edit of 2 rows; single delete of a purchased dataset (warning shown,
order row removed, storage objects removed); select-all bulk delete; empty
state; failed upload visible + deletable; non-admin / anonymous access
rejected.
