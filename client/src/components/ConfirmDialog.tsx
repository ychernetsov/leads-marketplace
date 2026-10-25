import { ReactNode } from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  confirmLabel: string;
  busy?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children: ReactNode;
}

/** A modal that asks the user to confirm one action. */
export function ConfirmDialog({
  title,
  confirmLabel,
  busy = false,
  danger = false,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="pc-pill pc-pill-outline" onClick={onClose} disabled={busy}>
            CANCEL
          </button>
          <button
            type="button"
            className={`pc-pill ${danger ? 'pc-pill-danger-solid' : 'pc-pill-accent'}`}
            onClick={onConfirm}
            disabled={busy}
            autoFocus
          >
            {busy ? 'WORKING…' : confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
