
import { db } from '../db';
import { mutasiTable, pegawaiTable } from '../db/schema';
import { type CreateMutasiInput, type Mutasi } from '../schema';
import { eq } from 'drizzle-orm';

export const createMutasi = async (input: CreateMutasiInput): Promise<Mutasi> => {
  try {
    // Verify that the pegawai exists
    const pegawai = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, input.pegawai_id))
      .execute();

    if (pegawai.length === 0) {
      throw new Error('Pegawai not found');
    }

    // Insert mutasi record
    const result = await db.insert(mutasiTable)
      .values({
        pegawai_id: input.pegawai_id,
        jabatan_baru: input.jabatan_baru,
        unit_kerja_baru: input.unit_kerja_baru,
        tanggal_efektif: input.tanggal_efektif,
        alasan_mutasi: input.alasan_mutasi || null,
        diajukan_oleh: input.diajukan_oleh,
        // Status defaults to 'pending' as defined in schema
        // Other approval fields remain null initially
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Mutasi creation failed:', error);
    throw error;
  }
};
