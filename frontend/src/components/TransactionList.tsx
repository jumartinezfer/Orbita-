import type { TransactionPage } from "../lib/endpoints";

interface Props {
  page: TransactionPage | null;
  loading: boolean;
  error: string | null;
  onPrev: () => void;
  onNext: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function TransactionList({ page, loading, error, onPrev, onNext }: Props) {
  return (
    <div className="card">
      <h2>Movimientos</h2>

      {loading && <p className="muted">Cargando movimientos…</p>}
      {error && <div className="banner banner-error">{error}</div>}
      {!loading && !error && page?.items.length === 0 && (
        <p className="muted">Todavía no tienes movimientos.</p>
      )}

      {!loading && !error && page && page.items.length > 0 && (
        <>
          <ul className="transaction-list">
            {page.items.map((tx) => (
              <li key={tx.id} className={`transaction-row transaction-${tx.type}`}>
                <div>
                  <strong>{tx.type === "deposit" ? "Depósito" : "Retiro"}</strong>
                  <span className="muted"> · {dateFormatter.format(new Date(tx.createdAt))}</span>
                </div>
                <span className="amount">
                  {tx.type === "deposit" ? "+" : "-"}${tx.amount}
                </span>
              </li>
            ))}
          </ul>

          <div className="actions">
            <button type="button" className="secondary" disabled={page.offset === 0} onClick={onPrev}>
              Anterior
            </button>
            <button type="button" className="secondary" disabled={!page.hasMore} onClick={onNext}>
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
