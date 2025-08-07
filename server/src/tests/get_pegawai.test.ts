
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pegawaiTable } from '../db/schema';
import { getPegawai } from '../handlers/get_pegawai';

// Test data
const testPegawai1 = {
  nip: '12345678901234567890',
  nama: 'John Doe',
  email: 'john.doe@example.com',
  telepon: '081234567890',
  alamat: 'Jl. Test No. 1',
  tanggal_lahir: new Date('1985-01-01'),
  jenis_kelamin: 'Laki-laki',
  status_kepegawaian: 'PNS',
  jabatan_saat_ini: 'Staff',
  unit_kerja: 'IT Department',
  tmt_jabatan: new Date('2020-01-01'),
  is_active: true
};

const testPegawai2 = {
  nip: '09876543210987654321',
  nama: 'Jane Smith',
  email: 'jane.smith@example.com',
  telepon: '081987654321',
  alamat: 'Jl. Test No. 2',
  tanggal_lahir: new Date('1990-05-15'),
  jenis_kelamin: 'Perempuan',
  status_kepegawaian: 'CPNS',
  jabatan_saat_ini: 'Supervisor',
  unit_kerja: 'HR Department',
  tmt_jabatan: new Date('2022-03-01'),
  is_active: true
};

const inactivePegawai = {
  nip: '11111111111111111111',
  nama: 'Inactive Employee',
  email: 'inactive@example.com',
  telepon: '081111111111',
  alamat: 'Jl. Inactive',
  tanggal_lahir: new Date('1980-12-31'),
  jenis_kelamin: 'Laki-laki',
  status_kepegawaian: 'PNS',
  jabatan_saat_ini: 'Former Staff',
  unit_kerja: 'Former Department',
  tmt_jabatan: new Date('2015-01-01'),
  is_active: false
};

describe('getPegawai', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all active pegawai', async () => {
    // Insert test data
    await db.insert(pegawaiTable).values([testPegawai1, testPegawai2, inactivePegawai]).execute();

    const result = await getPegawai();

    // Should only return active pegawai (2 out of 3)
    expect(result).toHaveLength(2);
    
    // Verify all returned pegawai are active
    result.forEach(pegawai => {
      expect(pegawai.is_active).toBe(true);
    });

    // Verify specific data
    const johnDoe = result.find(p => p.nip === '12345678901234567890');
    const janeSmith = result.find(p => p.nip === '09876543210987654321');
    
    expect(johnDoe).toBeDefined();
    expect(johnDoe?.nama).toEqual('John Doe');
    expect(johnDoe?.email).toEqual('john.doe@example.com');
    expect(johnDoe?.jabatan_saat_ini).toEqual('Staff');
    expect(johnDoe?.unit_kerja).toEqual('IT Department');

    expect(janeSmith).toBeDefined();
    expect(janeSmith?.nama).toEqual('Jane Smith');
    expect(janeSmith?.email).toEqual('jane.smith@example.com');
    expect(janeSmith?.jabatan_saat_ini).toEqual('Supervisor');
    expect(janeSmith?.unit_kerja).toEqual('HR Department');
  });

  it('should return empty array when no active pegawai exist', async () => {
    // Insert only inactive pegawai
    await db.insert(pegawaiTable).values([inactivePegawai]).execute();

    const result = await getPegawai();

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no pegawai exist', async () => {
    const result = await getPegawai();

    expect(result).toHaveLength(0);
  });

  it('should include all required pegawai fields', async () => {
    await db.insert(pegawaiTable).values([testPegawai1]).execute();

    const result = await getPegawai();

    expect(result).toHaveLength(1);
    const pegawai = result[0];

    // Verify all required fields are present
    expect(pegawai.id).toBeDefined();
    expect(typeof pegawai.id).toBe('number');
    expect(pegawai.nip).toBeDefined();
    expect(pegawai.nama).toBeDefined();
    expect(pegawai.email).toBeDefined();
    expect(pegawai.tanggal_lahir).toBeInstanceOf(Date);
    expect(pegawai.jenis_kelamin).toBeDefined();
    expect(pegawai.status_kepegawaian).toBeDefined();
    expect(pegawai.is_active).toBe(true);
    expect(pegawai.created_at).toBeInstanceOf(Date);
    expect(pegawai.updated_at).toBeInstanceOf(Date);

    // Verify optional fields can be null
    expect([null, undefined, 'string'].some(type => typeof pegawai.telepon === type || pegawai.telepon === null)).toBe(true);
    expect([null, undefined, 'string'].some(type => typeof pegawai.alamat === type || pegawai.alamat === null)).toBe(true);
    expect([null, undefined, 'string'].some(type => typeof pegawai.jabatan_saat_ini === type || pegawai.jabatan_saat_ini === null)).toBe(true);
    expect([null, undefined, 'string'].some(type => typeof pegawai.unit_kerja === type || pegawai.unit_kerja === null)).toBe(true);
  });

  it('should handle multiple active pegawai with different data', async () => {
    // Create pegawai with varied data
    const pegawai3 = {
      nip: '33333333333333333333',
      nama: 'Ahmad Rahman',
      email: 'ahmad.rahman@example.com',
      telepon: null, // No phone
      alamat: null, // No address
      tanggal_lahir: new Date('1975-08-20'),
      jenis_kelamin: 'Laki-laki',
      status_kepegawaian: 'Honorer',
      jabatan_saat_ini: null, // No current position
      unit_kerja: null, // No unit
      tmt_jabatan: null, // No TMT
      is_active: true
    };

    await db.insert(pegawaiTable).values([testPegawai1, testPegawai2, pegawai3]).execute();

    const result = await getPegawai();

    expect(result).toHaveLength(3);
    
    // Find Ahmad Rahman and verify nullable fields
    const ahmad = result.find(p => p.nama === 'Ahmad Rahman');
    expect(ahmad).toBeDefined();
    expect(ahmad?.telepon).toBeNull();
    expect(ahmad?.alamat).toBeNull();
    expect(ahmad?.jabatan_saat_ini).toBeNull();
    expect(ahmad?.unit_kerja).toBeNull();
    expect(ahmad?.tmt_jabatan).toBeNull();
    expect(ahmad?.is_active).toBe(true);
  });
});
