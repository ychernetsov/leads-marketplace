interface DownloadButtonProps {
  downloading: boolean;
  onDownload: () => void;
  label?: string;
}

/** Download action for a dataset the user already owns. */
export function DownloadButton({ downloading, onDownload, label = 'DOWNLOAD' }: DownloadButtonProps) {
  return (
    <button
      className="pc-pill pc-pill-outline"
      disabled={downloading}
      onClick={onDownload}
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      {downloading && <span className="pc-spin" />}
      {downloading ? 'DOWNLOADING' : label}
    </button>
  );
}
