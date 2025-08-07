
import { db } from '../db';
import { pegawaiTable } from '../db/schema';
import { type CreatePegawaiInput, type Pegawai } from '../schema';

export const createPegawai = async (input: CreatePegawaiInput): Promise<Pegawai> => {
  try {
    // Insert pegawai record
    const result = await db.insert(pegawaiTable)
      .values({
        nip: input.nip,
        nama: input.nama,
        email: input.email,
        telepon: input.telepon || null,
        alamat: input.alamat || null,
        tanggal_lahir: input.tanggal_lahir,
        jenis_kelamin: input.jenis_kelamin,
        status_kepegawaian: input.status_kepegawaian,
        jabatan_saat_ini: input.jabatan_saat_ini || null,
        unit_kerja: input.unit_kerja || null,
        tmt_jabatan: input.tmt_jabatan || null,
        is_active: input.is_active
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Pegawai creation failed:', error);
    throw error;
  }
};
