
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  integer, 
  varchar,
  pgEnum,
  boolean
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const statusMutasiEnum = pgEnum('status_mutasi', ['pending', 'approved', 'rejected']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  pegawai_id: integer('pegawai_id').references(() => pegawaiTable.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Pegawai table
export const pegawaiTable = pgTable('pegawai', {
  id: serial('id').primaryKey(),
  nip: varchar('nip', { length: 20 }).notNull().unique(),
  nama: varchar('nama', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull(),
  telepon: varchar('telepon', { length: 20 }),
  alamat: text('alamat'),
  tanggal_lahir: timestamp('tanggal_lahir').notNull(),
  jenis_kelamin: varchar('jenis_kelamin', { length: 10 }).notNull(),
  status_kepegawaian: varchar('status_kepegawaian', { length: 20 }).notNull(),
  jabatan_saat_ini: varchar('jabatan_saat_ini', { length: 100 }),
  unit_kerja: varchar('unit_kerja', { length: 100 }),
  tmt_jabatan: timestamp('tmt_jabatan'), // Terhitung Mulai Tanggal jabatan
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Riwayat Jabatan table
export const riwayatJabatanTable = pgTable('riwayat_jabatan', {
  id: serial('id').primaryKey(),
  pegawai_id: integer('pegawai_id').notNull().references(() => pegawaiTable.id, { onDelete: 'cascade' }),
  jabatan: varchar('jabatan', { length: 100 }).notNull(),
  unit_kerja: varchar('unit_kerja', { length: 100 }).notNull(),
  tmt_jabatan: timestamp('tmt_jabatan').notNull(), // Terhitung Mulai Tanggal
  tmt_berakhir: timestamp('tmt_berakhir'), // Nullable for current position
  keterangan: text('keterangan'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Mutasi table
export const mutasiTable = pgTable('mutasi', {
  id: serial('id').primaryKey(),
  pegawai_id: integer('pegawai_id').notNull().references(() => pegawaiTable.id, { onDelete: 'cascade' }),
  jabatan_baru: varchar('jabatan_baru', { length: 100 }).notNull(),
  unit_kerja_baru: varchar('unit_kerja_baru', { length: 100 }).notNull(),
  tanggal_efektif: timestamp('tanggal_efektif').notNull(),
  alasan_mutasi: text('alasan_mutasi'),
  status: statusMutasiEnum('status').notNull().default('pending'),
  diajukan_oleh: integer('diajukan_oleh').notNull(), // User ID who submitted
  disetujui_oleh: integer('disetujui_oleh'), // User ID who approved (nullable)
  tanggal_disetujui: timestamp('tanggal_disetujui'),
  catatan_persetujuan: text('catatan_persetujuan'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Posisi Tersedia table
export const posisiTersediaTable = pgTable('posisi_tersedia', {
  id: serial('id').primaryKey(),
  nama_posisi: varchar('nama_posisi', { length: 100 }).notNull(),
  unit_kerja: varchar('unit_kerja', { length: 100 }).notNull(),
  deskripsi: text('deskripsi'),
  persyaratan: text('persyaratan'),
  is_available: boolean('is_available').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
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

// TypeScript types for table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Pegawai = typeof pegawaiTable.$inferSelect;
export type NewPegawai = typeof pegawaiTable.$inferInsert;

export type RiwayatJabatan = typeof riwayatJabatanTable.$inferSelect;
export type NewRiwayatJabatan = typeof riwayatJabatanTable.$inferInsert;

export type Mutasi = typeof mutasiTable.$inferSelect;
export type NewMutasi = typeof mutasiTable.$inferInsert;

export type PosisiTersedia = typeof posisiTersediaTable.$inferSelect;
export type NewPosisiTersedia = typeof posisiTersediaTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  pegawai: pegawaiTable,
  riwayatJabatan: riwayatJabatanTable,
  mutasi: mutasiTable,
  posisiTersedia: posisiTersediaTable,
};
