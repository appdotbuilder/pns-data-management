
import { z } from 'zod';

// User authentication schemas
export const userRoleEnum = z.enum(['admin', 'pegawai']);
export type UserRole = z.infer<typeof userRoleEnum>;

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  role: userRoleEnum,
  pegawai_id: z.number().nullable(), // null for admin, employee ID for pegawai
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type User = z.infer<typeof userSchema>;

export const loginInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const loginResponseSchema = z.object({
  user: userSchema.omit({ password: true }),
  token: z.string()
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// Employee (Pegawai) schemas
export const golonganDarahEnum = z.enum(['A', 'B', 'AB', 'O']);
export type GolonganDarah = z.infer<typeof golonganDarahEnum>;

export const pendidikanEnum = z.enum(['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2', 'S3']);
export type Pendidikan = z.infer<typeof pendidikanEnum>;

export const pegawaiSchema = z.object({
  id: z.number(),
  nama_lengkap: z.string(),
  nomor_hp: z.string(),
  npwp: z.string(),
  pendidikan_terakhir: pendidikanEnum,
  golongan_darah: golonganDarahEnum,
  provinsi_id: z.string(),
  provinsi_nama: z.string(),
  kota_id: z.string(),
  kota_nama: z.string(),
  kecamatan_id: z.string(),
  kecamatan_nama: z.string(),
  desa_id: z.string(),
  desa_nama: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Pegawai = z.infer<typeof pegawaiSchema>;

export const createPegawaiInputSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap is required'),
  nomor_hp: z.string().min(1, 'Nomor HP is required'),
  npwp: z.string().min(1, 'NPWP is required'),
  pendidikan_terakhir: pendidikanEnum,
  golongan_darah: golonganDarahEnum,
  provinsi_id: z.string(),
  provinsi_nama: z.string(),
  kota_id: z.string(),
  kota_nama: z.string(),
  kecamatan_id: z.string(),
  kecamatan_nama: z.string(),
  desa_id: z.string(),
  desa_nama: z.string()
});
export type CreatePegawaiInput = z.infer<typeof createPegawaiInputSchema>;

export const updatePegawaiInputSchema = z.object({
  id: z.number(),
  nama_lengkap: z.string().optional(),
  nomor_hp: z.string().optional(),
  npwp: z.string().optional(),
  pendidikan_terakhir: pendidikanEnum.optional(),
  golongan_darah: golonganDarahEnum.optional(),
  provinsi_id: z.string().optional(),
  provinsi_nama: z.string().optional(),
  kota_id: z.string().optional(),
  kota_nama: z.string().optional(),
  kecamatan_id: z.string().optional(),
  kecamatan_nama: z.string().optional(),
  desa_id: z.string().optional(),
  desa_nama: z.string().optional()
});
export type UpdatePegawaiInput = z.infer<typeof updatePegawaiInputSchema>;

// Job position history (Riwayat Jabatan) schemas
export const riwayatJabatanSchema = z.object({
  id: z.number(),
  pegawai_id: z.number(),
  satuan_kerja: z.string(),
  unit_kerja: z.string(),
  jabatan_utama: z.string(),
  jabatan_tambahan: z.string().nullable(),
  tmt_jabatan: z.coerce.date(),
  tmt_jabatan_tambahan: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type RiwayatJabatan = z.infer<typeof riwayatJabatanSchema>;

export const createRiwayatJabatanInputSchema = z.object({
  pegawai_id: z.number(),
  satuan_kerja: z.string().min(1, 'Satuan kerja is required'),
  unit_kerja: z.string().min(1, 'Unit kerja is required'),
  jabatan_utama: z.string().min(1, 'Jabatan utama is required'),
  jabatan_tambahan: z.string().nullable().optional(),
  tmt_jabatan: z.coerce.date(),
  tmt_jabatan_tambahan: z.coerce.date().nullable().optional()
});
export type CreateRiwayatJabatanInput = z.infer<typeof createRiwayatJabatanInputSchema>;

export const updateRiwayatJabatanInputSchema = z.object({
  id: z.number(),
  satuan_kerja: z.string().optional(),
  unit_kerja: z.string().optional(),
  jabatan_utama: z.string().optional(),
  jabatan_tambahan: z.string().nullable().optional(),
  tmt_jabatan: z.coerce.date().optional(),
  tmt_jabatan_tambahan: z.coerce.date().nullable().optional()
});
export type UpdateRiwayatJabatanInput = z.infer<typeof updateRiwayatJabatanInputSchema>;

// Mutation request schemas
export const statusMutasiEnum = z.enum(['pending', 'approved', 'rejected']);
export type StatusMutasi = z.infer<typeof statusMutasiEnum>;

export const mutasiSchema = z.object({
  id: z.number(),
  pegawai_id: z.number(),
  satuan_kerja_asal: z.string(),
  unit_kerja_asal: z.string(),
  jabatan_asal: z.string(),
  satuan_kerja_tujuan: z.string(),
  unit_kerja_tujuan: z.string(),
  jabatan_tujuan: z.string(),
  alasan: z.string(),
  status: statusMutasiEnum,
  tanggal_pengajuan: z.coerce.date(),
  tanggal_persetujuan: z.coerce.date().nullable(),
  catatan_admin: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Mutasi = z.infer<typeof mutasiSchema>;

export const createMutasiInputSchema = z.object({
  pegawai_id: z.number(),
  satuan_kerja_asal: z.string().min(1, 'Satuan kerja asal is required'),
  unit_kerja_asal: z.string().min(1, 'Unit kerja asal is required'),
  jabatan_asal: z.string().min(1, 'Jabatan asal is required'),
  satuan_kerja_tujuan: z.string().min(1, 'Satuan kerja tujuan is required'),
  unit_kerja_tujuan: z.string().min(1, 'Unit kerja tujuan is required'),
  jabatan_tujuan: z.string().min(1, 'Jabatan tujuan is required'),
  alasan: z.string().min(1, 'Alasan is required')
});
export type CreateMutasiInput = z.infer<typeof createMutasiInputSchema>;

export const updateMutasiStatusInputSchema = z.object({
  id: z.number(),
  status: statusMutasiEnum,
  catatan_admin: z.string().nullable().optional()
});
export type UpdateMutasiStatusInput = z.infer<typeof updateMutasiStatusInputSchema>;

// Available position schemas
export const posisiTersediaSchema = z.object({
  id: z.number(),
  satuan_kerja: z.string(),
  unit_kerja: z.string(),
  jabatan: z.string(),
  kuota_tersedia: z.number().int(),
  persyaratan: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type PosisiTersedia = z.infer<typeof posisiTersediaSchema>;

export const createPosisiTersediaInputSchema = z.object({
  satuan_kerja: z.string().min(1, 'Satuan kerja is required'),
  unit_kerja: z.string().min(1, 'Unit kerja is required'),
  jabatan: z.string().min(1, 'Jabatan is required'),
  kuota_tersedia: z.number().int().positive(),
  persyaratan: z.string().min(1, 'Persyaratan is required')
});
export type CreatePosisiTersediaInput = z.infer<typeof createPosisiTersediaInputSchema>;

// Query filter schemas
export const pegawaiFilterSchema = z.object({
  search: z.string().optional(),
  satuan_kerja: z.string().optional(),
  unit_kerja: z.string().optional(),
  jabatan: z.string().optional(),
  pendidikan: pendidikanEnum.optional(),
  mendekati_pensiun: z.boolean().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0)
});
export type PegawaiFilter = z.infer<typeof pegawaiFilterSchema>;

export const mutasiFilterSchema = z.object({
  pegawai_id: z.number().optional(),
  status: statusMutasiEnum.optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0)
});
export type MutasiFilter = z.infer<typeof mutasiFilterSchema>;

// Wilayah API response schemas (for integration with wilayah.id)
export const wilayahItemSchema = z.object({
  id: z.string(),
  name: z.string()
});
export type WilayahItem = z.infer<typeof wilayahItemSchema>;
