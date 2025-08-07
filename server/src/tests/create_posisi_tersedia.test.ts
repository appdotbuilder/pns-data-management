
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { posisiTersediaTable } from '../db/schema';
import { type CreatePosisiTersediaInput } from '../schema';
import { createPosisiTersedia } from '../handlers/create_posisi_tersedia';
import { eq } from 'drizzle-orm';

const testInput: CreatePosisiTersediaInput = {
  nama_posisi: 'Manager IT',
  unit_kerja: 'Divisi Teknologi Informasi',
  deskripsi: 'Bertanggung jawab atas pengelolaan sistem IT perusahaan',
  persyaratan: 'Minimal S1 Teknik Informatika, pengalaman 5 tahun',
  is_available: true
};

describe('createPosisiTersedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a posisi tersedia', async () => {
    const result = await createPosisiTersedia(testInput);

    expect(result.nama_posisi).toEqual('Manager IT');
    expect(result.unit_kerja).toEqual('Divisi Teknologi Informasi');
    expect(result.deskripsi).toEqual('Bertanggung jawab atas pengelolaan sistem IT perusahaan');
    expect(result.persyaratan).toEqual('Minimal S1 Teknik Informatika, pengalaman 5 tahun');
    expect(result.is_available).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save posisi tersedia to database', async () => {
    const result = await createPosisiTersedia(testInput);

    const posisiList = await db.select()
      .from(posisiTersediaTable)
      .where(eq(posisiTersediaTable.id, result.id))
      .execute();

    expect(posisiList).toHaveLength(1);
    expect(posisiList[0].nama_posisi).toEqual('Manager IT');
    expect(posisiList[0].unit_kerja).toEqual('Divisi Teknologi Informasi');
    expect(posisiList[0].deskripsi).toEqual('Bertanggung jawab atas pengelolaan sistem IT perusahaan');
    expect(posisiList[0].persyaratan).toEqual('Minimal S1 Teknik Informatika, pengalaman 5 tahun');
    expect(posisiList[0].is_available).toEqual(true);
    expect(posisiList[0].created_at).toBeInstanceOf(Date);
    expect(posisiList[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create posisi tersedia with nullable fields', async () => {
    const inputWithNulls: CreatePosisiTersediaInput = {
      nama_posisi: 'Supervisor Keuangan',
      unit_kerja: 'Divisi Keuangan',
      deskripsi: null,
      persyaratan: null,
      is_available: false
    };

    const result = await createPosisiTersedia(inputWithNulls);

    expect(result.nama_posisi).toEqual('Supervisor Keuangan');
    expect(result.unit_kerja).toEqual('Divisi Keuangan');
    expect(result.deskripsi).toBeNull();
    expect(result.persyaratan).toBeNull();
    expect(result.is_available).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create posisi tersedia with default is_available value', async () => {
    const inputWithDefaults: CreatePosisiTersediaInput = {
      nama_posisi: 'Analyst Data',
      unit_kerja: 'Divisi Riset',
      deskripsi: 'Menganalisis data untuk mendukung keputusan bisnis',
      persyaratan: 'Minimal S1 Statistika atau Matematika',
      is_available: true // This comes from Zod default
    };

    const result = await createPosisiTersedia(inputWithDefaults);

    expect(result.nama_posisi).toEqual('Analyst Data');
    expect(result.unit_kerja).toEqual('Divisi Riset');
    expect(result.is_available).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
