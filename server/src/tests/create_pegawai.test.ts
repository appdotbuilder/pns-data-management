
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pegawaiTable } from '../db/schema';
import { type CreatePegawaiInput } from '../schema';
import { createPegawai } from '../handlers/create_pegawai';
import { eq } from 'drizzle-orm';

describe('createPegawai', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pegawai with all fields', async () => {
    const testInput: CreatePegawaiInput = {
      nip: '123456789',
      nama: 'John Doe',
      email: 'john.doe@example.com',
      telepon: '08123456789',
      alamat: 'Jl. Test No. 123',
      tanggal_lahir: new Date('1990-01-15'),
      jenis_kelamin: 'Laki-laki',
      status_kepegawaian: 'PNS',
      jabatan_saat_ini: 'Analis Data',
      unit_kerja: 'IT Department',
      tmt_jabatan: new Date('2020-01-01'),
      is_active: true
    };

    const result = await createPegawai(testInput);

    // Basic field validation
    expect(result.nip).toEqual('123456789');
    expect(result.nama).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.telepon).toEqual('08123456789');
    expect(result.alamat).toEqual('Jl. Test No. 123');
    expect(result.tanggal_lahir).toEqual(testInput.tanggal_lahir);
    expect(result.jenis_kelamin).toEqual('Laki-laki');
    expect(result.status_kepegawaian).toEqual('PNS');
    expect(result.jabatan_saat_ini).toEqual('Analis Data');
    expect(result.unit_kerja).toEqual('IT Department');
    expect(result.tmt_jabatan).toEqual(testInput.tmt_jabatan || null);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a pegawai with minimal required fields', async () => {
    const minimalInput: CreatePegawaiInput = {
      nip: '987654321',
      nama: 'Jane Smith',
      email: 'jane.smith@example.com',
      tanggal_lahir: new Date('1985-06-20'),
      jenis_kelamin: 'Perempuan',
      status_kepegawaian: 'CPNS',
      is_active: true
    };

    const result = await createPegawai(minimalInput);

    expect(result.nip).toEqual('987654321');
    expect(result.nama).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.telepon).toBeNull();
    expect(result.alamat).toBeNull();
    expect(result.tanggal_lahir).toEqual(minimalInput.tanggal_lahir);
    expect(result.jenis_kelamin).toEqual('Perempuan');
    expect(result.status_kepegawaian).toEqual('CPNS');
    expect(result.jabatan_saat_ini).toBeNull();
    expect(result.unit_kerja).toBeNull();
    expect(result.tmt_jabatan).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save pegawai to database', async () => {
    const testInput: CreatePegawaiInput = {
      nip: '555555555',
      nama: 'Test User',
      email: 'test.user@example.com',
      tanggal_lahir: new Date('1990-01-15'),
      jenis_kelamin: 'Laki-laki',
      status_kepegawaian: 'PNS',
      is_active: true
    };

    const result = await createPegawai(testInput);

    // Query database to verify persistence
    const pegawais = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, result.id))
      .execute();

    expect(pegawais).toHaveLength(1);
    expect(pegawais[0].nip).toEqual('555555555');
    expect(pegawais[0].nama).toEqual('Test User');
    expect(pegawais[0].email).toEqual('test.user@example.com');
    expect(pegawais[0].jenis_kelamin).toEqual('Laki-laki');
    expect(pegawais[0].status_kepegawaian).toEqual('PNS');
    expect(pegawais[0].is_active).toEqual(true);
    expect(pegawais[0].created_at).toBeInstanceOf(Date);
    expect(pegawais[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique NIP constraint', async () => {
    const firstInput: CreatePegawaiInput = {
      nip: '111111111',
      nama: 'First Person',
      email: 'first@example.com',
      tanggal_lahir: new Date('1990-01-15'),
      jenis_kelamin: 'Laki-laki',
      status_kepegawaian: 'PNS',
      is_active: true
    };

    // Create first pegawai
    await createPegawai(firstInput);

    // Try to create another pegawai with same NIP
    const duplicateInput: CreatePegawaiInput = {
      nip: '111111111', // Same NIP
      nama: 'Different Name',
      email: 'different@example.com',
      tanggal_lahir: new Date('1985-06-20'),
      jenis_kelamin: 'Perempuan',
      status_kepegawaian: 'CPNS',
      is_active: true
    };

    await expect(createPegawai(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should allow duplicate emails since no unique constraint exists', async () => {
    const firstInput: CreatePegawaiInput = {
      nip: '222222222',
      nama: 'First Person',
      email: 'same@example.com',
      tanggal_lahir: new Date('1990-01-15'),
      jenis_kelamin: 'Laki-laki',
      status_kepegawaian: 'PNS',
      is_active: true
    };

    // Create first pegawai
    const firstResult = await createPegawai(firstInput);

    // Create another pegawai with same email (should succeed)
    const secondInput: CreatePegawaiInput = {
      nip: '333333333', // Different NIP
      nama: 'Different Name',
      email: 'same@example.com', // Same email - should be allowed
      tanggal_lahir: new Date('1985-06-20'),
      jenis_kelamin: 'Perempuan',
      status_kepegawaian: 'CPNS',
      is_active: true
    };

    const secondResult = await createPegawai(secondInput);

    // Both should exist and have the same email
    expect(firstResult.email).toEqual('same@example.com');
    expect(secondResult.email).toEqual('same@example.com');
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.nip).not.toEqual(secondResult.nip);
  });

  it('should handle date fields correctly', async () => {
    const tmtDate = new Date('2021-07-15');
    const dateInput: CreatePegawaiInput = {
      nip: '444444444',
      nama: 'Date Test',
      email: 'datetest@example.com',
      tanggal_lahir: new Date('1992-12-25'),
      jenis_kelamin: 'Laki-laki',
      status_kepegawaian: 'PNS',
      tmt_jabatan: tmtDate,
      is_active: true
    };

    const result = await createPegawai(dateInput);

    expect(result.tanggal_lahir).toEqual(new Date('1992-12-25'));
    expect(result.tmt_jabatan).toEqual(tmtDate);

    // Verify dates are stored correctly in database
    const stored = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, result.id))
      .execute();

    expect(stored[0].tanggal_lahir).toEqual(new Date('1992-12-25'));
    expect(stored[0].tmt_jabatan).toEqual(tmtDate);
  });
});
