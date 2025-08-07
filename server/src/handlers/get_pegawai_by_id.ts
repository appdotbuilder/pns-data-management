
import { db } from '../db';
import { pegawaiTable } from '../db/schema';
import { type GetPegawaiByIdInput, type Pegawai } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPegawaiById(input: GetPegawaiByIdInput): Promise<Pegawai | null> {
  try {
    const results = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const pegawai = results[0];
    
    return {
      ...pegawai,
      // Ensure date fields are properly typed as Date objects
      tanggal_lahir: pegawai.tanggal_lahir,
      tmt_jabatan: pegawai.tmt_jabatan,
      created_at: pegawai.created_at,
      updated_at: pegawai.updated_at
    };
  } catch (error) {
    console.error('Failed to get pegawai by ID:', error);
    throw error;
  }
}
