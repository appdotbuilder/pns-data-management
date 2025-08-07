
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { posisiTersediaTable } from '../db/schema';
import { type CreatePosisiTersediaInput } from '../schema';
import { 
  createPosisiTersedia, 
  getPosisiTersediaList, 
  updatePosisiTersedia, 
  deactivatePosisiTersedia, 
  reduceKuotaPosisi 
} from '../handlers/posisi_tersedia';
import { eq, and, gt } from 'drizzle-orm';

const testInput: CreatePosisiTersediaInput = {
  satuan_kerja: 'Dinas Pendidikan',
  unit_kerja: 'SMA Negeri 1',
  jabatan: 'Guru Matematika',
  kuota_tersedia: 3,
  persyaratan: 'S1 Pendidikan Matematika, minimal 2 tahun pengalaman'
};

describe('createPosisiTersedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a posisi tersedia', async () => {
    const result = await createPosisiTersedia(testInput);

    expect(result.satuan_kerja).toEqual('Dinas Pendidikan');
    expect(result.unit_kerja).toEqual('SMA Negeri 1');
    expect(result.jabatan).toEqual('Guru Matematika');
    expect(result.kuota_tersedia).toEqual(3);
    expect(result.persyaratan).toEqual('S1 Pendidikan Matematika, minimal 2 tahun pengalaman');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save posisi tersedia to database', async () => {
    const result = await createPosisiTersedia(testInput);

    const positions = await db.select()
      .from(posisiTersediaTable)
      .where(eq(posisiTersediaTable.id, result.id))
      .execute();

    expect(positions).toHaveLength(1);
    expect(positions[0].satuan_kerja).toEqual('Dinas Pendidikan');
    expect(positions[0].unit_kerja).toEqual('SMA Negeri 1');
    expect(positions[0].jabatan).toEqual('Guru Matematika');
    expect(positions[0].kuota_tersedia).toEqual(3);
    expect(positions[0].is_active).toEqual(true);
  });
});

describe('getPosisiTersediaList', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only active positions with available quota', async () => {
    // Create active position with available quota
    const activePosition = await createPosisiTersedia(testInput);

    // Create inactive position
    const inactiveInput = { ...testInput, satuan_kerja: 'Dinas Kesehatan' };
    const inactivePosition = await createPosisiTersedia(inactiveInput);
    await db.update(posisiTersediaTable)
      .set({ is_active: false })
      .where(eq(posisiTersediaTable.id, inactivePosition.id))
      .execute();

    // Create position with zero quota
    const zeroQuotaInput = { ...testInput, satuan_kerja: 'Dinas Pertanian', kuota_tersedia: 0 };
    await createPosisiTersedia(zeroQuotaInput);

    const results = await getPosisiTersediaList();

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(activePosition.id);
    expect(results[0].satuan_kerja).toEqual('Dinas Pendidikan');
    expect(results[0].is_active).toEqual(true);
    expect(results[0].kuota_tersedia).toBeGreaterThan(0);
  });

  it('should return empty array when no active positions available', async () => {
    const results = await getPosisiTersediaList();
    expect(results).toHaveLength(0);
  });
});

describe('updatePosisiTersedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update posisi tersedia fields', async () => {
    const position = await createPosisiTersedia(testInput);

    const updateData = {
      satuan_kerja: 'Dinas Kesehatan',
      jabatan: 'Dokter Umum',
      kuota_tersedia: 5
    };

    const result = await updatePosisiTersedia(position.id, updateData);

    expect(result.id).toEqual(position.id);
    expect(result.satuan_kerja).toEqual('Dinas Kesehatan');
    expect(result.unit_kerja).toEqual('SMA Negeri 1'); // unchanged
    expect(result.jabatan).toEqual('Dokter Umum');
    expect(result.kuota_tersedia).toEqual(5);
    expect(result.persyaratan).toEqual(testInput.persyaratan); // unchanged
  });

  it('should update database record', async () => {
    const position = await createPosisiTersedia(testInput);

    await updatePosisiTersedia(position.id, { 
      satuan_kerja: 'Updated Satuan Kerja' 
    });

    const updated = await db.select()
      .from(posisiTersediaTable)
      .where(eq(posisiTersediaTable.id, position.id))
      .execute();

    expect(updated[0].satuan_kerja).toEqual('Updated Satuan Kerja');
  });

  it('should throw error for non-existent position', async () => {
    await expect(updatePosisiTersedia(999, { satuan_kerja: 'Test' }))
      .rejects.toThrow(/not found/i);
  });
});

describe('deactivatePosisiTersedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should deactivate posisi tersedia', async () => {
    const position = await createPosisiTersedia(testInput);

    const result = await deactivatePosisiTersedia(position.id);

    expect(result.success).toEqual(true);

    const deactivated = await db.select()
      .from(posisiTersediaTable)
      .where(eq(posisiTersediaTable.id, position.id))
      .execute();

    expect(deactivated[0].is_active).toEqual(false);
  });

  it('should throw error for non-existent position', async () => {
    await expect(deactivatePosisiTersedia(999))
      .rejects.toThrow(/not found/i);
  });
});

describe('reduceKuotaPosisi', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should reduce quota by 1', async () => {
    const position = await createPosisiTersedia(testInput);

    const result = await reduceKuotaPosisi(position.id);

    expect(result.success).toEqual(true);

    const updated = await db.select()
      .from(posisiTersediaTable)
      .where(eq(posisiTersediaTable.id, position.id))
      .execute();

    expect(updated[0].kuota_tersedia).toEqual(2); // reduced from 3 to 2
  });

  it('should throw error when quota is already zero', async () => {
    const zeroQuotaInput = { ...testInput, kuota_tersedia: 0 };
    const position = await createPosisiTersedia(zeroQuotaInput);

    await expect(reduceKuotaPosisi(position.id))
      .rejects.toThrow(/cannot reduce quota/i);
  });

  it('should throw error for non-existent position', async () => {
    await expect(reduceKuotaPosisi(999))
      .rejects.toThrow(/not found/i);
  });
});
