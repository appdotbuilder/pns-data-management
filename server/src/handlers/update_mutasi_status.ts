
import { db } from '../db';
import { mutasiTable, pegawaiTable } from '../db/schema';
import { type UpdateMutasiStatusInput, type Mutasi } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateMutasiStatus(input: UpdateMutasiStatusInput): Promise<Mutasi> {
  try {
    // First, get the current mutasi record to check if it exists
    const existingMutasi = await db.select()
      .from(mutasiTable)
      .where(eq(mutasiTable.id, input.id))
      .execute();

    if (existingMutasi.length === 0) {
      throw new Error(`Mutasi with id ${input.id} not found`);
    }

    const current = existingMutasi[0];

    // Update the mutasi status
    const updateData: any = {
      status: input.status,
      disetujui_oleh: input.disetujui_oleh,
      tanggal_disetujui: new Date(),
      catatan_persetujuan: input.catatan_persetujuan || null,
    };

    const updatedMutasi = await db.update(mutasiTable)
      .set(updateData)
      .where(eq(mutasiTable.id, input.id))
      .returning()
      .execute();

    // If approved, update the pegawai's current position information
    if (input.status === 'approved') {
      await db.update(pegawaiTable)
        .set({
          jabatan_saat_ini: current.jabatan_baru,
          unit_kerja: current.unit_kerja_baru,
          tmt_jabatan: current.tanggal_efektif,
        })
        .where(eq(pegawaiTable.id, current.pegawai_id))
        .execute();
    }

    return updatedMutasi[0];
  } catch (error) {
    console.error('Update mutasi status failed:', error);
    throw error;
  }
}
