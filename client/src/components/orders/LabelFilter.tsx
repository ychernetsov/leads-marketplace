import type { LabelWithCount } from '../../types/order';
import { LabelChip } from './LabelChip';

interface LabelFilterProps {
  labels: LabelWithCount[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/** Row of label chips; clicking toggles a label in the active filter. */
export function LabelFilter({ labels, selectedIds, onChange }: LabelFilterProps) {
  if (labels.length === 0) return null;

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      <span className="pc-label" style={{ marginBottom: 0, marginRight: 4 }}>
        LABELS
      </span>
      {labels.map((label) => (
        <LabelChip
          key={label.id}
          name={label.name}
          active={selectedIds.includes(label.id)}
          onClick={() => toggle(label.id)}
        />
      ))}
      {selectedIds.length > 0 && (
        <button className="pc-nav-link" onClick={() => onChange([])}>
          CLEAR
        </button>
      )}
    </div>
  );
}
