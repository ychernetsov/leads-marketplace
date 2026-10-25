import { useNavigate } from 'react-router-dom';

export function CheckoutCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="pc-page">
      <div className="pc-header" style={{ justifyContent: 'center' }}>
        <span
          className="pc-wordmark"
          role="link"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate('/');
          }}
        >
          CSV ARCHIVE
        </span>
      </div>

      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div className="pc-row-title">PAYMENT CANCELLED</div>
        <div className="pc-row-meta" style={{ marginTop: 8 }}>
          NO CHARGE WAS MADE.
        </div>
        <button
          className="pc-pill pc-pill-accent"
          style={{ marginTop: 20 }}
          onClick={() => navigate('/')}
        >
          BACK TO CATALOG
        </button>
      </div>
    </div>
  );
}
