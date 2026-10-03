import { randomUUID } from 'node:crypto';
import { BudgetError, budgetDay, DAILY_TOKEN_LIMIT, type BudgetStore } from './budget.ts';

export function memoryBudget(): BudgetStore {
  let charged = 0,
    consumed = 0;
  const held = new Map<string, number>();
  return {
    async reserve(tokens) {
      if (charged + tokens > DAILY_TOKEN_LIMIT) throw new BudgetError(429, 'Daily budget reached.');
      charged += tokens;
      const id = randomUUID();
      held.set(id, tokens);
      return { day: budgetDay().day, id, tokens };
    },
    async settle(reservation, actual) {
      if (
        !Number.isSafeInteger(actual) ||
        actual < 0 ||
        actual > reservation.tokens ||
        !held.has(reservation.id)
      )
        return;
      charged += actual - reservation.tokens;
      consumed += actual;
      held.delete(reservation.id);
    },
    async snapshot() {
      return {
        limit: DAILY_TOKEN_LIMIT,
        used: consumed,
        committed: charged,
        remaining: DAILY_TOKEN_LIMIT - charged,
        resetsAt: budgetDay().resetsAt,
      };
    },
  };
}
