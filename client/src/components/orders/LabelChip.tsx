import { labelColor } from '../../utilities/labels';

interface LabelChipProps {
  name: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

/** A small coloured tag. Clickable when `onClick` is given (filters), removable when `onRemove` is given. */
export function LabelChip({ name, active = false, onClick, onRemove }: LabelChipProps) {
  const color = labelColor(name);
  return (
    <span
      className="pc-chip"
      style={{
        borderColor: color,
        color: active ? 'var(--pc-field-bg)' : color,
        background: active ? color : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {name.toUpperCase()}
      {onRemove && (
        <button
          type="button"
          className="pc-chip-remove"
          aria-label={`Remove label ${name}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
