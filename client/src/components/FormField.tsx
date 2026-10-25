import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  first?: boolean;
}

/** Label + control spacing used by every form in the app. */
export function FormField({ label, children, first = false }: FormFieldProps) {
  return (
    <div style={{ marginTop: first ? 0 : 16 }}>
      <div className="pc-label">{label}</div>
      {children}
    </div>
  );
}
