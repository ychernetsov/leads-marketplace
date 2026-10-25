export interface Label {
  id: string;
  name: string;
}

/** A label with usage count, as returned by `/labels`. */
export interface LabelWithCount extends Label {
  orderCount: number;
}

/** One item in the buyer's library (a paid order). */
export interface PurchasedItem {
  id: string;
  fileId: string;
  /** Buyer's custom title if set, otherwise the dataset title. */
  title: string;
  description: string;
  originalTitle: string;
  originalDescription: string;
  isCustomized: boolean;
  amountCents: number;
  currency: string;
  numRows: number | null;
  paidAt: string;
  archivedAt: string | null;
  /** The admin removed the dataset from the catalog; the buyer keeps access. */
  fileRemoved: boolean;
  labels: Label[];
}
