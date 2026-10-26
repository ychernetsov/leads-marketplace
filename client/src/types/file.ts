export type FileStatus = 'uploading' | 'processing' | 'ready' | 'failed';

/** A dataset as returned by `GET /files` for everyone. */
export interface CatalogFile {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  numRows: number | null;
  sampleUrl: string | null;
  status: FileStatus;
  createdAt: string;
}

/** Extra management fields `GET /files` includes when the caller is an admin. */
export interface AdminFile extends CatalogFile {
  sizeBytes: number | null;
  originalFilename: string | null;
  orderCount: number;
}

export function isAdminFile(file: CatalogFile): file is AdminFile {
  return 'orderCount' in file;
}
