
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mutasiTable, pegawaiTable, usersTable, riwayatJabatanTable } from '../db/schema';
import { type CreateMutasiInput, type UpdateMutasiStatusInput } from '../schema';
import { createMutasi, updateMutasiStatus, getMutasiById, deleteMutasi, getMutasiList } from '../handlers/mutasi';
import { eq } from 'drizzle-orm';

// Test data
const testPegawai = {
  nip: 'P001',
  nama: 'Test Employee',
  email: 'test@example.com',
  tanggal_lahir: new Date('1990-01-01'),
  jenis_kelamin: 'Laki-laki',
  status_kepegawaian: 'PNS',
  jabatan_saat_ini: 'Staff',
  unit_kerja: 'Unit A',
  tmt_jabatan: new Date('2020-01-01'),
  is_active: true
};

const testUser = {
  username: 'testuser',
  email: 'user@example.com',
  password_hash: 'hashedpassword',
  role: 'admin' as const
};

const testMutasiInput: CreateMutasiInput = {
  pegawai_id: 1,
  jabatan_baru: 'Senior Staff',
  unit_kerja_baru: 'Unit B',
  tanggal_efektif: new Date('2024-01-01'),
  alasan_mutasi: 'Promosi jabatan',
  diajukan_oleh: 1
};

describe('Mutasi Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createMutasi', () => {
    it('should create a mutation request', async () => {
      // Create test pegawai and user
      const pegawai = await db.insert(pegawaiTable).values(testPegawai).returning().execute();
      const user = await db.insert(usersTable).values({
        ...testUser,
        pegawai_id: pegawai[0].id
      }).returning().execute();

      const input = {
        ...testMutasiInput,
        pegawai_id: pegawai[0].id,
        diajukan_oleh: user[0].id
      };

      const result = await createMutasi(input);

      expect(result.pegawai_id).toEqual(pegawai[0].id);
      expect(result.jabatan_baru).toEqual('Senior Staff');
      expect(result.unit_kerja_baru).toEqual('Unit B');
      expect(result.alasan_mutasi).toEqual('Promosi jabatan');
      expect(result.status).toEqual('pending');
      expect(result.diajukan_oleh).toEqual(user[0].id);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save mutation to database', async () => {
      // Create test pegawai and user
      const pegawai = await db.insert(pegawaiTable).values(testPegawai).returning().execute();
      const user = await db.insert(usersTable).values({
        ...testUser,
        pegawai_id: pegawai[0].id
      }).returning().execute();

      const input = {
        ...testMutasiInput,
        pegawai_id: pegawai[0].id,
        diajukan_oleh: user[0].id
      };

      const result = await createMutasi(input);

      const saved = await db.select()
        .from(mutasiTable)
        .where(eq(mutasiTable.id, result.id))
        .execute();

      expect(saved).toHaveLength(1);
      expect(saved[0].jabatan_baru).toEqual('Senior Staff');
      expect(saved[0].status).toEqual('pending');
    });

    it('should throw error for non-existent pegawai', async () => {
      await expect(createMutasi({
        ...testMutasiInput,
        pegawai_id: 999,
        diajukan_oleh: 1
      })).rejects.toThrow(/pegawai not found/i);
    });
  });

  describe('updateMutasiStatus', () => {
    it('should update mutation status to approved', async () => {
      // Create test data
      const pegawai = await db.insert(pegawaiTable).values(testPegawai).returning().execute();
      const user = await db.insert(usersTable).values({
        ...testUser,
        pegawai_id: pegawai[0].id
      }).returning().execute();

      const mutasi = await db.insert(mutasiTable).values({
        pegawai_id: pegawai[0].id,
        jabatan_baru: 'Senior Staff',
        unit_kerja_baru: 'Unit B',
        tanggal_efektif: new Date('2024-01-01'),
        alasan_mutasi: 'Promosi',
        diajukan_oleh: user[0].id,
        status: 'pending'
      }).returning().execute();

      const updateInput: UpdateMutasiStatusInput = {
        id: mutasi[0].id,
        status: 'approved',
        disetujui_oleh: user[0].id,
        catatan_persetujuan: 'Approved for promotion'
      };

      const result = await updateMutasiStatus(updateInput);

      expect(result.status).toEqual('approved');
      expect(result.disetujui_oleh).toEqual(user[0].id);
      expect(result.catatan_persetujuan).toEqual('Approved for promotion');
      expect(result.tanggal_disetujui).toBeInstanceOf(Date);
    });

    it('should update pegawai position when approved', async () => {
      // Create test data
      const pegawai = await db.insert(pegawaiTable).values(testPegawai).returning().execute();
      const user = await db.insert(usersTable).values({
        ...testUser,
        pegawai_id: pegawai[0].id
      }).returning().execute();

      const mutasi = await db.insert(mutasiTable).values({
        pegawai_id: pegawai[0].id,
        jabatan_baru: 'Senior Staff',
        unit_kerja_baru: 'Unit B',
        tanggal_efektif: new Date('2024-01-01'),
        alasan_mutasi: 'Promosi',
        diajukan_oleh: user[0].id,
        status: 'pending'
      }).returning().execute();

      await updateMutasiStatus({
        id: mutasi[0].id,
        status: 'approved',
        disetujui_oleh: user[0].id
      });

      // Check pegawai position updated
      const updatedPegawai = await db.select()
        .from(pegawaiTable)
        .where(eq(pegawaiTable.id, pegawai[0].id))
        .execute();

      expect(updatedPegawai[0].jabatan_saat_ini).toEqual('Senior Staff');
      expect(updatedPegawai[0].unit_kerja).toEqual('Unit B');
    });

    it('should create job history record when approved', async () => {
      // Create test data
      const pegawai = await db.insert(pegawaiTable).values(testPegawai).returning().execute();
      const user = await db.insert(usersTable).values({
        ...testUser,
        pegawai_id: pegawai[0].id
      }).returning().execute();

      const mutasi = await db.insert(mutasiTable).values({
        pegawai_id: pegawai[0].id,
        jabatan_baru: 'Senior Staff',
        unit_kerja_baru: 'Unit B',
        tanggal_efektif: new Date('2024-01-01'),
        alasan_mutasi: 'Promosi',
        diajukan_oleh: user[0].id,
        status: 'pending'
      }).returning().execute();

      await updateMutasiStatus({
        id: mutasi[0].id,
        status: 'approved',
        disetujui_oleh: user[0].id
      });

      // Check job history created
      const history = await db.select()
        .from(riwayatJabatanTable)
        .where(eq(riwayatJabatanTable.pegawai_id, pegawai[0].id))
        .execute();

      expect(history).toHaveLength(1);
      expect(history[0].jabatan).toEqual('Staff'); // Previous position
      expect(history[0].unit_kerja).toEqual('Unit A');
      expect(history[0].tmt_berakhir).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent mutation', async () => {
      await expect(updateMutasiStatus({
        id: 999,
        status: 'approved',
        disetujui_oleh: 1
      })).rejects.toThrow(/mutation request not found/i);
    });
  });

  describe('getMutasiById', () => {
    it('should return mutation by id', async () => {
      // Create test data
      const pegawai = await db.insert(pegawaiTable).values(testPegawai).returning().execute();
      const user = await db.insert(usersTable).values({
        ...testUser,
        pegawai_id: pegawai[0].id
      }).returning().execute();

      const mutasi = await db.insert(mutasiTable).values({
        pegawai_id: pegawai[0].id,
        jabatan_baru: 'Senior Staff',
        unit_kerja_baru: 'Unit B',
        tanggal_efektif: new Date('2024-01-01'),
        diajukan_oleh: user[0].id,
        status: 'pending'
      }).returning().execute();

      const result = await getMutasiById(mutasi[0].id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(mutasi[0].id);
      expect(result!.jabatan_baru).toEqual('Senior Staff');
    });

    it('should return null for non-existent mutation', async () => {
      const result = await getMutasiById(999);
      expect(result).toBeNull();
    });
  });

  describe('deleteMutasi', () => {
    it('should delete pending mutation request', async () => {
      // Create test data
      const pegawai = await db.insert(pegawaiTable).values(testPegawai).returning().execute();
      const user = await db.insert(usersTable).values({
        ...testUser,
        pegawai_id: pegawai[0].id
      }).returning().execute();

      const mutasi = await db.insert(mutasiTable).values({
        pegawai_id: pegawai[0].id,
        jabatan_baru: 'Senior Staff',
        unit_kerja_baru: 'Unit B',
        tanggal_efektif: new Date('2024-01-01'),
        diajukan_oleh: user[0].id,
        status: 'pending'
      }).returning().execute();

      const result = await deleteMutasi(mutasi[0].id);

      expect(result.success).toBe(true);

      // Verify deletion
      const deleted = await db.select()
        .from(mutasiTable)
        .where(eq(mutasiTable.id, mutasi[0].id))
        .execute();

      expect(deleted).toHaveLength(0);
    });

    it('should throw error for non-pending mutation', async () => {
      // Create test data
      const pegawai = await db.insert(pegawaiTable).values(testPegawai).returning().execute();
      const user = await db.insert(usersTable).values({
        ...testUser,
        pegawai_id: pegawai[0].id
      }).returning().execute();

      const mutasi = await db.insert(mutasiTable).values({
        pegawai_id: pegawai[0].id,
        jabatan_baru: 'Senior Staff',
        unit_kerja_baru: 'Unit B',
        tanggal_efektif: new Date('2024-01-01'),
        diajukan_oleh: user[0].id,
        status: 'approved'
      }).returning().execute();

      await expect(deleteMutasi(mutasi[0].id)).rejects.toThrow(/only pending requests can be deleted/i);
    });

    it('should throw error for non-existent mutation', async () => {
      await expect(deleteMutasi(999)).rejects.toThrow(/mutation request not found/i);
    });
  });

  describe('getMutasiList', () => {
    it('should return paginated mutation list', async () => {
      // Create test data
      const pegawai = await db.insert(pegawaiTable).values(testPegawai).returning().execute();
      const user = await db.insert(usersTable).values({
        ...testUser,
        pegawai_id: pegawai[0].id
      }).returning().execute();

      // Create multiple mutations
      await db.insert(mutasiTable).values([
        {
          pegawai_id: pegawai[0].id,
          jabatan_baru: 'Senior Staff',
          unit_kerja_baru: 'Unit B',
          tanggal_efektif: new Date('2024-01-01'),
          diajukan_oleh: user[0].id,
          status: 'pending'
        },
        {
          pegawai_id: pegawai[0].id,
          jabatan_baru: 'Manager',
          unit_kerja_baru: 'Unit C',
          tanggal_efektif: new Date('2024-02-01'),
          diajukan_oleh: user[0].id,
          status: 'approved'
        }
      ]).execute();

      const result = await getMutasiList({ limit: 10, offset: 0 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toEqual(2);
      expect(result.data[0].created_at >= result.data[1].created_at).toBe(true); // Ordered by created_at desc
    });

    it('should filter by pegawai_id', async () => {
      // Create test data
      const pegawai1 = await db.insert(pegawaiTable).values(testPegawai).returning().execute();
      const pegawai2 = await db.insert(pegawaiTable).values({
        ...testPegawai,
        nip: 'P002',
        email: 'test2@example.com'
      }).returning().execute();
      const user = await db.insert(usersTable).values(testUser).returning().execute();

      await db.insert(mutasiTable).values([
        {
          pegawai_id: pegawai1[0].id,
          jabatan_baru: 'Senior Staff',
          unit_kerja_baru: 'Unit B',
          tanggal_efektif: new Date('2024-01-01'),
          diajukan_oleh: user[0].id,
          status: 'pending'
        },
        {
          pegawai_id: pegawai2[0].id,
          jabatan_baru: 'Manager',
          unit_kerja_baru: 'Unit C',
          tanggal_efektif: new Date('2024-02-01'),
          diajukan_oleh: user[0].id,
          status: 'pending'
        }
      ]).execute();

      const result = await getMutasiList({ pegawai_id: pegawai1[0].id });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].pegawai_id).toEqual(pegawai1[0].id);
      expect(result.total).toEqual(1);
    });

    it('should filter by status', async () => {
      // Create test data
      const pegawai = await db.insert(pegawaiTable).values(testPegawai).returning().execute();
      const user = await db.insert(usersTable).values({
        ...testUser,
        pegawai_id: pegawai[0].id
      }).returning().execute();

      await db.insert(mutasiTable).values([
        {
          pegawai_id: pegawai[0].id,
          jabatan_baru: 'Senior Staff',
          unit_kerja_baru: 'Unit B',
          tanggal_efektif: new Date('2024-01-01'),
          diajukan_oleh: user[0].id,
          status: 'pending'
        },
        {
          pegawai_id: pegawai[0].id,
          jabatan_baru: 'Manager',
          unit_kerja_baru: 'Unit C',
          tanggal_efektif: new Date('2024-02-01'),
          diajukan_oleh: user[0].id,
          status: 'approved'
        }
      ]).execute();

      const result = await getMutasiList({ status: 'pending' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toEqual('pending');
      expect(result.total).toEqual(1);
    });
  });
});
