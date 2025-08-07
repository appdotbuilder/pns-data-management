
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pegawaiTable } from '../db/schema';
import { type CreatePegawaiInput } from '../schema';
import { createPegawai, getPegawaiById } from '../handlers/pegawai';
import { eq } from 'drizzle-orm';

const testPegawaiInput: CreatePegawaiInput = {
  nip: '123456789',
  nama: 'John Doe',
  email: 'john.doe@example.com',
  telepon: '081234567890',
  alamat: 'Jl. Test No. 123',
  tanggal_lahir: new Date('1990-01-01'),
  jenis_kelamin: 'Laki-laki',
  status_kepegawaian: 'PNS',
  jabatan_saat_ini: 'Staff',
  unit_kerja: 'IT Department',
  tmt_jabatan: new Date('2020-01-01'),
  is_active: true
};

describe('createPegawai', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pegawai record', async () => {
    const result = await createPegawai(testPegawaiInput);

    expect(result.nip).toEqual('123456789');
    expect(result.nama).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.telepon).toEqual('081234567890');
    expect(result.alamat).toEqual('Jl. Test No. 123');
    expect(result.tanggal_lahir).toEqual(new Date('1990-01-01'));
    expect(result.jenis_kelamin).toEqual('Laki-laki');
    expect(result.status_kepegawaian).toEqual('PNS');
    expect(result.jabatan_saat_ini).toEqual('Staff');
    expect(result.unit_kerja).toEqual('IT Department');
    expect(result.tmt_jabatan).toEqual(new Date('2020-01-01'));
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save pegawai to database', async () => {
    const result = await createPegawai(testPegawaiInput);

    const pegawai = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, result.id))
      .execute();

    expect(pegawai).toHaveLength(1);
    expect(pegawai[0].nip).toEqual('123456789');
    expect(pegawai[0].nama).toEqual('John Doe');
    expect(pegawai[0].email).toEqual('john.doe@example.com');
    expect(pegawai[0].is_active).toEqual(true);
  });

  it('should handle nullable fields correctly', async () => {
    const inputWithNulls: CreatePegawaiInput = {
      nip: '987654321',
      nama: 'Jane Smith',
      email: 'jane.smith@example.com',
      tanggal_lahir: new Date('1985-05-15'),
      jenis_kelamin: 'Perempuan',
      status_kepegawaian: 'CPNS',
      is_active: true
    };

    const result = await createPegawai(inputWithNulls);

    expect(result.nip).toEqual('987654321');
    expect(result.nama).toEqual('Jane Smith');
    expect(result.telepon).toBeNull();
    expect(result.alamat).toBeNull();
    expect(result.jabatan_saat_ini).toBeNull();
    expect(result.unit_kerja).toBeNull();
    expect(result.tmt_jabatan).toBeNull();
  });

  it('should enforce unique NIP constraint', async () => {
    await createPegawai(testPegawaiInput);

    const duplicateInput: CreatePegawaiInput = {
      ...testPegawaiInput,
      nama: 'Different Name',
      email: 'different@example.com'
    };

    await expect(createPegawai(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});

describe('getPegawaiById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return pegawai when found', async () => {
    const created = await createPegawai(testPegawaiInput);
    const result = await getPegawaiById(created.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(created.id);
    expect(result!.nip).toEqual('123456789');
    expect(result!.nama).toEqual('John Doe');
  });

  it('should return null when pegawai not found', async () => {
    const result = await getPegawaiById(999);
    expect(result).toBeNull();
  });

  it('should return pegawai with correct data types', async () => {
    const created = await createPegawai(testPegawaiInput);
    const result = await getPegawaiById(created.id);

    expect(result).toBeDefined();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.nip).toBe('string');
    expect(typeof result!.nama).toBe('string');
    expect(typeof result!.is_active).toBe('boolean');
    expect(result!.tanggal_lahir).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
