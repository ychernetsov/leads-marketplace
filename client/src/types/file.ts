export type FileStatus = 'uploading' | 'processing' | 'ready' | 'failed';

/** A dataset as shown in the public catalog. */
export interface CatalogFile {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  numRows: number | null;
  sampleUrl: string | null;
}

/** A dataset as shown in the admin management list. */
export interface AdminFile extends CatalogFile {
  sizeBytes: number | null;
  originalFilename: string | null;
  status: FileStatus;
  createdAt: string;
  orderCount: number;
}
