
import { db } from '../db';
import { posisiTersediaTable } from '../db/schema';
import { type PosisiTersedia } from '../schema';
import { eq } from 'drizzle-orm';

export const getPosisiTersedia = async (): Promise<PosisiTersedia[]> => {
  try {
    const results = await db.select()
      .from(posisiTersediaTable)
      .where(eq(posisiTersediaTable.is_available, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch available positions:', error);
    throw error;
  }
};
