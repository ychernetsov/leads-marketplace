import { ReactNode, useEffect } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Minimal accessible modal: closes on Escape / overlay click, traps nothing
 * fancy — good enough for the admin edit/confirm dialogs.
 */
export function Modal({ title, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="pc-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pc-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="pc-modal-header">{title}</div>
        <div className="pc-modal-body">{children}</div>
        {footer && <div className="pc-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
