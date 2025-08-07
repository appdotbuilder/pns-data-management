
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pegawaiTable, riwayatJabatanTable } from '../db/schema';
import { type CreateRiwayatJabatanInput } from '../schema';
import { createRiwayatJabatan, getRiwayatJabatanByPegawai, getCurrentJabatan } from '../handlers/riwayat_jabatan';
import { eq } from 'drizzle-orm';

describe('riwayatJabatan', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPegawaiId: number;

  beforeEach(async () => {
    // Create test pegawai first
    const pegawaiResult = await db.insert(pegawaiTable)
      .values({
        nip: '197001011990031001',
        nama: 'Test Pegawai',
        email: 'test@example.com',
        tanggal_lahir: new Date('1970-01-01'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS'
      })
      .returning()
      .execute();

    testPegawaiId = pegawaiResult[0].id;
  });

  describe('createRiwayatJabatan', () => {
    it('should create riwayat jabatan', async () => {
      const input: CreateRiwayatJabatanInput = {
        pegawai_id: testPegawaiId,
        jabatan: 'Kepala Bagian',
        unit_kerja: 'Bagian Umum',
        tmt_jabatan: new Date('2020-01-01'),
        tmt_berakhir: new Date('2023-01-01'),
        keterangan: 'Promosi jabatan'
      };

      const result = await createRiwayatJabatan(input);

      expect(result.pegawai_id).toEqual(testPegawaiId);
      expect(result.jabatan).toEqual('Kepala Bagian');
      expect(result.unit_kerja).toEqual('Bagian Umum');
      expect(result.tmt_jabatan).toEqual(new Date('2020-01-01'));
      expect(result.tmt_berakhir).toEqual(new Date('2023-01-01'));
      expect(result.keterangan).toEqual('Promosi jabatan');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save riwayat jabatan to database', async () => {
      const input: CreateRiwayatJabatanInput = {
        pegawai_id: testPegawaiId,
        jabatan: 'Staff',
        unit_kerja: 'Bagian Kepegawaian',
        tmt_jabatan: new Date('2018-01-01')
      };

      const result = await createRiwayatJabatan(input);

      const saved = await db.select()
        .from(riwayatJabatanTable)
        .where(eq(riwayatJabatanTable.id, result.id))
        .execute();

      expect(saved).toHaveLength(1);
      expect(saved[0].pegawai_id).toEqual(testPegawaiId);
      expect(saved[0].jabatan).toEqual('Staff');
      expect(saved[0].unit_kerja).toEqual('Bagian Kepegawaian');
      expect(saved[0].tmt_jabatan).toEqual(new Date('2018-01-01'));
      expect(saved[0].tmt_berakhir).toBeNull();
      expect(saved[0].keterangan).toBeNull();
    });

    it('should handle optional fields', async () => {
      const input: CreateRiwayatJabatanInput = {
        pegawai_id: testPegawaiId,
        jabatan: 'Koordinator',
        unit_kerja: 'Bagian Keuangan',
        tmt_jabatan: new Date('2019-06-01')
      };

      const result = await createRiwayatJabatan(input);

      expect(result.tmt_berakhir).toBeNull();
      expect(result.keterangan).toBeNull();
    });

    it('should throw error for non-existent pegawai', async () => {
      const input: CreateRiwayatJabatanInput = {
        pegawai_id: 9999,
        jabatan: 'Test Jabatan',
        unit_kerja: 'Test Unit',
        tmt_jabatan: new Date('2020-01-01')
      };

      await expect(createRiwayatJabatan(input)).rejects.toThrow(/pegawai.*not found/i);
    });
  });

  describe('getRiwayatJabatanByPegawai', () => {
    beforeEach(async () => {
      // Create multiple riwayat jabatan records with different dates
      await db.insert(riwayatJabatanTable)
        .values([
          {
            pegawai_id: testPegawaiId,
            jabatan: 'Staff',
            unit_kerja: 'Bagian A',
            tmt_jabatan: new Date('2018-01-01'),
            tmt_berakhir: new Date('2020-01-01')
          },
          {
            pegawai_id: testPegawaiId,
            jabatan: 'Kepala Seksi',
            unit_kerja: 'Bagian B',
            tmt_jabatan: new Date('2020-01-01'),
            tmt_berakhir: new Date('2022-01-01')
          },
          {
            pegawai_id: testPegawaiId,
            jabatan: 'Kepala Bagian',
            unit_kerja: 'Bagian C',
            tmt_jabatan: new Date('2022-01-01')
          }
        ])
        .execute();
    });

    it('should get all riwayat jabatan for pegawai', async () => {
      const results = await getRiwayatJabatanByPegawai(testPegawaiId);

      expect(results).toHaveLength(3);
      expect(results[0].jabatan).toEqual('Kepala Bagian'); // Most recent first
      expect(results[1].jabatan).toEqual('Kepala Seksi');
      expect(results[2].jabatan).toEqual('Staff'); // Oldest last
    });

    it('should order by TMT jabatan descending', async () => {
      const results = await getRiwayatJabatanByPegawai(testPegawaiId);

      expect(results[0].tmt_jabatan >= results[1].tmt_jabatan).toBe(true);
      expect(results[1].tmt_jabatan >= results[2].tmt_jabatan).toBe(true);
    });

    it('should return empty array for pegawai with no riwayat', async () => {
      // Create another pegawai without riwayat jabatan
      const anotherPegawai = await db.insert(pegawaiTable)
        .values({
          nip: '197002021990032002',
          nama: 'Another Pegawai',
          email: 'another@example.com',
          tanggal_lahir: new Date('1970-02-02'),
          jenis_kelamin: 'Perempuan',
          status_kepegawaian: 'PNS'
        })
        .returning()
        .execute();

      const results = await getRiwayatJabatanByPegawai(anotherPegawai[0].id);

      expect(results).toHaveLength(0);
    });

    it('should throw error for non-existent pegawai', async () => {
      await expect(getRiwayatJabatanByPegawai(9999)).rejects.toThrow(/pegawai.*not found/i);
    });
  });

  describe('getCurrentJabatan', () => {
    beforeEach(async () => {
      // Create riwayat jabatan records
      await db.insert(riwayatJabatanTable)
        .values([
          {
            pegawai_id: testPegawaiId,
            jabatan: 'Staff',
            unit_kerja: 'Bagian A',
            tmt_jabatan: new Date('2018-01-01'),
            tmt_berakhir: new Date('2020-01-01')
          },
          {
            pegawai_id: testPegawaiId,
            jabatan: 'Kepala Bagian',
            unit_kerja: 'Bagian B',
            tmt_jabatan: new Date('2020-01-01') // Most recent
          }
        ])
        .execute();
    });

    it('should get current jabatan (most recent)', async () => {
      const result = await getCurrentJabatan(testPegawaiId);

      expect(result).not.toBeNull();
      expect(result!.jabatan).toEqual('Kepala Bagian');
      expect(result!.unit_kerja).toEqual('Bagian B');
      expect(result!.tmt_jabatan).toEqual(new Date('2020-01-01'));
      expect(result!.tmt_berakhir).toBeNull();
    });

    it('should return null for pegawai with no riwayat', async () => {
      // Create another pegawai without riwayat jabatan
      const anotherPegawai = await db.insert(pegawaiTable)
        .values({
          nip: '197003031990033003',
          nama: 'No History Pegawai',
          email: 'nohistory@example.com',
          tanggal_lahir: new Date('1970-03-03'),
          jenis_kelamin: 'Laki-laki',
          status_kepegawaian: 'PNS'
        })
        .returning()
        .execute();

      const result = await getCurrentJabatan(anotherPegawai[0].id);

      expect(result).toBeNull();
    });

    it('should throw error for non-existent pegawai', async () => {
      await expect(getCurrentJabatan(9999)).rejects.toThrow(/pegawai.*not found/i);
    });
  });
});
