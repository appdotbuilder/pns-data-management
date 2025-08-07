
import { db } from '../db';
import { mutasiTable, pegawaiTable, riwayatJabatanTable, posisiTersediaTable } from '../db/schema';
import { type CreateMutasiInput, type UpdateMutasiStatusInput, type Mutasi, type MutasiFilter } from '../schema';
import { eq, and, desc, count, SQL } from 'drizzle-orm';

export async function createMutasi(input: CreateMutasiInput): Promise<Mutasi> {
  try {
    // Verify pegawai exists
    const pegawai = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, input.pegawai_id))
      .execute();

    if (pegawai.length === 0) {
      throw new Error('Pegawai not found');
    }

    // Insert mutation request
    const result = await db.insert(mutasiTable)
      .values({
        pegawai_id: input.pegawai_id,
        satuan_kerja_asal: input.satuan_kerja_asal,
        unit_kerja_asal: input.unit_kerja_asal,
        jabatan_asal: input.jabatan_asal,
        satuan_kerja_tujuan: input.satuan_kerja_tujuan,
        unit_kerja_tujuan: input.unit_kerja_tujuan,
        jabatan_tujuan: input.jabatan_tujuan,
        alasan: input.alasan
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Mutation creation failed:', error);
    throw error;
  }
}

export async function getMutasiList(filter: MutasiFilter): Promise<{ data: Mutasi[]; total: number }> {
  try {
    // Build conditions
    const conditions: SQL<unknown>[] = [];

    if (filter.pegawai_id !== undefined) {
      conditions.push(eq(mutasiTable.pegawai_id, filter.pegawai_id));
    }

    if (filter.status) {
      conditions.push(eq(mutasiTable.status, filter.status));
    }

    // Build where clause
    const whereClause = conditions.length === 0 ? undefined :
      conditions.length === 1 ? conditions[0] : and(...conditions);

    // Execute data query
    const dataQuery = db.select()
      .from(mutasiTable)
      .orderBy(desc(mutasiTable.tanggal_pengajuan))
      .limit(filter.limit)
      .offset(filter.offset);

    const data = whereClause ? 
      await dataQuery.where(whereClause).execute() :
      await dataQuery.execute();

    // Execute count query
    const countQuery = db.select({ count: count() }).from(mutasiTable);
    const totalResult = whereClause ?
      await countQuery.where(whereClause).execute() :
      await countQuery.execute();

    return {
      data,
      total: totalResult[0].count
    };
  } catch (error) {
    console.error('Failed to get mutation list:', error);
    throw error;
  }
}

export async function updateMutasiStatus(input: UpdateMutasiStatusInput): Promise<Mutasi> {
  try {
    // Get current mutation request
    const currentMutasi = await db.select()
      .from(mutasiTable)
      .where(eq(mutasiTable.id, input.id))
      .execute();

    if (currentMutasi.length === 0) {
      throw new Error('Mutation request not found');
    }

    const mutation = currentMutasi[0];

    // Update mutation status
    const updateData: any = {
      status: input.status,
      updated_at: new Date()
    };

    if (input.status !== 'pending') {
      updateData.tanggal_persetujuan = new Date();
    }

    if (input.catatan_admin !== undefined) {
      updateData.catatan_admin = input.catatan_admin;
    }

    // If approved, create new job history record and update available position quota
    if (input.status === 'approved') {
      // Create new job history record
      await db.insert(riwayatJabatanTable)
        .values({
          pegawai_id: mutation.pegawai_id,
          satuan_kerja: mutation.satuan_kerja_tujuan,
          unit_kerja: mutation.unit_kerja_tujuan,
          jabatan_utama: mutation.jabatan_tujuan,
          jabatan_tambahan: null,
          tmt_jabatan: new Date(),
          tmt_jabatan_tambahan: null
        })
        .execute();

      // Find and update available position quota
      const availablePositions = await db.select()
        .from(posisiTersediaTable)
        .where(and(
          eq(posisiTersediaTable.satuan_kerja, mutation.satuan_kerja_tujuan),
          eq(posisiTersediaTable.unit_kerja, mutation.unit_kerja_tujuan),
          eq(posisiTersediaTable.jabatan, mutation.jabatan_tujuan),
          eq(posisiTersediaTable.is_active, true)
        ))
        .execute();

      if (availablePositions.length > 0) {
        const position = availablePositions[0];
        if (position.kuota_tersedia > 0) {
          await db.update(posisiTersediaTable)
            .set({
              kuota_tersedia: position.kuota_tersedia - 1,
              updated_at: new Date()
            })
            .where(eq(posisiTersediaTable.id, position.id))
            .execute();
        }
      }
    }

    // Update the mutation record
    const result = await db.update(mutasiTable)
      .set(updateData)
      .where(eq(mutasiTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Failed to update mutation status:', error);
    throw error;
  }
}

export async function getMutasiById(id: number): Promise<Mutasi | null> {
  try {
    const result = await db.select()
      .from(mutasiTable)
      .where(eq(mutasiTable.id, id))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to get mutation by ID:', error);
    throw error;
  }
}

export async function deleteMutasi(id: number): Promise<{ success: boolean }> {
  try {
    // Check if mutation exists and is pending
    const mutation = await db.select()
      .from(mutasiTable)
      .where(eq(mutasiTable.id, id))
      .execute();

    if (mutation.length === 0) {
      throw new Error('Mutation request not found');
    }

    if (mutation[0].status !== 'pending') {
      throw new Error('Only pending mutation requests can be deleted');
    }

    // Delete the mutation
    await db.delete(mutasiTable)
      .where(eq(mutasiTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Failed to delete mutation:', error);
    throw error;
  }
}
