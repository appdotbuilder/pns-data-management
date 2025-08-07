
import { db } from '../db';
import { posisiTersediaTable } from '../db/schema';
import { type CreatePosisiTersediaInput, type PosisiTersedia } from '../schema';
import { eq, and, gt } from 'drizzle-orm';

export async function createPosisiTersedia(input: CreatePosisiTersediaInput): Promise<PosisiTersedia> {
  try {
    const result = await db.insert(posisiTersediaTable)
      .values({
        satuan_kerja: input.satuan_kerja,
        unit_kerja: input.unit_kerja,
        jabatan: input.jabatan,
        kuota_tersedia: input.kuota_tersedia,
        persyaratan: input.persyaratan,
        is_active: true
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
      .where(
        and(
          eq(posisiTersediaTable.is_active, true),
          gt(posisiTersediaTable.kuota_tersedia, 0)
        )
      )
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
    
    if (input.satuan_kerja !== undefined) updateData.satuan_kerja = input.satuan_kerja;
    if (input.unit_kerja !== undefined) updateData.unit_kerja = input.unit_kerja;
    if (input.jabatan !== undefined) updateData.jabatan = input.jabatan;
    if (input.kuota_tersedia !== undefined) updateData.kuota_tersedia = input.kuota_tersedia;
    if (input.persyaratan !== undefined) updateData.persyaratan = input.persyaratan;
    
    updateData.updated_at = new Date();

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
      .set({ 
        is_active: false,
        updated_at: new Date()
      })
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

export async function reduceKuotaPosisi(id: number): Promise<{ success: boolean }> {
  try {
    // First get current quota
    const current = await db.select()
      .from(posisiTersediaTable)
      .where(eq(posisiTersediaTable.id, id))
      .execute();

    if (current.length === 0) {
      throw new Error(`Posisi tersedia with id ${id} not found`);
    }

    const currentQuota = current[0].kuota_tersedia;
    
    if (currentQuota <= 0) {
      throw new Error('Cannot reduce quota: quota is already zero or negative');
    }

    // Reduce quota by 1
    const result = await db.update(posisiTersediaTable)
      .set({ 
        kuota_tersedia: currentQuota - 1,
        updated_at: new Date()
      })
      .where(eq(posisiTersediaTable.id, id))
      .returning()
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Failed to reduce kuota posisi:', error);
    throw error;
  }
}
