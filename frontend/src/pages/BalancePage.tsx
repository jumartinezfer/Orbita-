import { useCallback, useEffect, useState } from "react";
import { MovementForm } from "../components/MovementForm";
import { TransactionList } from "../components/TransactionList";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { deposit, fetchBalance, fetchTransactions, withdraw, type TransactionPage } from "../lib/endpoints";

const PAGE_SIZE = 10;

export function BalancePage() {
  const { token, logout } = useAuth();
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [page, setPage] = useState<TransactionPage | null>(null);
  const [offset, setOffset] = useState(0);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState<string | null>(null);

  const loadBalance = useCallback(async () => {
    if (!token) return;
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const data = await fetchBalance(token);
      setBalance(data.balance);
    } catch (err) {
      if (err instanceof ApiError) setBalanceError(err.message);
    } finally {
      setBalanceLoading(false);
    }
  }, [token]);

  const loadTransactions = useCallback(
    async (nextOffset: number) => {
      if (!token) return;
      setTxLoading(true);
      setTxError(null);
      try {
        const data = await fetchTransactions(token, PAGE_SIZE, nextOffset);
        setPage(data);
      } catch (err) {
        if (err instanceof ApiError) setTxError(err.message);
      } finally {
        setTxLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadBalance();
    loadTransactions(0);
  }, [loadBalance, loadTransactions]);

  async function handleMovement(amount: string, type: "deposit" | "withdrawal") {
    if (!token) return;
    const idempotencyKey = crypto.randomUUID();
    const action = type === "deposit" ? deposit : withdraw;

    const result = await action(token, amount, idempotencyKey);
    setBalance(result.balance);
    setOffset(0);
    await loadTransactions(0);
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>Orbita</h1>
        <button type="button" className="secondary" onClick={logout}>
          Cerrar sesión
        </button>
      </header>

      <section className="card balance-card">
        <span className="muted">Saldo actual</span>
        {balanceLoading && <p className="balance-amount">Cargando…</p>}
        {!balanceLoading && balanceError && <div className="banner banner-error">{balanceError}</div>}
        {!balanceLoading && !balanceError && <p className="balance-amount">${balance} USD</p>}
      </section>

      <MovementForm disabled={balanceLoading} onSubmit={handleMovement} />

      <TransactionList
        page={page}
        loading={txLoading}
        error={txError}
        onPrev={() => {
          const next = Math.max(offset - PAGE_SIZE, 0);
          setOffset(next);
          loadTransactions(next);
        }}
        onNext={() => {
          const next = offset + PAGE_SIZE;
          setOffset(next);
          loadTransactions(next);
        }}
      />
    </div>
  );
}
