
import { db } from '../db';
import { pegawaiTable } from '../db/schema';
import { type Pegawai } from '../schema';
import { eq } from 'drizzle-orm';

export const getPegawai = async (): Promise<Pegawai[]> => {
  try {
    // Fetch all active pegawai records
    const results = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.is_active, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch pegawai:', error);
    throw error;
  }
};
