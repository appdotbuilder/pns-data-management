
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pegawaiTable, riwayatJabatanTable } from '../db/schema';
import { type GetPegawaiByIdInput, type CreatePegawaiInput, type CreateRiwayatJabatanInput } from '../schema';
import { getRiwayatJabatanByPegawai } from '../handlers/get_riwayat_jabatan_by_pegawai';

// Test data
const testPegawai: CreatePegawaiInput = {
  nip: '198001012005011001',
  nama: 'Test Pegawai',
  email: 'test@example.com',
  telepon: '08123456789',
  alamat: 'Jl. Test No. 1',
  tanggal_lahir: new Date('1980-01-01'),
  jenis_kelamin: 'Laki-laki',
  status_kepegawaian: 'PNS',
  jabatan_saat_ini: 'Kepala Bagian',
  unit_kerja: 'Bagian IT',
  tmt_jabatan: new Date('2020-01-01'),
  is_active: true,
};

const createRiwayatJabatan = async (pegawaiId: number, jabatan: string, unitKerja: string, tmtJabatan: Date, tmtBerakhir?: Date): Promise<void> => {
  const input: CreateRiwayatJabatanInput = {
    pegawai_id: pegawaiId,
    jabatan,
    unit_kerja: unitKerja,
    tmt_jabatan: tmtJabatan,
    tmt_berakhir: tmtBerakhir || null,
    keterangan: `Riwayat jabatan ${jabatan}`,
  };

  await db.insert(riwayatJabatanTable)
    .values({
      pegawai_id: input.pegawai_id,
      jabatan: input.jabatan,
      unit_kerja: input.unit_kerja,
      tmt_jabatan: input.tmt_jabatan,
      tmt_berakhir: input.tmt_berakhir,
      keterangan: input.keterangan,
    })
    .execute();
};

describe('getRiwayatJabatanByPegawai', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for pegawai with no job history', async () => {
    // Create pegawai first
    const pegawaiResult = await db.insert(pegawaiTable)
      .values({
        nip: testPegawai.nip,
        nama: testPegawai.nama,
        email: testPegawai.email,
        telepon: testPegawai.telepon,
        alamat: testPegawai.alamat,
        tanggal_lahir: testPegawai.tanggal_lahir,
        jenis_kelamin: testPegawai.jenis_kelamin,
        status_kepegawaian: testPegawai.status_kepegawaian,
        jabatan_saat_ini: testPegawai.jabatan_saat_ini,
        unit_kerja: testPegawai.unit_kerja,
        tmt_jabatan: testPegawai.tmt_jabatan,
        is_active: testPegawai.is_active,
      })
      .returning()
      .execute();

    const input: GetPegawaiByIdInput = { id: pegawaiResult[0].id };
    const result = await getRiwayatJabatanByPegawai(input);

    expect(result).toHaveLength(0);
  });

  it('should return single job history record', async () => {
    // Create pegawai first
    const pegawaiResult = await db.insert(pegawaiTable)
      .values({
        nip: testPegawai.nip,
        nama: testPegawai.nama,
        email: testPegawai.email,
        telepon: testPegawai.telepon,
        alamat: testPegawai.alamat,
        tanggal_lahir: testPegawai.tanggal_lahir,
        jenis_kelamin: testPegawai.jenis_kelamin,
        status_kepegawaian: testPegawai.status_kepegawaian,
        jabatan_saat_ini: testPegawai.jabatan_saat_ini,
        unit_kerja: testPegawai.unit_kerja,
        tmt_jabatan: testPegawai.tmt_jabatan,
        is_active: testPegawai.is_active,
      })
      .returning()
      .execute();

    const pegawaiId = pegawaiResult[0].id;

    // Create single job history record
    await createRiwayatJabatan(
      pegawaiId,
      'Staff IT',
      'Bagian IT',
      new Date('2018-01-01'),
      new Date('2019-12-31')
    );

    const input: GetPegawaiByIdInput = { id: pegawaiId };
    const result = await getRiwayatJabatanByPegawai(input);

    expect(result).toHaveLength(1);
    expect(result[0].pegawai_id).toEqual(pegawaiId);
    expect(result[0].jabatan).toEqual('Staff IT');
    expect(result[0].unit_kerja).toEqual('Bagian IT');
    expect(result[0].tmt_jabatan).toBeInstanceOf(Date);
    expect(result[0].tmt_berakhir).toBeInstanceOf(Date);
    expect(result[0].keterangan).toEqual('Riwayat jabatan Staff IT');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple job history records ordered by tmt_jabatan descending', async () => {
    // Create pegawai first
    const pegawaiResult = await db.insert(pegawaiTable)
      .values({
        nip: testPegawai.nip,
        nama: testPegawai.nama,
        email: testPegawai.email,
        telepon: testPegawai.telepon,
        alamat: testPegawai.alamat,
        tanggal_lahir: testPegawai.tanggal_lahir,
        jenis_kelamin: testPegawai.jenis_kelamin,
        status_kepegawaian: testPegawai.status_kepegawaian,
        jabatan_saat_ini: testPegawai.jabatan_saat_ini,
        unit_kerja: testPegawai.unit_kerja,
        tmt_jabatan: testPegawai.tmt_jabatan,
        is_active: testPegawai.is_active,
      })
      .returning()
      .execute();

    const pegawaiId = pegawaiResult[0].id;

    // Create multiple job history records with different dates
    await createRiwayatJabatan(
      pegawaiId,
      'Staff IT',
      'Bagian IT',
      new Date('2016-01-01'),
      new Date('2017-12-31')
    );

    await createRiwayatJabatan(
      pegawaiId,
      'Senior Staff IT',
      'Bagian IT',
      new Date('2018-01-01'),
      new Date('2019-12-31')
    );

    await createRiwayatJabatan(
      pegawaiId,
      'Kepala Bagian',
      'Bagian IT',
      new Date('2020-01-01') // Most recent - should be first
    );

    const input: GetPegawaiByIdInput = { id: pegawaiId };
    const result = await getRiwayatJabatanByPegawai(input);

    expect(result).toHaveLength(3);

    // Verify ordering - most recent first (2020, 2018, 2016)
    expect(result[0].jabatan).toEqual('Kepala Bagian');
    expect(result[0].tmt_jabatan.getFullYear()).toEqual(2020);

    expect(result[1].jabatan).toEqual('Senior Staff IT');
    expect(result[1].tmt_jabatan.getFullYear()).toEqual(2018);

    expect(result[2].jabatan).toEqual('Staff IT');
    expect(result[2].tmt_jabatan.getFullYear()).toEqual(2016);

    // Verify all records belong to the same pegawai
    result.forEach(record => {
      expect(record.pegawai_id).toEqual(pegawaiId);
      expect(record.tmt_jabatan).toBeInstanceOf(Date);
      expect(record.created_at).toBeInstanceOf(Date);
      expect(record.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for non-existent pegawai', async () => {
    const input: GetPegawaiByIdInput = { id: 999999 };
    const result = await getRiwayatJabatanByPegawai(input);

    expect(result).toHaveLength(0);
  });

  it('should handle records with null tmt_berakhir (current position)', async () => {
    // Create pegawai first
    const pegawaiResult = await db.insert(pegawaiTable)
      .values({
        nip: testPegawai.nip,
        nama: testPegawai.nama,
        email: testPegawai.email,
        telepon: testPegawai.telepon,
        alamat: testPegawai.alamat,
        tanggal_lahir: testPegawai.tanggal_lahir,
        jenis_kelamin: testPegawai.jenis_kelamin,
        status_kepegawaian: testPegawai.status_kepegawaian,
        jabatan_saat_ini: testPegawai.jabatan_saat_ini,
        unit_kerja: testPegawai.unit_kerja,
        tmt_jabatan: testPegawai.tmt_jabatan,
        is_active: testPegawai.is_active,
      })
      .returning()
      .execute();

    const pegawaiId = pegawaiResult[0].id;

    // Create job history record without end date (current position)
    await createRiwayatJabatan(
      pegawaiId,
      'Kepala Bagian',
      'Bagian IT',
      new Date('2020-01-01')
      // No tmt_berakhir - current position
    );

    const input: GetPegawaiByIdInput = { id: pegawaiId };
    const result = await getRiwayatJabatanByPegawai(input);

    expect(result).toHaveLength(1);
    expect(result[0].jabatan).toEqual('Kepala Bagian');
    expect(result[0].tmt_berakhir).toBeNull();
    expect(result[0].tmt_jabatan).toBeInstanceOf(Date);
  });
});
