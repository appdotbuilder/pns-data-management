
import { db } from '../db';
import { mutasiTable, pegawaiTable } from '../db/schema';
import { type Mutasi } from '../schema';
import { eq } from 'drizzle-orm';

export async function getMutasiPending(): Promise<Mutasi[]> {
  try {
    const results = await db.select({
      id: mutasiTable.id,
      pegawai_id: mutasiTable.pegawai_id,
      jabatan_baru: mutasiTable.jabatan_baru,
      unit_kerja_baru: mutasiTable.unit_kerja_baru,
      tanggal_efektif: mutasiTable.tanggal_efektif,
      alasan_mutasi: mutasiTable.alasan_mutasi,
      status: mutasiTable.status,
      diajukan_oleh: mutasiTable.diajukan_oleh,
      disetujui_oleh: mutasiTable.disetujui_oleh,
      tanggal_disetujui: mutasiTable.tanggal_disetujui,
      catatan_persetujuan: mutasiTable.catatan_persetujuan,
      created_at: mutasiTable.created_at,
      updated_at: mutasiTable.updated_at,
    })
    .from(mutasiTable)
    .innerJoin(pegawaiTable, eq(mutasiTable.pegawai_id, pegawaiTable.id))
    .where(eq(mutasiTable.status, 'pending'))
    .execute();

    // Since we have a join, we need to extract the mutasi data from the nested structure
    return results.map(result => ({
      id: result.id,
      pegawai_id: result.pegawai_id,
      jabatan_baru: result.jabatan_baru,
      unit_kerja_baru: result.unit_kerja_baru,
      tanggal_efektif: result.tanggal_efektif,
      alasan_mutasi: result.alasan_mutasi,
      status: result.status,
      diajukan_oleh: result.diajukan_oleh,
      disetujui_oleh: result.disetujui_oleh,
      tanggal_disetujui: result.tanggal_disetujui,
      catatan_persetujuan: result.catatan_persetujuan,
      created_at: result.created_at,
      updated_at: result.updated_at,
    }));
  } catch (error) {
    console.error('Failed to get pending mutations:', error);
    throw error;
  }
}
