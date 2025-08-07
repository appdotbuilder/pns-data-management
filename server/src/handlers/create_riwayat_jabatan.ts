
import { db } from '../db';
import { riwayatJabatanTable, pegawaiTable } from '../db/schema';
import { type CreateRiwayatJabatanInput, type RiwayatJabatan } from '../schema';
import { eq } from 'drizzle-orm';

export const createRiwayatJabatan = async (input: CreateRiwayatJabatanInput): Promise<RiwayatJabatan> => {
  try {
    // Verify pegawai exists first to prevent foreign key constraint errors
    const pegawaiExists = await db.select({ id: pegawaiTable.id })
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, input.pegawai_id))
      .limit(1)
      .execute();

    if (pegawaiExists.length === 0) {
      throw new Error(`Pegawai with id ${input.pegawai_id} not found`);
    }

    // Insert riwayat jabatan record
    const result = await db.insert(riwayatJabatanTable)
      .values({
        pegawai_id: input.pegawai_id,
        jabatan: input.jabatan,
        unit_kerja: input.unit_kerja,
        tmt_jabatan: input.tmt_jabatan,
        tmt_berakhir: input.tmt_berakhir,
        keterangan: input.keterangan
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Riwayat jabatan creation failed:', error);
    throw error;
  }
};
