
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pegawaiTable } from '../db/schema';
import { type GetPegawaiByIdInput } from '../schema';
import { getPegawaiById } from '../handlers/get_pegawai_by_id';
import { eq } from 'drizzle-orm';

describe('getPegawaiById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get pegawai by id', async () => {
    // Create test pegawai
    const insertResult = await db.insert(pegawaiTable)
      .values({
        nip: 'NIP001',
        nama: 'John Doe',
        email: 'john.doe@example.com',
        telepon: '08123456789',
        alamat: 'Jl. Test No. 1',
        tanggal_lahir: new Date('1990-01-15'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS',
        jabatan_saat_ini: 'Staff IT',
        unit_kerja: 'IT Department',
        tmt_jabatan: new Date('2020-01-01'),
        is_active: true,
      })
      .returning()
      .execute();

    const createdPegawai = insertResult[0];

    // Test the handler
    const input: GetPegawaiByIdInput = { id: createdPegawai.id };
    const result = await getPegawaiById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPegawai.id);
    expect(result!.nip).toEqual('NIP001');
    expect(result!.nama).toEqual('John Doe');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.telepon).toEqual('08123456789');
    expect(result!.alamat).toEqual('Jl. Test No. 1');
    expect(result!.tanggal_lahir).toEqual(new Date('1990-01-15'));
    expect(result!.jenis_kelamin).toEqual('Laki-laki');
    expect(result!.status_kepegawaian).toEqual('PNS');
    expect(result!.jabatan_saat_ini).toEqual('Staff IT');
    expect(result!.unit_kerja).toEqual('IT Department');
    expect(result!.tmt_jabatan).toEqual(new Date('2020-01-01'));
    expect(result!.is_active).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when pegawai not found', async () => {
    const input: GetPegawaiByIdInput = { id: 999 };
    const result = await getPegawaiById(input);

    expect(result).toBeNull();
  });

  it('should handle pegawai with null optional fields', async () => {
    // Create pegawai with minimal required data
    const insertResult = await db.insert(pegawaiTable)
      .values({
        nip: 'NIP002',
        nama: 'Jane Doe',
        email: 'jane.doe@example.com',
        telepon: null,
        alamat: null,
        tanggal_lahir: new Date('1985-05-20'),
        jenis_kelamin: 'Perempuan',
        status_kepegawaian: 'CPNS',
        jabatan_saat_ini: null,
        unit_kerja: null,
        tmt_jabatan: null,
        is_active: true,
      })
      .returning()
      .execute();

    const createdPegawai = insertResult[0];

    const input: GetPegawaiByIdInput = { id: createdPegawai.id };
    const result = await getPegawaiById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPegawai.id);
    expect(result!.nip).toEqual('NIP002');
    expect(result!.nama).toEqual('Jane Doe');
    expect(result!.telepon).toBeNull();
    expect(result!.alamat).toBeNull();
    expect(result!.jabatan_saat_ini).toBeNull();
    expect(result!.unit_kerja).toBeNull();
    expect(result!.tmt_jabatan).toBeNull();
    expect(result!.is_active).toEqual(true);
  });

  it('should verify pegawai exists in database after retrieval', async () => {
    // Create test pegawai
    const insertResult = await db.insert(pegawaiTable)
      .values({
        nip: 'NIP003',
        nama: 'Test User',
        email: 'test.user@example.com',
        telepon: '08111222333',
        alamat: 'Jl. Contoh No. 3',
        tanggal_lahir: new Date('1988-03-10'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS',
        jabatan_saat_ini: 'Manager',
        unit_kerja: 'Finance Department',
        tmt_jabatan: new Date('2015-06-01'),
        is_active: true,
      })
      .returning()
      .execute();

    const createdPegawai = insertResult[0];

    // Get pegawai using handler
    const input: GetPegawaiByIdInput = { id: createdPegawai.id };
    const result = await getPegawaiById(input);

    // Verify it matches what's in database
    const dbPegawai = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, createdPegawai.id))
      .execute();

    expect(dbPegawai).toHaveLength(1);
    expect(result!.id).toEqual(dbPegawai[0].id);
    expect(result!.nama).toEqual(dbPegawai[0].nama);
    expect(result!.email).toEqual(dbPegawai[0].email);
    expect(result!.nip).toEqual(dbPegawai[0].nip);
  });
});
