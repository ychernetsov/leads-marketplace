import { formatPrice } from '../../utilities/format';

interface BuyButtonProps {
  priceCents: number;
  onBuy: () => void;
}

export function BuyButton({ priceCents, onBuy }: BuyButtonProps) {
  return (
    <button className="pc-pill pc-pill-accent" onClick={onBuy}>
      {formatPrice(priceCents)} BUY
    </button>
  );
}
