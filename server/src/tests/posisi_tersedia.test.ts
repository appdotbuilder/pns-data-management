
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { posisiTersediaTable } from '../db/schema';
import { type CreatePosisiTersediaInput } from '../schema';
import {
  createPosisiTersedia,
  getPosisiTersediaList,
  updatePosisiTersedia,
  deactivatePosisiTersedia
} from '../handlers/posisi_tersedia';
import { eq } from 'drizzle-orm';

const testInput: CreatePosisiTersediaInput = {
  nama_posisi: 'Manager IT',
  unit_kerja: 'Divisi Teknologi Informasi',
  deskripsi: 'Mengelola tim IT dan infrastruktur teknologi',
  persyaratan: 'S1 Teknik Informatika, pengalaman min 5 tahun',
  is_available: true
};

describe('createPosisiTersedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a posisi tersedia', async () => {
    const result = await createPosisiTersedia(testInput);

    expect(result.nama_posisi).toEqual('Manager IT');
    expect(result.unit_kerja).toEqual('Divisi Teknologi Informasi');
    expect(result.deskripsi).toEqual('Mengelola tim IT dan infrastruktur teknologi');
    expect(result.persyaratan).toEqual('S1 Teknik Informatika, pengalaman min 5 tahun');
    expect(result.is_available).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save posisi tersedia to database', async () => {
    const result = await createPosisiTersedia(testInput);

    const saved = await db.select()
      .from(posisiTersediaTable)
      .where(eq(posisiTersediaTable.id, result.id))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].nama_posisi).toEqual('Manager IT');
    expect(saved[0].unit_kerja).toEqual('Divisi Teknologi Informasi');
    expect(saved[0].is_available).toEqual(true);
  });

  it('should create posisi tersedia with omitted optional fields', async () => {
    const inputWithoutOptionals: CreatePosisiTersediaInput = {
      nama_posisi: 'Staff Admin',
      unit_kerja: 'Divisi Umum',
      is_available: true
    };

    const result = await createPosisiTersedia(inputWithoutOptionals);

    expect(result.nama_posisi).toEqual('Staff Admin');
    expect(result.unit_kerja).toEqual('Divisi Umum');
    expect(result.deskripsi).toBeNull();
    expect(result.persyaratan).toBeNull();
    expect(result.is_available).toEqual(true);
  });
});

describe('getPosisiTersediaList', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty list when no positions exist', async () => {
    const result = await getPosisiTersediaList();
    expect(result).toHaveLength(0);
  });

  it('should return only available positions', async () => {
    // Create available position
    await createPosisiTersedia(testInput);

    // Create unavailable position
    const unavailableInput: CreatePosisiTersediaInput = {
      nama_posisi: 'Manager HR',
      unit_kerja: 'Divisi SDM',
      deskripsi: 'Mengelola SDM',
      persyaratan: 'S1 Psikologi',
      is_available: false
    };
    await createPosisiTersedia(unavailableInput);

    const result = await getPosisiTersediaList();

    expect(result).toHaveLength(1);
    expect(result[0].nama_posisi).toEqual('Manager IT');
    expect(result[0].is_available).toEqual(true);
  });

  it('should return multiple available positions', async () => {
    await createPosisiTersedia(testInput);

    const secondInput: CreatePosisiTersediaInput = {
      nama_posisi: 'Analyst Business',
      unit_kerja: 'Divisi Perencanaan',
      deskripsi: 'Menganalisis proses bisnis',
      persyaratan: 'S1 Ekonomi/Manajemen',
      is_available: true
    };
    await createPosisiTersedia(secondInput);

    const result = await getPosisiTersediaList();

    expect(result).toHaveLength(2);
    expect(result.map(p => p.nama_posisi)).toContain('Manager IT');
    expect(result.map(p => p.nama_posisi)).toContain('Analyst Business');
  });
});

describe('updatePosisiTersedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update posisi tersedia fields', async () => {
    const created = await createPosisiTersedia(testInput);

    const updateInput = {
      nama_posisi: 'Senior Manager IT',
      deskripsi: 'Updated description',
      persyaratan: 'Updated requirements'
    };

    const result = await updatePosisiTersedia(created.id, updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.nama_posisi).toEqual('Senior Manager IT');
    expect(result.unit_kerja).toEqual('Divisi Teknologi Informasi');
    expect(result.deskripsi).toEqual('Updated description');
    expect(result.persyaratan).toEqual('Updated requirements');
    expect(result.is_available).toEqual(true);
  });

  it('should update only provided fields', async () => {
    const created = await createPosisiTersedia(testInput);

    const result = await updatePosisiTersedia(created.id, {
      nama_posisi: 'Updated Position'
    });

    expect(result.nama_posisi).toEqual('Updated Position');
    expect(result.unit_kerja).toEqual('Divisi Teknologi Informasi');
    expect(result.deskripsi).toEqual('Mengelola tim IT dan infrastruktur teknologi');
    expect(result.persyaratan).toEqual('S1 Teknik Informatika, pengalaman min 5 tahun');
  });

  it('should throw error for non-existent id', async () => {
    await expect(updatePosisiTersedia(999, { nama_posisi: 'Test' }))
      .rejects.toThrow(/not found/i);
  });
});

describe('deactivatePosisiTersedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should deactivate posisi tersedia', async () => {
    const created = await createPosisiTersedia(testInput);

    const result = await deactivatePosisiTersedia(created.id);

    expect(result.success).toEqual(true);

    // Verify in database
    const deactivated = await db.select()
      .from(posisiTersediaTable)
      .where(eq(posisiTersediaTable.id, created.id))
      .execute();

    expect(deactivated[0].is_available).toEqual(false);
  });

  it('should not appear in available list after deactivation', async () => {
    const created = await createPosisiTersedia(testInput);

    await deactivatePosisiTersedia(created.id);

    const availableList = await getPosisiTersediaList();
    expect(availableList).toHaveLength(0);
  });

  it('should throw error for non-existent id', async () => {
    await expect(deactivatePosisiTersedia(999))
      .rejects.toThrow(/not found/i);
  });
});
