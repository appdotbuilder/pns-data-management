
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mutasiTable, pegawaiTable, usersTable } from '../db/schema';
import { type CreateMutasiInput } from '../schema';
import { createMutasi } from '../handlers/create_mutasi';
import { eq } from 'drizzle-orm';

describe('createMutasi', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a mutasi request', async () => {
    // Create prerequisite pegawai
    const pegawaiResult = await db.insert(pegawaiTable)
      .values({
        nip: '123456789',
        nama: 'John Doe',
        email: 'john@example.com',
        tanggal_lahir: new Date('1990-01-01'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS',
        jabatan_saat_ini: 'Staff',
        unit_kerja: 'IT Department',
      })
      .returning()
      .execute();

    // Create user who will submit the mutation
    const userResult = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'hashedpassword',
        role: 'admin',
      })
      .returning()
      .execute();

    const testInput: CreateMutasiInput = {
      pegawai_id: pegawaiResult[0].id,
      jabatan_baru: 'Senior Staff',
      unit_kerja_baru: 'HR Department',
      tanggal_efektif: new Date('2024-01-01'),
      alasan_mutasi: 'Promotion due to good performance',
      diajukan_oleh: userResult[0].id,
    };

    const result = await createMutasi(testInput);

    // Basic field validation
    expect(result.pegawai_id).toEqual(pegawaiResult[0].id);
    expect(result.jabatan_baru).toEqual('Senior Staff');
    expect(result.unit_kerja_baru).toEqual('HR Department');
    expect(result.tanggal_efektif).toEqual(new Date('2024-01-01'));
    expect(result.alasan_mutasi).toEqual('Promotion due to good performance');
    expect(result.diajukan_oleh).toEqual(userResult[0].id);
    expect(result.status).toEqual('pending');
    expect(result.disetujui_oleh).toBeNull();
    expect(result.tanggal_disetujui).toBeNull();
    expect(result.catatan_persetujuan).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save mutasi to database', async () => {
    // Create prerequisite pegawai and user
    const pegawaiResult = await db.insert(pegawaiTable)
      .values({
        nip: '987654321',
        nama: 'Jane Smith',
        email: 'jane@example.com',
        tanggal_lahir: new Date('1985-06-15'),
        jenis_kelamin: 'Perempuan',
        status_kepegawaian: 'CPNS',
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        username: 'supervisor',
        email: 'supervisor@example.com',
        password_hash: 'hashedpassword',
        role: 'user',
      })
      .returning()
      .execute();

    const testInput: CreateMutasiInput = {
      pegawai_id: pegawaiResult[0].id,
      jabatan_baru: 'Team Lead',
      unit_kerja_baru: 'Finance Department',
      tanggal_efektif: new Date('2024-02-01'),
      alasan_mutasi: null,
      diajukan_oleh: userResult[0].id,
    };

    const result = await createMutasi(testInput);

    // Query database to verify record was saved
    const mutasiRecords = await db.select()
      .from(mutasiTable)
      .where(eq(mutasiTable.id, result.id))
      .execute();

    expect(mutasiRecords).toHaveLength(1);
    const savedRecord = mutasiRecords[0];
    expect(savedRecord.pegawai_id).toEqual(pegawaiResult[0].id);
    expect(savedRecord.jabatan_baru).toEqual('Team Lead');
    expect(savedRecord.unit_kerja_baru).toEqual('Finance Department');
    expect(savedRecord.status).toEqual('pending');
    expect(savedRecord.alasan_mutasi).toBeNull();
    expect(savedRecord.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when pegawai does not exist', async () => {
    // Create user but no pegawai
    const userResult = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'hashedpassword',
        role: 'admin',
      })
      .returning()
      .execute();

    const testInput: CreateMutasiInput = {
      pegawai_id: 99999, // Non-existent pegawai ID
      jabatan_baru: 'Manager',
      unit_kerja_baru: 'Operations',
      tanggal_efektif: new Date('2024-03-01'),
      alasan_mutasi: 'Career advancement',
      diajukan_oleh: userResult[0].id,
    };

    await expect(createMutasi(testInput)).rejects.toThrow(/pegawai not found/i);
  });

  it('should handle null alasan_mutasi correctly', async () => {
    // Create prerequisite data
    const pegawaiResult = await db.insert(pegawaiTable)
      .values({
        nip: '555666777',
        nama: 'Test Employee',
        email: 'test@example.com',
        tanggal_lahir: new Date('1992-12-25'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS',
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'testuser@example.com',
        password_hash: 'hashedpassword',
        role: 'user',
      })
      .returning()
      .execute();

    const testInput: CreateMutasiInput = {
      pegawai_id: pegawaiResult[0].id,
      jabatan_baru: 'Analyst',
      unit_kerja_baru: 'Research Division',
      tanggal_efektif: new Date('2024-04-01'),
      diajukan_oleh: userResult[0].id,
      // alasan_mutasi is omitted (will be undefined)
    };

    const result = await createMutasi(testInput);

    expect(result.alasan_mutasi).toBeNull();
  });
});
