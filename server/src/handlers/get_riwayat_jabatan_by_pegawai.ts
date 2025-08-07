
import { db } from '../db';
import { riwayatJabatanTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type GetPegawaiByIdInput, type RiwayatJabatan } from '../schema';

export async function getRiwayatJabatanByPegawai(input: GetPegawaiByIdInput): Promise<RiwayatJabatan[]> {
  try {
    // Query riwayat jabatan for specific pegawai, ordered by tmt_jabatan descending
    const results = await db
      .select()
      .from(riwayatJabatanTable)
      .where(eq(riwayatJabatanTable.pegawai_id, input.id))
      .orderBy(desc(riwayatJabatanTable.tmt_jabatan))
      .execute();

    // Return results - dates are already Date objects from timestamp columns
    return results;
  } catch (error) {
    console.error('Failed to get riwayat jabatan by pegawai:', error);
    throw error;
  }
}
