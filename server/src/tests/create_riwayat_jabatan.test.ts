
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pegawaiTable, riwayatJabatanTable } from '../db/schema';
import { type CreateRiwayatJabatanInput } from '../schema';
import { createRiwayatJabatan } from '../handlers/create_riwayat_jabatan';
import { eq } from 'drizzle-orm';

describe('createRiwayatJabatan', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestPegawai = async () => {
    const result = await db.insert(pegawaiTable)
      .values({
        nip: '123456789',
        nama: 'Test Pegawai',
        email: 'test@pegawai.com',
        tanggal_lahir: new Date('1985-01-01'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS',
        is_active: true
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should create riwayat jabatan', async () => {
    const pegawai = await createTestPegawai();

    const testInput: CreateRiwayatJabatanInput = {
      pegawai_id: pegawai.id,
      jabatan: 'Kepala Bagian IT',
      unit_kerja: 'Dinas Komunikasi dan Informatika',
      tmt_jabatan: new Date('2023-01-01'),
      tmt_berakhir: new Date('2024-12-31'),
      keterangan: 'Mutasi dari jabatan sebelumnya'
    };

    const result = await createRiwayatJabatan(testInput);

    expect(result.id).toBeDefined();
    expect(result.pegawai_id).toEqual(pegawai.id);
    expect(result.jabatan).toEqual('Kepala Bagian IT');
    expect(result.unit_kerja).toEqual('Dinas Komunikasi dan Informatika');
    expect(result.tmt_jabatan).toBeInstanceOf(Date);
    expect(result.tmt_berakhir).toBeInstanceOf(Date);
    expect(result.keterangan).toEqual('Mutasi dari jabatan sebelumnya');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save riwayat jabatan to database', async () => {
    const pegawai = await createTestPegawai();

    const testInput: CreateRiwayatJabatanInput = {
      pegawai_id: pegawai.id,
      jabatan: 'Staff IT',
      unit_kerja: 'Bagian Teknologi Informasi',
      tmt_jabatan: new Date('2022-03-15'),
      tmt_berakhir: null,
      keterangan: null
    };

    const result = await createRiwayatJabatan(testInput);

    const riwayatJabatan = await db.select()
      .from(riwayatJabatanTable)
      .where(eq(riwayatJabatanTable.id, result.id))
      .execute();

    expect(riwayatJabatan).toHaveLength(1);
    expect(riwayatJabatan[0].pegawai_id).toEqual(pegawai.id);
    expect(riwayatJabatan[0].jabatan).toEqual('Staff IT');
    expect(riwayatJabatan[0].unit_kerja).toEqual('Bagian Teknologi Informasi');
    expect(riwayatJabatan[0].tmt_berakhir).toBeNull();
    expect(riwayatJabatan[0].keterangan).toBeNull();
    expect(riwayatJabatan[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    const pegawai = await createTestPegawai();

    const testInput: CreateRiwayatJabatanInput = {
      pegawai_id: pegawai.id,
      jabatan: 'Analis Sistem',
      unit_kerja: 'Divisi Pengembangan Sistem',
      tmt_jabatan: new Date('2023-06-01')
    };

    const result = await createRiwayatJabatan(testInput);

    expect(result.tmt_berakhir).toBeNull();
    expect(result.keterangan).toBeNull();
  });

  it('should throw error when pegawai does not exist', async () => {
    const testInput: CreateRiwayatJabatanInput = {
      pegawai_id: 999999, // Non-existent pegawai ID
      jabatan: 'Test Jabatan',
      unit_kerja: 'Test Unit',
      tmt_jabatan: new Date('2023-01-01')
    };

    await expect(createRiwayatJabatan(testInput)).rejects.toThrow(/pegawai.*not found/i);
  });
});
