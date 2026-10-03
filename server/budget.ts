import { MongoClient, type Collection } from 'mongodb';
import { randomUUID } from 'node:crypto';

export const DAILY_TOKEN_LIMIT = 500_000;
export class BudgetError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export function budgetDay(now = new Date()) {
  const shifted = new Date(now.getTime() + 330 * 60_000);
  const day = shifted.toISOString().slice(0, 10);
  const resetsAt = new Date(Date.parse(`${day}T00:00:00+05:30`) + 86_400_000).toISOString();
  return { day, resetsAt };
}
type UsageDocument = {
  _id: string;
  charged: number;
  consumed: number;
  reservations: Record<string, number>;
  resetsAt: string;
};
export type Reservation = { day: string; id: string; tokens: number };
export interface BudgetStore {
  reserve(tokens: number): Promise<Reservation>;
  settle(reservation: Reservation, actual: number): Promise<void>;
  snapshot(): Promise<{
    limit: number;
    used: number;
    committed: number;
    remaining: number;
    resetsAt: string;
  }>;
}
let connection: Promise<MongoClient> | undefined;
export function budgetConfigured() {
  return !!process.env.MONGODB_URI;
}
async function collection(): Promise<Collection<UsageDocument>> {
  if (!process.env.MONGODB_URI)
    throw new BudgetError(
      503,
      'The public assistant is being configured. You can use your own API key in the meantime.',
    );
  if (!connection) {
    connection = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    })
      .connect()
      .catch((error) => {
        connection = undefined;
        throw error;
      });
  }
  return (await connection).db('function_studies').collection<UsageDocument>('daily_ai_usage');
}
export const publicBudget: BudgetStore = {
  async reserve(tokens) {
    if (!Number.isSafeInteger(tokens) || tokens < 1 || tokens > DAILY_TOKEN_LIMIT)
      throw new BudgetError(
        429,
        'This request is too large for the remaining public budget. Try a shorter conversation or use your own key.',
      );
    const coll = await collection(),
      { day, resetsAt } = budgetDay(),
      id = randomUUID();
    try {
      await coll.updateOne(
        { _id: day },
        { $setOnInsert: { charged: 0, consumed: 0, reservations: {}, resetsAt } },
        { upsert: true },
      );
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000))
        throw error;
    }
    const updated = await coll.findOneAndUpdate(
      { _id: day, charged: { $lte: DAILY_TOKEN_LIMIT - tokens } },
      { $inc: { charged: tokens }, $set: { [`reservations.${id}`]: tokens } },
      { returnDocument: 'after' },
    );
    if (!updated)
      throw new BudgetError(
        429,
        'The public assistant has reached its daily allowance. It resets at midnight IST. Use your own API key to continue.',
      );
    return { day, id, tokens };
  },
  async settle(reservation, actual) {
    // Unknown usage stays charged. Never release a reservation after a timeout or ambiguous provider error.
    if (!Number.isSafeInteger(actual) || actual < 0 || actual > reservation.tokens) return;
    const coll = await collection();
    await coll.updateOne(
      { _id: reservation.day, [`reservations.${reservation.id}`]: reservation.tokens },
      {
        $inc: { charged: actual - reservation.tokens, consumed: actual },
        $unset: { [`reservations.${reservation.id}`]: '' },
      },
    );
  },
  async snapshot() {
    const { day, resetsAt } = budgetDay(),
      doc = await (await collection()).findOne({ _id: day });
    const committed = doc?.charged ?? 0;
    return {
      limit: DAILY_TOKEN_LIMIT,
      used: doc?.consumed ?? 0,
      committed,
      remaining: Math.max(0, DAILY_TOKEN_LIMIT - committed),
      resetsAt,
    };
  },
};

// UTF-8 bytes conservatively bound text tokens; reserve the full configured output allowance too.
export function tokenReservation(body: unknown, maxOutputTokens: number) {
  return Buffer.byteLength(JSON.stringify(body), 'utf8') * 4 + maxOutputTokens + 2048;
}
