
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'pegawai']);
export const golonganDarahEnum = pgEnum('golongan_darah', ['A', 'B', 'AB', 'O']);
export const pendidikanEnum = pgEnum('pendidikan', ['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2', 'S3']);
export const statusMutasiEnum = pgEnum('status_mutasi', ['pending', 'approved', 'rejected']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull(),
  pegawai_id: integer('pegawai_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Pegawai (Civil Servants) table
export const pegawaiTable = pgTable('pegawai', {
  id: serial('id').primaryKey(),
  nama_lengkap: text('nama_lengkap').notNull(),
  nomor_hp: text('nomor_hp').notNull(),
  npwp: text('npwp').notNull(),
  pendidikan_terakhir: pendidikanEnum('pendidikan_terakhir').notNull(),
  golongan_darah: golonganDarahEnum('golongan_darah').notNull(),
  provinsi_id: text('provinsi_id').notNull(),
  provinsi_nama: text('provinsi_nama').notNull(),
  kota_id: text('kota_id').notNull(),
  kota_nama: text('kota_nama').notNull(),
  kecamatan_id: text('kecamatan_id').notNull(),
  kecamatan_nama: text('kecamatan_nama').notNull(),
  desa_id: text('desa_id').notNull(),
  desa_nama: text('desa_nama').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Job position history table
export const riwayatJabatanTable = pgTable('riwayat_jabatan', {
  id: serial('id').primaryKey(),
  pegawai_id: integer('pegawai_id').notNull(),
  satuan_kerja: text('satuan_kerja').notNull(),
  unit_kerja: text('unit_kerja').notNull(),
  jabatan_utama: text('jabatan_utama').notNull(),
  jabatan_tambahan: text('jabatan_tambahan'),
  tmt_jabatan: timestamp('tmt_jabatan').notNull(),
  tmt_jabatan_tambahan: timestamp('tmt_jabatan_tambahan'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Mutation requests table
export const mutasiTable = pgTable('mutasi', {
  id: serial('id').primaryKey(),
  pegawai_id: integer('pegawai_id').notNull(),
  satuan_kerja_asal: text('satuan_kerja_asal').notNull(),
  unit_kerja_asal: text('unit_kerja_asal').notNull(),
  jabatan_asal: text('jabatan_asal').notNull(),
  satuan_kerja_tujuan: text('satuan_kerja_tujuan').notNull(),
  unit_kerja_tujuan: text('unit_kerja_tujuan').notNull(),
  jabatan_tujuan: text('jabatan_tujuan').notNull(),
  alasan: text('alasan').notNull(),
  status: statusMutasiEnum('status').notNull().default('pending'),
  tanggal_pengajuan: timestamp('tanggal_pengajuan').defaultNow().notNull(),
  tanggal_persetujuan: timestamp('tanggal_persetujuan'),
  catatan_admin: text('catatan_admin'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Available positions table
export const posisiTersediaTable = pgTable('posisi_tersedia', {
  id: serial('id').primaryKey(),
  satuan_kerja: text('satuan_kerja').notNull(),
  unit_kerja: text('unit_kerja').notNull(),
  jabatan: text('jabatan').notNull(),
  kuota_tersedia: integer('kuota_tersedia').notNull(),
  persyaratan: text('persyaratan').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ one }) => ({
  pegawai: one(pegawaiTable, {
    fields: [usersTable.pegawai_id],
    references: [pegawaiTable.id],
  }),
}));

export const pegawaiRelations = relations(pegawaiTable, ({ many, one }) => ({
  user: one(usersTable, {
    fields: [pegawaiTable.id],
    references: [usersTable.pegawai_id],
  }),
  riwayatJabatan: many(riwayatJabatanTable),
  mutasi: many(mutasiTable),
}));

export const riwayatJabatanRelations = relations(riwayatJabatanTable, ({ one }) => ({
  pegawai: one(pegawaiTable, {
    fields: [riwayatJabatanTable.pegawai_id],
    references: [pegawaiTable.id],
  }),
}));

export const mutasiRelations = relations(mutasiTable, ({ one }) => ({
  pegawai: one(pegawaiTable, {
    fields: [mutasiTable.pegawai_id],
    references: [pegawaiTable.id],
  }),
}));

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  pegawai: pegawaiTable,
  riwayatJabatan: riwayatJabatanTable,
  mutasi: mutasiTable,
  posisiTersedia: posisiTersediaTable,
};
