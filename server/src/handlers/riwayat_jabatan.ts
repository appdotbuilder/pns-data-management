
import { db } from '../db';
import { riwayatJabatanTable, pegawaiTable } from '../db/schema';
import { type CreateRiwayatJabatanInput, type UpdateRiwayatJabatanInput, type RiwayatJabatan } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function createRiwayatJabatan(input: CreateRiwayatJabatanInput): Promise<RiwayatJabatan> {
  try {
    // Verify pegawai exists before creating job history
    const pegawaiExists = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, input.pegawai_id))
      .execute();

    if (pegawaiExists.length === 0) {
      throw new Error(`Pegawai with ID ${input.pegawai_id} not found`);
    }

    // Create new job position history record
    const result = await db.insert(riwayatJabatanTable)
      .values({
        pegawai_id: input.pegawai_id,
        satuan_kerja: input.satuan_kerja,
        unit_kerja: input.unit_kerja,
        jabatan_utama: input.jabatan_utama,
        jabatan_tambahan: input.jabatan_tambahan || null,
        tmt_jabatan: input.tmt_jabatan,
        tmt_jabatan_tambahan: input.tmt_jabatan_tambahan || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Riwayat jabatan creation failed:', error);
    throw error;
  }
}

export async function getRiwayatJabatanByPegawai(pegawaiId: number): Promise<RiwayatJabatan[]> {
  try {
    // Fetch all job history records for the employee, ordered by most recent first
    const results = await db.select()
      .from(riwayatJabatanTable)
      .where(eq(riwayatJabatanTable.pegawai_id, pegawaiId))
      .orderBy(desc(riwayatJabatanTable.tmt_jabatan))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch riwayat jabatan:', error);
    throw error;
  }
}

export async function updateRiwayatJabatan(input: UpdateRiwayatJabatanInput): Promise<RiwayatJabatan> {
  try {
    // Verify the record exists before updating
    const existingRecord = await db.select()
      .from(riwayatJabatanTable)
      .where(eq(riwayatJabatanTable.id, input.id))
      .execute();

    if (existingRecord.length === 0) {
      throw new Error(`Riwayat jabatan with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.satuan_kerja !== undefined) updateData.satuan_kerja = input.satuan_kerja;
    if (input.unit_kerja !== undefined) updateData.unit_kerja = input.unit_kerja;
    if (input.jabatan_utama !== undefined) updateData.jabatan_utama = input.jabatan_utama;
    if (input.jabatan_tambahan !== undefined) updateData.jabatan_tambahan = input.jabatan_tambahan;
    if (input.tmt_jabatan !== undefined) updateData.tmt_jabatan = input.tmt_jabatan;
    if (input.tmt_jabatan_tambahan !== undefined) updateData.tmt_jabatan_tambahan = input.tmt_jabatan_tambahan;

    // Update the record
    const result = await db.update(riwayatJabatanTable)
      .set(updateData)
      .where(eq(riwayatJabatanTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Riwayat jabatan update failed:', error);
    throw error;
  }
}

export async function deleteRiwayatJabatan(id: number): Promise<{ success: boolean }> {
  try {
    // Verify the record exists before deleting
    const existingRecord = await db.select()
      .from(riwayatJabatanTable)
      .where(eq(riwayatJabatanTable.id, id))
      .execute();

    if (existingRecord.length === 0) {
      throw new Error(`Riwayat jabatan with ID ${id} not found`);
    }

    // Delete the record
    await db.delete(riwayatJabatanTable)
      .where(eq(riwayatJabatanTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Riwayat jabatan deletion failed:', error);
    throw error;
  }
}

export async function getCurrentJabatan(pegawaiId: number): Promise<RiwayatJabatan | null> {
  try {
    // Get the most recent job position (highest TMT Jabatan)
    const results = await db.select()
      .from(riwayatJabatanTable)
      .where(eq(riwayatJabatanTable.pegawai_id, pegawaiId))
      .orderBy(desc(riwayatJabatanTable.tmt_jabatan))
      .limit(1)
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch current jabatan:', error);
    throw error;
  }
}
