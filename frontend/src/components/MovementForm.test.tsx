import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MovementForm } from "./MovementForm";

describe("MovementForm", () => {
  it("blocks submission and shows an error for an invalid amount", async () => {
    const onSubmit = vi.fn();
    render(<MovementForm disabled={false} onSubmit={onSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/monto/i), "abc");
    await user.click(screen.getByRole("button", { name: /^depositar$/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/número positivo/i)).toBeInTheDocument();
  });

  it("calls onSubmit with the typed amount and movement type", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MovementForm disabled={false} onSubmit={onSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/monto/i), "100.50");
    await user.click(screen.getByRole("button", { name: /retirar/i }));

    expect(onSubmit).toHaveBeenCalledWith("100.50", "withdrawal");
  });
});
