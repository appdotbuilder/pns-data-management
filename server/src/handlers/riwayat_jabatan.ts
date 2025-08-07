
import { db } from '../db';
import { riwayatJabatanTable, pegawaiTable } from '../db/schema';
import { type CreateRiwayatJabatanInput, type RiwayatJabatan } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const createRiwayatJabatan = async (input: CreateRiwayatJabatanInput): Promise<RiwayatJabatan> => {
  try {
    // Verify pegawai exists before creating riwayat jabatan
    const pegawaiExists = await db.select({ id: pegawaiTable.id })
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, input.pegawai_id))
      .execute();

    if (pegawaiExists.length === 0) {
      throw new Error(`Pegawai with ID ${input.pegawai_id} not found`);
    }

    // Insert riwayat jabatan record
    const result = await db.insert(riwayatJabatanTable)
      .values({
        pegawai_id: input.pegawai_id,
        jabatan: input.jabatan,
        unit_kerja: input.unit_kerja,
        tmt_jabatan: input.tmt_jabatan,
        tmt_berakhir: input.tmt_berakhir || null,
        keterangan: input.keterangan || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Riwayat jabatan creation failed:', error);
    throw error;
  }
};

export const getRiwayatJabatanByPegawai = async (pegawaiId: number): Promise<RiwayatJabatan[]> => {
  try {
    // Verify pegawai exists
    const pegawaiExists = await db.select({ id: pegawaiTable.id })
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, pegawaiId))
      .execute();

    if (pegawaiExists.length === 0) {
      throw new Error(`Pegawai with ID ${pegawaiId} not found`);
    }

    // Get all riwayat jabatan for the pegawai, ordered by TMT descending
    const results = await db.select()
      .from(riwayatJabatanTable)
      .where(eq(riwayatJabatanTable.pegawai_id, pegawaiId))
      .orderBy(desc(riwayatJabatanTable.tmt_jabatan))
      .execute();

    return results;
  } catch (error) {
    console.error('Get riwayat jabatan failed:', error);
    throw error;
  }
};

export const getCurrentJabatan = async (pegawaiId: number): Promise<RiwayatJabatan | null> => {
  try {
    // Verify pegawai exists
    const pegawaiExists = await db.select({ id: pegawaiTable.id })
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, pegawaiId))
      .execute();

    if (pegawaiExists.length === 0) {
      throw new Error(`Pegawai with ID ${pegawaiId} not found`);
    }

    // Get the most recent riwayat jabatan (current position)
    const results = await db.select()
      .from(riwayatJabatanTable)
      .where(eq(riwayatJabatanTable.pegawai_id, pegawaiId))
      .orderBy(desc(riwayatJabatanTable.tmt_jabatan))
      .limit(1)
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Get current jabatan failed:', error);
    throw error;
  }
};
