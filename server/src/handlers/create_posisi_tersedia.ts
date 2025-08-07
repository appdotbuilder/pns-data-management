
import { db } from '../db';
import { posisiTersediaTable } from '../db/schema';
import { type CreatePosisiTersediaInput, type PosisiTersedia } from '../schema';

export const createPosisiTersedia = async (input: CreatePosisiTersediaInput): Promise<PosisiTersedia> => {
  try {
    const result = await db.insert(posisiTersediaTable)
      .values({
        nama_posisi: input.nama_posisi,
        unit_kerja: input.unit_kerja,
        deskripsi: input.deskripsi || null,
        persyaratan: input.persyaratan || null,
        is_available: input.is_available
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Posisi tersedia creation failed:', error);
    throw error;
  }
};
