import { useState, type FormEvent } from "react";
import { ApiError } from "../lib/api";
import { validateAmount } from "../lib/amount";

interface Props {
  disabled: boolean;
  onSubmit: (amount: string, type: "deposit" | "withdrawal") => Promise<void>;
}

export function MovementForm({ disabled, onSubmit }: Props) {
  const [amount, setAmount] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState<"deposit" | "withdrawal" | null>(null);

  async function submit(type: "deposit" | "withdrawal") {
    const validationError = validateAmount(amount);
    setFieldError(validationError);
    setServerError(null);
    if (validationError) return;

    setPending(type);
    try {
      await onSubmit(amount.trim(), type);
      setAmount("");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "No pudimos procesar la operación.");
    } finally {
      setPending(null);
    }
  }

  function handleFormSubmit(event: FormEvent) {
    event.preventDefault();
    submit("deposit");
  }

  const busy = disabled || pending !== null;

  return (
    <form className="card" onSubmit={handleFormSubmit}>
      <h2>Depositar o retirar</h2>

      <label className="field">
        <span>Monto (USD)</span>
        <input
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setFieldError(null);
          }}
          disabled={busy}
        />
      </label>

      {fieldError && <div className="banner banner-error">{fieldError}</div>}
      {serverError && <div className="banner banner-error" role="alert">{serverError}</div>}

      <div className="actions">
        <button type="submit" disabled={busy}>
          {pending === "deposit" ? "Depositando…" : "Depositar"}
        </button>
        <button type="button" className="secondary" disabled={busy} onClick={() => submit("withdrawal")}>
          {pending === "withdrawal" ? "Retirando…" : "Retirar"}
        </button>
      </div>
    </form>
  );
}
