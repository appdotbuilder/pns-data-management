
import { db } from '../db';
import { posisiTersediaTable } from '../db/schema';
import { type CreatePosisiTersediaInput, type PosisiTersedia } from '../schema';
import { eq } from 'drizzle-orm';

export async function createPosisiTersedia(input: CreatePosisiTersediaInput): Promise<PosisiTersedia> {
  try {
    const result = await db.insert(posisiTersediaTable)
      .values({
        nama_posisi: input.nama_posisi,
        unit_kerja: input.unit_kerja,
        deskripsi: input.deskripsi ?? null,
        persyaratan: input.persyaratan ?? null,
        is_available: input.is_available
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Failed to create posisi tersedia:', error);
    throw error;
  }
}

export async function getPosisiTersediaList(): Promise<PosisiTersedia[]> {
  try {
    const results = await db.select()
      .from(posisiTersediaTable)
      .where(eq(posisiTersediaTable.is_available, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch posisi tersedia list:', error);
    throw error;
  }
}

export async function updatePosisiTersedia(id: number, input: Partial<CreatePosisiTersediaInput>): Promise<PosisiTersedia> {
  try {
    const updateData: any = {};
    
    if (input.nama_posisi !== undefined) {
      updateData.nama_posisi = input.nama_posisi;
    }
    if (input.unit_kerja !== undefined) {
      updateData.unit_kerja = input.unit_kerja;
    }
    if (input.deskripsi !== undefined) {
      updateData.deskripsi = input.deskripsi ?? null;
    }
    if (input.persyaratan !== undefined) {
      updateData.persyaratan = input.persyaratan ?? null;
    }
    if (input.is_available !== undefined) {
      updateData.is_available = input.is_available;
    }

    const result = await db.update(posisiTersediaTable)
      .set(updateData)
      .where(eq(posisiTersediaTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Posisi tersedia with id ${id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Failed to update posisi tersedia:', error);
    throw error;
  }
}

export async function deactivatePosisiTersedia(id: number): Promise<{ success: boolean }> {
  try {
    const result = await db.update(posisiTersediaTable)
      .set({ is_available: false })
      .where(eq(posisiTersediaTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Posisi tersedia with id ${id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to deactivate posisi tersedia:', error);
    throw error;
  }
}
