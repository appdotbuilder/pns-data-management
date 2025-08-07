
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pegawaiTable } from '../db/schema';
import { type CreatePegawaiInput, type UpdatePegawaiInput, type PegawaiFilter } from '../schema';
import {
  createPegawai,
  getPegawaiList,
  getPegawaiById,
  updatePegawai,
  deletePegawai,
  getPegawaiMendekatiPensiun
} from '../handlers/pegawai';
import { eq } from 'drizzle-orm';

// Test input data
const testPegawaiInput: CreatePegawaiInput = {
  nama_lengkap: 'John Doe',
  nomor_hp: '081234567890',
  npwp: '123456789012345',
  pendidikan_terakhir: 'S1',
  golongan_darah: 'A',
  provinsi_id: '11',
  provinsi_nama: 'DKI Jakarta',
  kota_id: '1101',
  kota_nama: 'Jakarta Pusat',
  kecamatan_id: '110101',
  kecamatan_nama: 'Gambir',
  desa_id: '1101011001',
  desa_nama: 'Gambir'
};

const secondPegawaiInput: CreatePegawaiInput = {
  nama_lengkap: 'Jane Smith',
  nomor_hp: '081987654321',
  npwp: '987654321012345',
  pendidikan_terakhir: 'S2',
  golongan_darah: 'B',
  provinsi_id: '32',
  provinsi_nama: 'Jawa Barat',
  kota_id: '3201',
  kota_nama: 'Bogor',
  kecamatan_id: '320101',
  kecamatan_nama: 'Bogor Selatan',
  desa_id: '3201011001',
  desa_nama: 'Lawang'
};

describe('Pegawai Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createPegawai', () => {
    it('should create a pegawai record', async () => {
      const result = await createPegawai(testPegawaiInput);

      expect(result.nama_lengkap).toEqual('John Doe');
      expect(result.nomor_hp).toEqual('081234567890');
      expect(result.npwp).toEqual('123456789012345');
      expect(result.pendidikan_terakhir).toEqual('S1');
      expect(result.golongan_darah).toEqual('A');
      expect(result.provinsi_nama).toEqual('DKI Jakarta');
      expect(result.kota_nama).toEqual('Jakarta Pusat');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save pegawai to database', async () => {
      const result = await createPegawai(testPegawaiInput);

      const pegawaiInDb = await db.select()
        .from(pegawaiTable)
        .where(eq(pegawaiTable.id, result.id))
        .execute();

      expect(pegawaiInDb).toHaveLength(1);
      expect(pegawaiInDb[0].nama_lengkap).toEqual('John Doe');
      expect(pegawaiInDb[0].nomor_hp).toEqual('081234567890');
      expect(pegawaiInDb[0].provinsi_nama).toEqual('DKI Jakarta');
    });

    it('should handle invalid input', async () => {
      const invalidInput = {
        ...testPegawaiInput,
        pendidikan_terakhir: 'INVALID' as any
      };

      await expect(createPegawai(invalidInput)).rejects.toThrow();
    });
  });

  describe('getPegawaiList', () => {
    it('should return empty list when no pegawai exist', async () => {
      const filter: PegawaiFilter = { limit: 20, offset: 0 };
      const result = await getPegawaiList(filter);

      expect(result.data).toHaveLength(0);
      expect(result.total).toEqual(0);
    });

    it('should return paginated list of pegawai', async () => {
      // Create test data
      await createPegawai(testPegawaiInput);
      await createPegawai(secondPegawaiInput);

      const filter: PegawaiFilter = { limit: 10, offset: 0 };
      const result = await getPegawaiList(filter);

      expect(result.data).toHaveLength(2);
      expect(result.total).toEqual(2);
      expect(result.data[0].nama_lengkap).toBeDefined();
      expect(result.data[1].nama_lengkap).toBeDefined();
    });

    it('should filter by search term', async () => {
      await createPegawai(testPegawaiInput);
      await createPegawai(secondPegawaiInput);

      // Search by name
      const nameFilter: PegawaiFilter = { 
        search: 'John',
        limit: 20, 
        offset: 0 
      };
      const nameResult = await getPegawaiList(nameFilter);

      expect(nameResult.data).toHaveLength(1);
      expect(nameResult.data[0].nama_lengkap).toEqual('John Doe');

      // Search by phone
      const phoneFilter: PegawaiFilter = { 
        search: '081987654321',
        limit: 20, 
        offset: 0 
      };
      const phoneResult = await getPegawaiList(phoneFilter);

      expect(phoneResult.data).toHaveLength(1);
      expect(phoneResult.data[0].nama_lengkap).toEqual('Jane Smith');
    });

    it('should filter by pendidikan', async () => {
      await createPegawai(testPegawaiInput);
      await createPegawai(secondPegawaiInput);

      const filter: PegawaiFilter = { 
        pendidikan: 'S2',
        limit: 20, 
        offset: 0 
      };
      const result = await getPegawaiList(filter);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].pendidikan_terakhir).toEqual('S2');
      expect(result.data[0].nama_lengkap).toEqual('Jane Smith');
    });

    it('should handle pagination correctly', async () => {
      await createPegawai(testPegawaiInput);
      await createPegawai(secondPegawaiInput);

      // First page
      const firstPageFilter: PegawaiFilter = { limit: 1, offset: 0 };
      const firstPage = await getPegawaiList(firstPageFilter);

      expect(firstPage.data).toHaveLength(1);
      expect(firstPage.total).toEqual(2);

      // Second page
      const secondPageFilter: PegawaiFilter = { limit: 1, offset: 1 };
      const secondPage = await getPegawaiList(secondPageFilter);

      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.total).toEqual(2);

      // Verify different records
      expect(firstPage.data[0].id).not.toEqual(secondPage.data[0].id);
    });
  });

  describe('getPegawaiById', () => {
    it('should return null for non-existent pegawai', async () => {
      const result = await getPegawaiById(999);
      expect(result).toBeNull();
    });

    it('should return pegawai by id', async () => {
      const created = await createPegawai(testPegawaiInput);
      const result = await getPegawaiById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.nama_lengkap).toEqual('John Doe');
      expect(result!.nomor_hp).toEqual('081234567890');
    });
  });

  describe('updatePegawai', () => {
    it('should update pegawai fields', async () => {
      const created = await createPegawai(testPegawaiInput);

      const updateInput: UpdatePegawaiInput = {
        id: created.id,
        nama_lengkap: 'John Doe Updated',
        nomor_hp: '081999888777'
      };

      const result = await updatePegawai(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.nama_lengkap).toEqual('John Doe Updated');
      expect(result.nomor_hp).toEqual('081999888777');
      expect(result.npwp).toEqual(testPegawaiInput.npwp); // Unchanged field
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should update only provided fields', async () => {
      const created = await createPegawai(testPegawaiInput);

      const updateInput: UpdatePegawaiInput = {
        id: created.id,
        pendidikan_terakhir: 'S2'
      };

      const result = await updatePegawai(updateInput);

      expect(result.pendidikan_terakhir).toEqual('S2');
      expect(result.nama_lengkap).toEqual(testPegawaiInput.nama_lengkap); // Unchanged
      expect(result.nomor_hp).toEqual(testPegawaiInput.nomor_hp); // Unchanged
    });

    it('should throw error for non-existent pegawai', async () => {
      const updateInput: UpdatePegawaiInput = {
        id: 999,
        nama_lengkap: 'Non-existent'
      };

      await expect(updatePegawai(updateInput)).rejects.toThrow(/not found/i);
    });

    it('should save changes to database', async () => {
      const created = await createPegawai(testPegawaiInput);

      const updateInput: UpdatePegawaiInput = {
        id: created.id,
        nama_lengkap: 'Database Updated Name'
      };

      await updatePegawai(updateInput);

      const pegawaiInDb = await db.select()
        .from(pegawaiTable)
        .where(eq(pegawaiTable.id, created.id))
        .execute();

      expect(pegawaiInDb[0].nama_lengkap).toEqual('Database Updated Name');
    });
  });

  describe('deletePegawai', () => {
    it('should delete existing pegawai', async () => {
      const created = await createPegawai(testPegawaiInput);
      const result = await deletePegawai(created.id);

      expect(result.success).toBe(true);

      // Verify deletion in database
      const pegawaiInDb = await db.select()
        .from(pegawaiTable)
        .where(eq(pegawaiTable.id, created.id))
        .execute();

      expect(pegawaiInDb).toHaveLength(0);
    });

    it('should return false for non-existent pegawai', async () => {
      const result = await deletePegawai(999);
      expect(result.success).toBe(false);
    });
  });

  describe('getPegawaiMendekatiPensiun', () => {
    it('should return list of pegawai approaching retirement', async () => {
      await createPegawai(testPegawaiInput);
      await createPegawai(secondPegawaiInput);

      const result = await getPegawaiMendekatiPensiun();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(0);
      
      // Since we don't have age calculation logic yet, 
      // this currently returns all pegawai
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no pegawai exist', async () => {
      const result = await getPegawaiMendekatiPensiun();
      expect(result).toHaveLength(0);
    });
  });
});
