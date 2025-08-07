
import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  password_hash: z.string(),
  role: z.enum(['admin', 'user']),
  pegawai_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string().min(1).max(50),
  email: z.string().email().max(100),
  password: z.string().min(6),
  role: z.enum(['admin', 'user']).default('user'),
  pegawai_id: z.number().nullable().optional(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Pegawai schemas
export const pegawaiSchema = z.object({
  id: z.number(),
  nip: z.string(),
  nama: z.string(),
  email: z.string(),
  telepon: z.string().nullable(),
  alamat: z.string().nullable(),
  tanggal_lahir: z.coerce.date(),
  jenis_kelamin: z.string(),
  status_kepegawaian: z.string(),
  jabatan_saat_ini: z.string().nullable(),
  unit_kerja: z.string().nullable(),
  tmt_jabatan: z.coerce.date().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Pegawai = z.infer<typeof pegawaiSchema>;

export const createPegawaiInputSchema = z.object({
  nip: z.string().min(1).max(20),
  nama: z.string().min(1).max(100),
  email: z.string().email().max(100),
  telepon: z.string().max(20).nullable().optional(),
  alamat: z.string().nullable().optional(),
  tanggal_lahir: z.coerce.date(),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']),
  status_kepegawaian: z.string().min(1).max(20),
  jabatan_saat_ini: z.string().max(100).nullable().optional(),
  unit_kerja: z.string().max(100).nullable().optional(),
  tmt_jabatan: z.coerce.date().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type CreatePegawaiInput = z.infer<typeof createPegawaiInputSchema>;

// Riwayat Jabatan schemas
export const riwayatJabatanSchema = z.object({
  id: z.number(),
  pegawai_id: z.number(),
  jabatan: z.string(),
  unit_kerja: z.string(),
  tmt_jabatan: z.coerce.date(),
  tmt_berakhir: z.coerce.date().nullable(),
  keterangan: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type RiwayatJabatan = z.infer<typeof riwayatJabatanSchema>;

export const createRiwayatJabatanInputSchema = z.object({
  pegawai_id: z.number(),
  jabatan: z.string().min(1).max(100),
  unit_kerja: z.string().min(1).max(100),
  tmt_jabatan: z.coerce.date(),
  tmt_berakhir: z.coerce.date().nullable().optional(),
  keterangan: z.string().nullable().optional(),
});

export type CreateRiwayatJabatanInput = z.infer<typeof createRiwayatJabatanInputSchema>;

// Mutasi schemas
export const mutasiSchema = z.object({
  id: z.number(),
  pegawai_id: z.number(),
  jabatan_baru: z.string(),
  unit_kerja_baru: z.string(),
  tanggal_efektif: z.coerce.date(),
  alasan_mutasi: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']),
  diajukan_oleh: z.number(),
  disetujui_oleh: z.number().nullable(),
  tanggal_disetujui: z.coerce.date().nullable(),
  catatan_persetujuan: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Mutasi = z.infer<typeof mutasiSchema>;

export const createMutasiInputSchema = z.object({
  pegawai_id: z.number(),
  jabatan_baru: z.string().min(1).max(100),
  unit_kerja_baru: z.string().min(1).max(100),
  tanggal_efektif: z.coerce.date(),
  alasan_mutasi: z.string().nullable().optional(),
  diajukan_oleh: z.number(),
});

export type CreateMutasiInput = z.infer<typeof createMutasiInputSchema>;

// Posisi Tersedia schemas
export const posisiTersediaSchema = z.object({
  id: z.number(),
  nama_posisi: z.string(),
  unit_kerja: z.string(),
  deskripsi: z.string().nullable(),
  persyaratan: z.string().nullable(),
  is_available: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type PosisiTersedia = z.infer<typeof posisiTersediaSchema>;

export const createPosisiTersediaInputSchema = z.object({
  nama_posisi: z.string().min(1).max(100),
  unit_kerja: z.string().min(1).max(100),
  deskripsi: z.string().nullable().optional(),
  persyaratan: z.string().nullable().optional(),
  is_available: z.boolean().default(true),
});

export type CreatePosisiTersediaInput = z.infer<typeof createPosisiTersediaInputSchema>;

// Query schemas
export const getPegawaiByIdInputSchema = z.object({
  id: z.number(),
});

export type GetPegawaiByIdInput = z.infer<typeof getPegawaiByIdInputSchema>;

export const updateMutasiStatusInputSchema = z.object({
  id: z.number(),
  status: z.enum(['pending', 'approved', 'rejected']),
  disetujui_oleh: z.number(),
  catatan_persetujuan: z.string().nullable().optional(),
});

export type UpdateMutasiStatusInput = z.infer<typeof updateMutasiStatusInputSchema>;
