
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { posisiTersediaTable } from '../db/schema';
import { type CreatePosisiTersediaInput } from '../schema';
import { getPosisiTersedia } from '../handlers/get_posisi_tersedia';

const testPosition1: CreatePosisiTersediaInput = {
  nama_posisi: 'Manager IT',
  unit_kerja: 'Divisi Teknologi Informasi',
  deskripsi: 'Mengelola tim IT dan infrastruktur teknologi',
  persyaratan: 'S1 Teknik Informatika, pengalaman minimal 5 tahun',
  is_available: true
};

const testPosition2: CreatePosisiTersediaInput = {
  nama_posisi: 'Staff Keuangan',
  unit_kerja: 'Divisi Keuangan',
  deskripsi: 'Mengelola laporan keuangan dan administrasi',
  persyaratan: 'S1 Akuntansi, berpengalaman dalam bidang keuangan',
  is_available: true
};

const unavailablePosition: CreatePosisiTersediaInput = {
  nama_posisi: 'Kepala Bagian HRD',
  unit_kerja: 'Divisi SDM',
  deskripsi: 'Memimpin divisi sumber daya manusia',
  persyaratan: 'S1/S2 Psikologi/Manajemen, pengalaman manajemen',
  is_available: false
};

describe('getPosisiTersedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no positions exist', async () => {
    const result = await getPosisiTersedia();
    expect(result).toEqual([]);
  });

  it('should return only available positions', async () => {
    // Insert test data
    await db.insert(posisiTersediaTable)
      .values([testPosition1, testPosition2, unavailablePosition])
      .execute();

    const result = await getPosisiTersedia();

    expect(result).toHaveLength(2);
    
    // Verify only available positions are returned
    const positionNames = result.map(pos => pos.nama_posisi).sort();
    expect(positionNames).toEqual(['Manager IT', 'Staff Keuangan']);

    // Verify all returned positions have is_available = true
    result.forEach(position => {
      expect(position.is_available).toBe(true);
    });
  });

  it('should return complete position data', async () => {
    await db.insert(posisiTersediaTable)
      .values(testPosition1)
      .execute();

    const result = await getPosisiTersedia();

    expect(result).toHaveLength(1);
    const position = result[0];
    
    expect(position.nama_posisi).toBe('Manager IT');
    expect(position.unit_kerja).toBe('Divisi Teknologi Informasi');
    expect(position.deskripsi).toBe('Mengelola tim IT dan infrastruktur teknologi');
    expect(position.persyaratan).toBe('S1 Teknik Informatika, pengalaman minimal 5 tahun');
    expect(position.is_available).toBe(true);
    expect(position.id).toBeDefined();
    expect(position.created_at).toBeInstanceOf(Date);
    expect(position.updated_at).toBeInstanceOf(Date);
  });

  it('should handle positions with null optional fields', async () => {
    const minimalPosition: CreatePosisiTersediaInput = {
      nama_posisi: 'Posisi Test',
      unit_kerja: 'Unit Test',
      deskripsi: null,
      persyaratan: null,
      is_available: true
    };

    await db.insert(posisiTersediaTable)
      .values(minimalPosition)
      .execute();

    const result = await getPosisiTersedia();

    expect(result).toHaveLength(1);
    const position = result[0];
    
    expect(position.nama_posisi).toBe('Posisi Test');
    expect(position.unit_kerja).toBe('Unit Test');
    expect(position.deskripsi).toBeNull();
    expect(position.persyaratan).toBeNull();
    expect(position.is_available).toBe(true);
  });
});
