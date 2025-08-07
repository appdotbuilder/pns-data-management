
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pegawaiTable, mutasiTable } from '../db/schema';
import { getMutasiPending } from '../handlers/get_mutasi_pending';

// Test data
const testPegawai = {
  nip: 'TEST001',
  nama: 'John Doe',
  email: 'john.doe@example.com',
  tanggal_lahir: new Date('1990-01-01'),
  jenis_kelamin: 'Laki-laki',
  status_kepegawaian: 'PNS',
  is_active: true,
};

const testMutasi = {
  jabatan_baru: 'Manager IT',
  unit_kerja_baru: 'IT Department',
  tanggal_efektif: new Date('2024-02-01'),
  alasan_mutasi: 'Promosi berdasarkan kinerja',
  status: 'pending' as const,
  diajukan_oleh: 1,
};

describe('getMutasiPending', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no pending mutations exist', async () => {
    const result = await getMutasiPending();
    expect(result).toEqual([]);
  });

  it('should return pending mutations with correct data', async () => {
    // Create prerequisite pegawai
    const pegawaiResult = await db.insert(pegawaiTable)
      .values(testPegawai)
      .returning()
      .execute();

    const pegawai = pegawaiResult[0];

    // Create pending mutasi
    await db.insert(mutasiTable)
      .values({
        ...testMutasi,
        pegawai_id: pegawai.id,
      })
      .execute();

    const result = await getMutasiPending();

    expect(result).toHaveLength(1);
    expect(result[0].pegawai_id).toBe(pegawai.id);
    expect(result[0].jabatan_baru).toBe('Manager IT');
    expect(result[0].unit_kerja_baru).toBe('IT Department');
    expect(result[0].status).toBe('pending');
    expect(result[0].diajukan_oleh).toBe(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should only return pending mutations, not approved or rejected', async () => {
    // Create prerequisite pegawai
    const pegawaiResult = await db.insert(pegawaiTable)
      .values(testPegawai)
      .returning()
      .execute();

    const pegawai = pegawaiResult[0];

    // Create mutations with different statuses
    await db.insert(mutasiTable)
      .values([
        {
          ...testMutasi,
          pegawai_id: pegawai.id,
          status: 'pending',
          jabatan_baru: 'Pending Position',
        },
        {
          ...testMutasi,
          pegawai_id: pegawai.id,
          status: 'approved',
          jabatan_baru: 'Approved Position',
        },
        {
          ...testMutasi,
          pegawai_id: pegawai.id,
          status: 'rejected',
          jabatan_baru: 'Rejected Position',
        },
      ])
      .execute();

    const result = await getMutasiPending();

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('pending');
    expect(result[0].jabatan_baru).toBe('Pending Position');
  });

  it('should return multiple pending mutations when they exist', async () => {
    // Create two pegawai records
    const pegawaiResults = await db.insert(pegawaiTable)
      .values([
        { ...testPegawai, nip: 'TEST001', nama: 'John Doe' },
        { ...testPegawai, nip: 'TEST002', nama: 'Jane Smith', email: 'jane.smith@example.com' },
      ])
      .returning()
      .execute();

    const [pegawai1, pegawai2] = pegawaiResults;

    // Create pending mutations for both pegawai
    await db.insert(mutasiTable)
      .values([
        {
          ...testMutasi,
          pegawai_id: pegawai1.id,
          jabatan_baru: 'Position 1',
        },
        {
          ...testMutasi,
          pegawai_id: pegawai2.id,
          jabatan_baru: 'Position 2',
        },
      ])
      .execute();

    const result = await getMutasiPending();

    expect(result).toHaveLength(2);
    expect(result.every(mutasi => mutasi.status === 'pending')).toBe(true);
    
    const jabatanList = result.map(m => m.jabatan_baru);
    expect(jabatanList).toContain('Position 1');
    expect(jabatanList).toContain('Position 2');
  });
});
