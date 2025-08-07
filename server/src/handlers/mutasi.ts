
import { db } from '../db';
import { mutasiTable, pegawaiTable, riwayatJabatanTable } from '../db/schema';
import { type CreateMutasiInput, type UpdateMutasiStatusInput, type Mutasi } from '../schema';
import { eq, and, desc, count, SQL } from 'drizzle-orm';

export async function createMutasi(input: CreateMutasiInput): Promise<Mutasi> {
  try {
    // Verify pegawai exists
    const pegawai = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, input.pegawai_id))
      .limit(1)
      .execute();

    if (pegawai.length === 0) {
      throw new Error('Pegawai not found');
    }

    // Insert mutation request
    const result = await db.insert(mutasiTable)
      .values({
        pegawai_id: input.pegawai_id,
        jabatan_baru: input.jabatan_baru,
        unit_kerja_baru: input.unit_kerja_baru,
        tanggal_efektif: input.tanggal_efektif,
        alasan_mutasi: input.alasan_mutasi || null,
        diajukan_oleh: input.diajukan_oleh,
        status: 'pending'
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Mutation creation failed:', error);
    throw error;
  }
}

export async function updateMutasiStatus(input: UpdateMutasiStatusInput): Promise<Mutasi> {
  try {
    // Verify mutation exists
    const existingMutasi = await db.select()
      .from(mutasiTable)
      .where(eq(mutasiTable.id, input.id))
      .limit(1)
      .execute();

    if (existingMutasi.length === 0) {
      throw new Error('Mutation request not found');
    }

    // Update mutation status
    const updateData: any = {
      status: input.status,
      disetujui_oleh: input.disetujui_oleh,
      catatan_persetujuan: input.catatan_persetujuan || null
    };

    if (input.status !== 'pending') {
      updateData.tanggal_disetujui = new Date();
    }

    const result = await db.update(mutasiTable)
      .set(updateData)
      .where(eq(mutasiTable.id, input.id))
      .returning()
      .execute();

    // If approved, update pegawai current position and add to job history
    if (input.status === 'approved') {
      const mutasi = result[0];
      
      // Get current pegawai data
      const pegawaiData = await db.select()
        .from(pegawaiTable)
        .where(eq(pegawaiTable.id, mutasi.pegawai_id))
        .limit(1)
        .execute();

      if (pegawaiData.length > 0) {
        const pegawai = pegawaiData[0];

        // Add current position to job history if it exists
        if (pegawai.jabatan_saat_ini && pegawai.unit_kerja) {
          await db.insert(riwayatJabatanTable)
            .values({
              pegawai_id: mutasi.pegawai_id,
              jabatan: pegawai.jabatan_saat_ini,
              unit_kerja: pegawai.unit_kerja,
              tmt_jabatan: pegawai.tmt_jabatan || new Date(),
              tmt_berakhir: new Date(),
              keterangan: `Mutasi ke ${mutasi.jabatan_baru} - ${mutasi.unit_kerja_baru}`
            })
            .execute();
        }

        // Update pegawai current position
        await db.update(pegawaiTable)
          .set({
            jabatan_saat_ini: mutasi.jabatan_baru,
            unit_kerja: mutasi.unit_kerja_baru,
            tmt_jabatan: mutasi.tanggal_efektif
          })
          .where(eq(pegawaiTable.id, mutasi.pegawai_id))
          .execute();
      }
    }

    return result[0];
  } catch (error) {
    console.error('Mutation status update failed:', error);
    throw error;
  }
}

export async function getMutasiById(id: number): Promise<Mutasi | null> {
  try {
    const result = await db.select()
      .from(mutasiTable)
      .where(eq(mutasiTable.id, id))
      .limit(1)
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Get mutation by ID failed:', error);
    throw error;
  }
}

export async function deleteMutasi(id: number): Promise<{ success: boolean }> {
  try {
    // Verify mutation exists and is pending
    const existing = await db.select()
      .from(mutasiTable)
      .where(eq(mutasiTable.id, id))
      .limit(1)
      .execute();

    if (existing.length === 0) {
      throw new Error('Mutation request not found');
    }

    if (existing[0].status !== 'pending') {
      throw new Error('Only pending requests can be deleted');
    }

    await db.delete(mutasiTable)
      .where(eq(mutasiTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Mutation deletion failed:', error);
    throw error;
  }
}

interface MutasiFilter {
  pegawai_id?: number;
  status?: 'pending' | 'approved' | 'rejected';
  limit?: number;
  offset?: number;
}

export async function getMutasiList(filter: MutasiFilter): Promise<{ data: Mutasi[]; total: number }> {
  try {
    // Build separate queries for different filter combinations to avoid TypeScript issues
    let data: Mutasi[];
    let total: number;

    if (filter.pegawai_id !== undefined && filter.status) {
      // Both pegawai_id and status filters
      const dataResult = await db.select()
        .from(mutasiTable)
        .where(and(
          eq(mutasiTable.pegawai_id, filter.pegawai_id),
          eq(mutasiTable.status, filter.status)
        ))
        .orderBy(desc(mutasiTable.created_at))
        .limit(filter.limit || 100)
        .offset(filter.offset || 0)
        .execute();

      const countResult = await db.select({ count: count() })
        .from(mutasiTable)
        .where(and(
          eq(mutasiTable.pegawai_id, filter.pegawai_id),
          eq(mutasiTable.status, filter.status)
        ))
        .execute();

      data = dataResult;
      total = countResult[0].count;
    } else if (filter.pegawai_id !== undefined) {
      // Only pegawai_id filter
      const dataResult = await db.select()
        .from(mutasiTable)
        .where(eq(mutasiTable.pegawai_id, filter.pegawai_id))
        .orderBy(desc(mutasiTable.created_at))
        .limit(filter.limit || 100)
        .offset(filter.offset || 0)
        .execute();

      const countResult = await db.select({ count: count() })
        .from(mutasiTable)
        .where(eq(mutasiTable.pegawai_id, filter.pegawai_id))
        .execute();

      data = dataResult;
      total = countResult[0].count;
    } else if (filter.status) {
      // Only status filter
      const dataResult = await db.select()
        .from(mutasiTable)
        .where(eq(mutasiTable.status, filter.status))
        .orderBy(desc(mutasiTable.created_at))
        .limit(filter.limit || 100)
        .offset(filter.offset || 0)
        .execute();

      const countResult = await db.select({ count: count() })
        .from(mutasiTable)
        .where(eq(mutasiTable.status, filter.status))
        .execute();

      data = dataResult;
      total = countResult[0].count;
    } else {
      // No filters
      const dataResult = await db.select()
        .from(mutasiTable)
        .orderBy(desc(mutasiTable.created_at))
        .limit(filter.limit || 100)
        .offset(filter.offset || 0)
        .execute();

      const countResult = await db.select({ count: count() })
        .from(mutasiTable)
        .execute();

      data = dataResult;
      total = countResult[0].count;
    }

    return { data, total };
  } catch (error) {
    console.error('Get mutation list failed:', error);
    throw error;
  }
}
