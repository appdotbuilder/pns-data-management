
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pegawaiTable, riwayatJabatanTable } from '../db/schema';
import { type CreateRiwayatJabatanInput, type UpdateRiwayatJabatanInput } from '../schema';
import { 
  createRiwayatJabatan, 
  getRiwayatJabatanByPegawai,
  updateRiwayatJabatan,
  deleteRiwayatJabatan,
  getCurrentJabatan
} from '../handlers/riwayat_jabatan';
import { eq } from 'drizzle-orm';

// Test pegawai data
const testPegawai = {
  nama_lengkap: 'John Doe',
  nomor_hp: '081234567890',
  npwp: '123456789012345',
  pendidikan_terakhir: 'S1' as const,
  golongan_darah: 'A' as const,
  provinsi_id: '32',
  provinsi_nama: 'Jawa Barat',
  kota_id: '3201',
  kota_nama: 'Bogor',
  kecamatan_id: '320101',
  kecamatan_nama: 'Bogor Tengah',
  desa_id: '32010101',
  desa_nama: 'Pabaton'
};

// Test riwayat jabatan inputs
const testRiwayatJabatan: CreateRiwayatJabatanInput = {
  pegawai_id: 1, // Will be set dynamically
  satuan_kerja: 'Kementerian Dalam Negeri',
  unit_kerja: 'Sekretariat Jenderal',
  jabatan_utama: 'Kepala Bagian',
  jabatan_tambahan: 'Koordinator Tim',
  tmt_jabatan: new Date('2023-01-01'),
  tmt_jabatan_tambahan: new Date('2023-06-01')
};

const testRiwayatJabatan2: CreateRiwayatJabatanInput = {
  pegawai_id: 1, // Will be set dynamically
  satuan_kerja: 'Kementerian Dalam Negeri',
  unit_kerja: 'Direktorat Jenderal Politik',
  jabatan_utama: 'Direktur',
  jabatan_tambahan: null,
  tmt_jabatan: new Date('2024-01-01'),
  tmt_jabatan_tambahan: null
};

describe('riwayat jabatan handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let pegawaiId: number;

  beforeEach(async () => {
    // Create test pegawai
    const pegawaiResult = await db.insert(pegawaiTable)
      .values(testPegawai)
      .returning()
      .execute();
    
    pegawaiId = pegawaiResult[0].id;
    testRiwayatJabatan.pegawai_id = pegawaiId;
    testRiwayatJabatan2.pegawai_id = pegawaiId;
  });

  describe('createRiwayatJabatan', () => {
    it('should create riwayat jabatan successfully', async () => {
      const result = await createRiwayatJabatan(testRiwayatJabatan);

      expect(result.pegawai_id).toEqual(pegawaiId);
      expect(result.satuan_kerja).toEqual('Kementerian Dalam Negeri');
      expect(result.unit_kerja).toEqual('Sekretariat Jenderal');
      expect(result.jabatan_utama).toEqual('Kepala Bagian');
      expect(result.jabatan_tambahan).toEqual('Koordinator Tim');
      expect(result.tmt_jabatan).toEqual(new Date('2023-01-01'));
      expect(result.tmt_jabatan_tambahan).toEqual(new Date('2023-06-01'));
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create riwayat jabatan with null jabatan_tambahan', async () => {
      const inputWithoutJabatanTambahan = {
        ...testRiwayatJabatan,
        jabatan_tambahan: null,
        tmt_jabatan_tambahan: null
      };

      const result = await createRiwayatJabatan(inputWithoutJabatanTambahan);

      expect(result.jabatan_tambahan).toBeNull();
      expect(result.tmt_jabatan_tambahan).toBeNull();
      expect(result.jabatan_utama).toEqual('Kepala Bagian');
    });

    it('should save riwayat jabatan to database', async () => {
      const result = await createRiwayatJabatan(testRiwayatJabatan);

      const saved = await db.select()
        .from(riwayatJabatanTable)
        .where(eq(riwayatJabatanTable.id, result.id))
        .execute();

      expect(saved).toHaveLength(1);
      expect(saved[0].pegawai_id).toEqual(pegawaiId);
      expect(saved[0].satuan_kerja).toEqual('Kementerian Dalam Negeri');
      expect(saved[0].jabatan_utama).toEqual('Kepala Bagian');
    });

    it('should throw error for non-existent pegawai', async () => {
      const invalidInput = {
        ...testRiwayatJabatan,
        pegawai_id: 99999
      };

      await expect(createRiwayatJabatan(invalidInput))
        .rejects.toThrow(/Pegawai with ID 99999 not found/i);
    });
  });

  describe('getRiwayatJabatanByPegawai', () => {
    it('should return empty array for pegawai with no job history', async () => {
      const result = await getRiwayatJabatanByPegawai(pegawaiId);
      expect(result).toHaveLength(0);
    });

    it('should return job history ordered by most recent first', async () => {
      // Create multiple job history records
      await createRiwayatJabatan(testRiwayatJabatan); // 2023
      await createRiwayatJabatan(testRiwayatJabatan2); // 2024

      const result = await getRiwayatJabatanByPegawai(pegawaiId);

      expect(result).toHaveLength(2);
      // Should be ordered by tmt_jabatan descending (most recent first)
      expect(result[0].tmt_jabatan.getFullYear()).toEqual(2024);
      expect(result[1].tmt_jabatan.getFullYear()).toEqual(2023);
      expect(result[0].jabatan_utama).toEqual('Direktur');
      expect(result[1].jabatan_utama).toEqual('Kepala Bagian');
    });

    it('should return only records for specified pegawai', async () => {
      // Create another pegawai
      const pegawai2Result = await db.insert(pegawaiTable)
        .values({
          ...testPegawai,
          nama_lengkap: 'Jane Doe',
          nomor_hp: '081987654321',
          npwp: '987654321098765'
        })
        .returning()
        .execute();
      
      const pegawai2Id = pegawai2Result[0].id;

      // Create job history for both pegawai
      await createRiwayatJabatan(testRiwayatJabatan);
      await createRiwayatJabatan({
        ...testRiwayatJabatan2,
        pegawai_id: pegawai2Id
      });

      const result = await getRiwayatJabatanByPegawai(pegawaiId);

      expect(result).toHaveLength(1);
      expect(result[0].pegawai_id).toEqual(pegawaiId);
    });
  });

  describe('updateRiwayatJabatan', () => {
    let riwayatId: number;

    beforeEach(async () => {
      const created = await createRiwayatJabatan(testRiwayatJabatan);
      riwayatId = created.id;
    });

    it('should update riwayat jabatan successfully', async () => {
      const updateInput: UpdateRiwayatJabatanInput = {
        id: riwayatId,
        satuan_kerja: 'Updated Satuan Kerja',
        jabatan_utama: 'Updated Jabatan'
      };

      const result = await updateRiwayatJabatan(updateInput);

      expect(result.id).toEqual(riwayatId);
      expect(result.satuan_kerja).toEqual('Updated Satuan Kerja');
      expect(result.jabatan_utama).toEqual('Updated Jabatan');
      expect(result.unit_kerja).toEqual('Sekretariat Jenderal'); // Unchanged
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should update only provided fields', async () => {
      const updateInput: UpdateRiwayatJabatanInput = {
        id: riwayatId,
        jabatan_tambahan: 'New Additional Position'
      };

      const result = await updateRiwayatJabatan(updateInput);

      expect(result.jabatan_tambahan).toEqual('New Additional Position');
      expect(result.satuan_kerja).toEqual('Kementerian Dalam Negeri'); // Unchanged
      expect(result.jabatan_utama).toEqual('Kepala Bagian'); // Unchanged
    });

    it('should save changes to database', async () => {
      const updateInput: UpdateRiwayatJabatanInput = {
        id: riwayatId,
        unit_kerja: 'Updated Unit Kerja'
      };

      await updateRiwayatJabatan(updateInput);

      const saved = await db.select()
        .from(riwayatJabatanTable)
        .where(eq(riwayatJabatanTable.id, riwayatId))
        .execute();

      expect(saved[0].unit_kerja).toEqual('Updated Unit Kerja');
    });

    it('should throw error for non-existent record', async () => {
      const updateInput: UpdateRiwayatJabatanInput = {
        id: 99999,
        satuan_kerja: 'Updated'
      };

      await expect(updateRiwayatJabatan(updateInput))
        .rejects.toThrow(/Riwayat jabatan with ID 99999 not found/i);
    });
  });

  describe('deleteRiwayatJabatan', () => {
    let riwayatId: number;

    beforeEach(async () => {
      const created = await createRiwayatJabatan(testRiwayatJabatan);
      riwayatId = created.id;
    });

    it('should delete riwayat jabatan successfully', async () => {
      const result = await deleteRiwayatJabatan(riwayatId);
      expect(result.success).toBe(true);
    });

    it('should remove record from database', async () => {
      await deleteRiwayatJabatan(riwayatId);

      const deleted = await db.select()
        .from(riwayatJabatanTable)
        .where(eq(riwayatJabatanTable.id, riwayatId))
        .execute();

      expect(deleted).toHaveLength(0);
    });

    it('should throw error for non-existent record', async () => {
      await expect(deleteRiwayatJabatan(99999))
        .rejects.toThrow(/Riwayat jabatan with ID 99999 not found/i);
    });
  });

  describe('getCurrentJabatan', () => {
    it('should return null for pegawai with no job history', async () => {
      const result = await getCurrentJabatan(pegawaiId);
      expect(result).toBeNull();
    });

    it('should return most recent job position', async () => {
      // Create multiple job positions
      await createRiwayatJabatan(testRiwayatJabatan); // 2023
      await createRiwayatJabatan(testRiwayatJabatan2); // 2024 (most recent)

      const result = await getCurrentJabatan(pegawaiId);

      expect(result).not.toBeNull();
      expect(result!.tmt_jabatan.getFullYear()).toEqual(2024);
      expect(result!.jabatan_utama).toEqual('Direktur');
      expect(result!.unit_kerja).toEqual('Direktorat Jenderal Politik');
    });

    it('should return single job position when only one exists', async () => {
      await createRiwayatJabatan(testRiwayatJabatan);

      const result = await getCurrentJabatan(pegawaiId);

      expect(result).not.toBeNull();
      expect(result!.jabatan_utama).toEqual('Kepala Bagian');
      expect(result!.satuan_kerja).toEqual('Kementerian Dalam Negeri');
    });
  });
});
