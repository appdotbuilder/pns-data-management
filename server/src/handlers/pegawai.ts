
import { db } from '../db';
import { pegawaiTable } from '../db/schema';
import { type CreatePegawaiInput, type UpdatePegawaiInput, type Pegawai, type PegawaiFilter } from '../schema';
import { eq, and, or, like, SQL, count } from 'drizzle-orm';

export async function createPegawai(input: CreatePegawaiInput): Promise<Pegawai> {
  try {
    const result = await db.insert(pegawaiTable)
      .values({
        nama_lengkap: input.nama_lengkap,
        nomor_hp: input.nomor_hp,
        npwp: input.npwp,
        pendidikan_terakhir: input.pendidikan_terakhir,
        golongan_darah: input.golongan_darah,
        provinsi_id: input.provinsi_id,
        provinsi_nama: input.provinsi_nama,
        kota_id: input.kota_id,
        kota_nama: input.kota_nama,
        kecamatan_id: input.kecamatan_id,
        kecamatan_nama: input.kecamatan_nama,
        desa_id: input.desa_id,
        desa_nama: input.desa_nama
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Pegawai creation failed:', error);
    throw error;
  }
}

export async function getPegawaiList(filter: PegawaiFilter): Promise<{ data: Pegawai[]; total: number }> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Search filter - search in name, phone, and NPWP
    if (filter.search) {
      const searchPattern = `%${filter.search}%`;
      conditions.push(
        or(
          like(pegawaiTable.nama_lengkap, searchPattern),
          like(pegawaiTable.nomor_hp, searchPattern),
          like(pegawaiTable.npwp, searchPattern)
        )!
      );
    }

    // Education filter
    if (filter.pendidikan) {
      conditions.push(eq(pegawaiTable.pendidikan_terakhir, filter.pendidikan));
    }

    // Build where clause
    const whereClause = conditions.length === 0 ? undefined : 
      conditions.length === 1 ? conditions[0] : and(...conditions);

    // Build queries - separate query builders
    const baseQuery = db.select().from(pegawaiTable);
    const countBaseQuery = db.select({ count: count() }).from(pegawaiTable);

    // Execute queries with proper conditional where clauses
    const [data, totalResult] = await Promise.all([
      whereClause 
        ? baseQuery.where(whereClause).limit(filter.limit).offset(filter.offset).execute()
        : baseQuery.limit(filter.limit).offset(filter.offset).execute(),
      whereClause 
        ? countBaseQuery.where(whereClause).execute()
        : countBaseQuery.execute()
    ]);

    return {
      data,
      total: totalResult[0].count
    };
  } catch (error) {
    console.error('Get pegawai list failed:', error);
    throw error;
  }
}

export async function getPegawaiById(id: number): Promise<Pegawai | null> {
  try {
    const result = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, id))
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Get pegawai by ID failed:', error);
    throw error;
  }
}

export async function updatePegawai(input: UpdatePegawaiInput): Promise<Pegawai> {
  try {
    // Build update data object, only including provided fields
    const updateData: any = {};
    
    if (input.nama_lengkap !== undefined) updateData.nama_lengkap = input.nama_lengkap;
    if (input.nomor_hp !== undefined) updateData.nomor_hp = input.nomor_hp;
    if (input.npwp !== undefined) updateData.npwp = input.npwp;
    if (input.pendidikan_terakhir !== undefined) updateData.pendidikan_terakhir = input.pendidikan_terakhir;
    if (input.golongan_darah !== undefined) updateData.golongan_darah = input.golongan_darah;
    if (input.provinsi_id !== undefined) updateData.provinsi_id = input.provinsi_id;
    if (input.provinsi_nama !== undefined) updateData.provinsi_nama = input.provinsi_nama;
    if (input.kota_id !== undefined) updateData.kota_id = input.kota_id;
    if (input.kota_nama !== undefined) updateData.kota_nama = input.kota_nama;
    if (input.kecamatan_id !== undefined) updateData.kecamatan_id = input.kecamatan_id;
    if (input.kecamatan_nama !== undefined) updateData.kecamatan_nama = input.kecamatan_nama;
    if (input.desa_id !== undefined) updateData.desa_id = input.desa_id;
    if (input.desa_nama !== undefined) updateData.desa_nama = input.desa_nama;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    const result = await db.update(pegawaiTable)
      .set(updateData)
      .where(eq(pegawaiTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Pegawai not found');
    }

    return result[0];
  } catch (error) {
    console.error('Update pegawai failed:', error);
    throw error;
  }
}

export async function deletePegawai(id: number): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(pegawaiTable)
      .where(eq(pegawaiTable.id, id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Delete pegawai failed:', error);
    throw error;
  }
}

export async function getPegawaiMendekatiPensiun(): Promise<Pegawai[]> {
  try {
    // For this implementation, we'll return all pegawai since we don't have
    // birth date or TMT Jabatan in the pegawai table directly
    // In a real implementation, this would calculate based on age/service years
    const result = await db.select()
      .from(pegawaiTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Get pegawai mendekati pensiun failed:', error);
    throw error;
  }
}
