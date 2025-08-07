
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mutasiTable, pegawaiTable, riwayatJabatanTable, posisiTersediaTable } from '../db/schema';
import { type CreateMutasiInput, type UpdateMutasiStatusInput, type MutasiFilter } from '../schema';
import { createMutasi, getMutasiList, updateMutasiStatus, getMutasiById, deleteMutasi } from '../handlers/mutasi';
import { eq, and } from 'drizzle-orm';

const testPegawai = {
  nama_lengkap: 'Test Employee',
  nomor_hp: '081234567890',
  npwp: '123456789012345',
  pendidikan_terakhir: 'S1' as const,
  golongan_darah: 'A' as const,
  provinsi_id: '32',
  provinsi_nama: 'Jawa Barat',
  kota_id: '3273',
  kota_nama: 'Bandung',
  kecamatan_id: '327301',
  kecamatan_nama: 'Coblong',
  desa_id: '32730101',
  desa_nama: 'Cipaganti'
};

const testMutasiInput: CreateMutasiInput = {
  pegawai_id: 0, // Will be set after creating pegawai
  satuan_kerja_asal: 'Dinas Pendidikan',
  unit_kerja_asal: 'Sekretariat',
  jabatan_asal: 'Staff Administrasi',
  satuan_kerja_tujuan: 'Dinas Kesehatan',
  unit_kerja_tujuan: 'Bidang Pelayanan',
  jabatan_tujuan: 'Staff Medis',
  alasan: 'Ingin berkarir di bidang kesehatan'
};

describe('Mutasi Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createMutasi', () => {
    it('should create a mutation request', async () => {
      // Create pegawai first
      const pegawaiResult = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();
      
      const input = { ...testMutasiInput, pegawai_id: pegawaiResult[0].id };
      const result = await createMutasi(input);

      expect(result.pegawai_id).toBe(pegawaiResult[0].id);
      expect(result.satuan_kerja_asal).toBe('Dinas Pendidikan');
      expect(result.satuan_kerja_tujuan).toBe('Dinas Kesehatan');
      expect(result.status).toBe('pending');
      expect(result.tanggal_pengajuan).toBeInstanceOf(Date);
      expect(result.tanggal_persetujuan).toBeNull();
      expect(result.catatan_admin).toBeNull();
    });

    it('should save mutation request to database', async () => {
      const pegawaiResult = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();
      
      const input = { ...testMutasiInput, pegawai_id: pegawaiResult[0].id };
      const result = await createMutasi(input);

      const savedMutasi = await db.select()
        .from(mutasiTable)
        .where(eq(mutasiTable.id, result.id))
        .execute();

      expect(savedMutasi).toHaveLength(1);
      expect(savedMutasi[0].alasan).toBe(input.alasan);
      expect(savedMutasi[0].status).toBe('pending');
    });

    it('should throw error when pegawai does not exist', async () => {
      const input = { ...testMutasiInput, pegawai_id: 999 };
      
      await expect(createMutasi(input)).rejects.toThrow(/pegawai not found/i);
    });
  });

  describe('getMutasiList', () => {
    it('should return paginated mutation list', async () => {
      const pegawaiResult = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();
      
      // Create multiple mutations
      await db.insert(mutasiTable)
        .values([
          { ...testMutasiInput, pegawai_id: pegawaiResult[0].id },
          { ...testMutasiInput, pegawai_id: pegawaiResult[0].id, status: 'approved' }
        ])
        .execute();

      const filter: MutasiFilter = {
        limit: 10,
        offset: 0
      };

      const result = await getMutasiList(filter);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0].pegawai_id).toBe(pegawaiResult[0].id);
    });

    it('should filter by pegawai_id', async () => {
      const pegawai1 = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();
      
      const pegawai2 = await db.insert(pegawaiTable)
        .values({ ...testPegawai, nama_lengkap: 'Another Employee', npwp: '987654321098765' })
        .returning()
        .execute();

      await db.insert(mutasiTable)
        .values([
          { ...testMutasiInput, pegawai_id: pegawai1[0].id },
          { ...testMutasiInput, pegawai_id: pegawai2[0].id }
        ])
        .execute();

      const filter: MutasiFilter = {
        pegawai_id: pegawai1[0].id,
        limit: 10,
        offset: 0
      };

      const result = await getMutasiList(filter);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].pegawai_id).toBe(pegawai1[0].id);
    });

    it('should filter by status', async () => {
      const pegawaiResult = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();

      await db.insert(mutasiTable)
        .values([
          { ...testMutasiInput, pegawai_id: pegawaiResult[0].id, status: 'pending' },
          { ...testMutasiInput, pegawai_id: pegawaiResult[0].id, status: 'approved' }
        ])
        .execute();

      const filter: MutasiFilter = {
        status: 'approved',
        limit: 10,
        offset: 0
      };

      const result = await getMutasiList(filter);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].status).toBe('approved');
    });
  });

  describe('updateMutasiStatus', () => {
    it('should update mutation status to approved', async () => {
      const pegawaiResult = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();
      
      const mutasiResult = await db.insert(mutasiTable)
        .values({ ...testMutasiInput, pegawai_id: pegawaiResult[0].id })
        .returning()
        .execute();

      const input: UpdateMutasiStatusInput = {
        id: mutasiResult[0].id,
        status: 'approved',
        catatan_admin: 'Permutasi disetujui'
      };

      const result = await updateMutasiStatus(input);

      expect(result.status).toBe('approved');
      expect(result.catatan_admin).toBe('Permutasi disetujui');
      expect(result.tanggal_persetujuan).toBeInstanceOf(Date);
    });

    it('should create job history when mutation is approved', async () => {
      const pegawaiResult = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();
      
      const mutasiResult = await db.insert(mutasiTable)
        .values({ ...testMutasiInput, pegawai_id: pegawaiResult[0].id })
        .returning()
        .execute();

      const input: UpdateMutasiStatusInput = {
        id: mutasiResult[0].id,
        status: 'approved'
      };

      await updateMutasiStatus(input);

      const jobHistory = await db.select()
        .from(riwayatJabatanTable)
        .where(eq(riwayatJabatanTable.pegawai_id, pegawaiResult[0].id))
        .execute();

      expect(jobHistory).toHaveLength(1);
      expect(jobHistory[0].satuan_kerja).toBe('Dinas Kesehatan');
      expect(jobHistory[0].jabatan_utama).toBe('Staff Medis');
    });

    it('should update available position quota when approved', async () => {
      const pegawaiResult = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();

      // Create available position
      const posisiResult = await db.insert(posisiTersediaTable)
        .values({
          satuan_kerja: 'Dinas Kesehatan',
          unit_kerja: 'Bidang Pelayanan',
          jabatan: 'Staff Medis',
          kuota_tersedia: 5,
          persyaratan: 'Minimal S1 Kesehatan'
        })
        .returning()
        .execute();

      const mutasiResult = await db.insert(mutasiTable)
        .values({ ...testMutasiInput, pegawai_id: pegawaiResult[0].id })
        .returning()
        .execute();

      const input: UpdateMutasiStatusInput = {
        id: mutasiResult[0].id,
        status: 'approved'
      };

      await updateMutasiStatus(input);

      const updatedPosition = await db.select()
        .from(posisiTersediaTable)
        .where(eq(posisiTersediaTable.id, posisiResult[0].id))
        .execute();

      expect(updatedPosition[0].kuota_tersedia).toBe(4);
    });

    it('should reject mutation request', async () => {
      const pegawaiResult = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();
      
      const mutasiResult = await db.insert(mutasiTable)
        .values({ ...testMutasiInput, pegawai_id: pegawaiResult[0].id })
        .returning()
        .execute();

      const input: UpdateMutasiStatusInput = {
        id: mutasiResult[0].id,
        status: 'rejected',
        catatan_admin: 'Tidak memenuhi persyaratan'
      };

      const result = await updateMutasiStatus(input);

      expect(result.status).toBe('rejected');
      expect(result.catatan_admin).toBe('Tidak memenuhi persyaratan');
      expect(result.tanggal_persetujuan).toBeInstanceOf(Date);
    });

    it('should throw error when mutation not found', async () => {
      const input: UpdateMutasiStatusInput = {
        id: 999,
        status: 'approved'
      };

      await expect(updateMutasiStatus(input)).rejects.toThrow(/mutation request not found/i);
    });
  });

  describe('getMutasiById', () => {
    it('should return mutation by ID', async () => {
      const pegawaiResult = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();
      
      const mutasiResult = await db.insert(mutasiTable)
        .values({ ...testMutasiInput, pegawai_id: pegawaiResult[0].id })
        .returning()
        .execute();

      const result = await getMutasiById(mutasiResult[0].id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(mutasiResult[0].id);
      expect(result!.pegawai_id).toBe(pegawaiResult[0].id);
    });

    it('should return null when mutation not found', async () => {
      const result = await getMutasiById(999);
      expect(result).toBeNull();
    });
  });

  describe('deleteMutasi', () => {
    it('should delete pending mutation request', async () => {
      const pegawaiResult = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();
      
      const mutasiResult = await db.insert(mutasiTable)
        .values({ ...testMutasiInput, pegawai_id: pegawaiResult[0].id })
        .returning()
        .execute();

      const result = await deleteMutasi(mutasiResult[0].id);

      expect(result.success).toBe(true);

      const deletedMutasi = await db.select()
        .from(mutasiTable)
        .where(eq(mutasiTable.id, mutasiResult[0].id))
        .execute();

      expect(deletedMutasi).toHaveLength(0);
    });

    it('should throw error when trying to delete non-pending mutation', async () => {
      const pegawaiResult = await db.insert(pegawaiTable)
        .values(testPegawai)
        .returning()
        .execute();
      
      const mutasiResult = await db.insert(mutasiTable)
        .values({ ...testMutasiInput, pegawai_id: pegawaiResult[0].id, status: 'approved' })
        .returning()
        .execute();

      await expect(deleteMutasi(mutasiResult[0].id)).rejects.toThrow(/only pending mutation requests can be deleted/i);
    });

    it('should throw error when mutation not found', async () => {
      await expect(deleteMutasi(999)).rejects.toThrow(/mutation request not found/i);
    });
  });
});
