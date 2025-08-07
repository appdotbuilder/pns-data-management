
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pegawaiTable } from '../db/schema';
import { getPegawaiMendekatiPensiun } from '../handlers/get_pegawai_mendekati_pensiun';

const createTestPegawai = async (overrides: Partial<any> = {}) => {
  const defaultData = {
    nip: `NIP${Date.now()}${Math.random()}`,
    nama: 'Test Pegawai',
    email: `test${Date.now()}@example.com`,
    telepon: '081234567890',
    alamat: 'Test Address',
    tanggal_lahir: new Date('1970-01-01'),
    jenis_kelamin: 'Laki-laki',
    status_kepegawaian: 'PNS',
    jabatan_saat_ini: 'Staff',
    unit_kerja: 'IT Department',
    tmt_jabatan: new Date('2000-01-01'),
    is_active: true,
    ...overrides
  };

  const result = await db.insert(pegawaiTable)
    .values(defaultData)
    .returning()
    .execute();

  return result[0];
};

describe('getPegawaiMendekatiPensiun', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no pegawai approaching retirement', async () => {
    // Create a young employee (30 years old)
    const youngBirthDate = new Date();
    youngBirthDate.setFullYear(youngBirthDate.getFullYear() - 30);
    
    await createTestPegawai({
      nip: 'YOUNG001',
      nama: 'Young Employee',
      tanggal_lahir: youngBirthDate
    });

    const result = await getPegawaiMendekatiPensiun();
    expect(result).toHaveLength(0);
  });

  it('should return pegawai who are 58 years old (approaching retirement)', async () => {
    // Create employee who is 58 years old
    const retirementAgeBirthDate = new Date();
    retirementAgeBirthDate.setFullYear(retirementAgeBirthDate.getFullYear() - 58);
    
    const pegawai = await createTestPegawai({
      nip: 'RETIRE001',
      nama: 'Approaching Retirement Employee',
      tanggal_lahir: retirementAgeBirthDate
    });

    const result = await getPegawaiMendekatiPensiun();
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(pegawai.id);
    expect(result[0].nama).toEqual('Approaching Retirement Employee');
    expect(result[0].nip).toEqual('RETIRE001');
  });

  it('should return pegawai who are 60 years old (retirement age)', async () => {
    // Create employee who is exactly 60 years old
    const retirementAgeBirthDate = new Date();
    retirementAgeBirthDate.setFullYear(retirementAgeBirthDate.getFullYear() - 60);
    
    const pegawai = await createTestPegawai({
      nip: 'RETIRE002',
      nama: 'Retirement Age Employee',
      tanggal_lahir: retirementAgeBirthDate
    });

    const result = await getPegawaiMendekatiPensiun();
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(pegawai.id);
    expect(result[0].nama).toEqual('Retirement Age Employee');
  });

  it('should not return inactive pegawai approaching retirement', async () => {
    // Create inactive employee approaching retirement
    const retirementAgeBirthDate = new Date();
    retirementAgeBirthDate.setFullYear(retirementAgeBirthDate.getFullYear() - 59);
    
    await createTestPegawai({
      nip: 'INACTIVE001',
      nama: 'Inactive Retirement Employee',
      tanggal_lahir: retirementAgeBirthDate,
      is_active: false
    });

    const result = await getPegawaiMendekatiPensiun();
    expect(result).toHaveLength(0);
  });

  it('should not return pegawai over retirement age (61+ years old)', async () => {
    // Create employee who is 65 years old (past retirement)
    const pastRetirementBirthDate = new Date();
    pastRetirementBirthDate.setFullYear(pastRetirementBirthDate.getFullYear() - 65);
    
    await createTestPegawai({
      nip: 'OLD001',
      nama: 'Past Retirement Employee',
      tanggal_lahir: pastRetirementBirthDate
    });

    const result = await getPegawaiMendekatiPensiun();
    expect(result).toHaveLength(0);
  });

  it('should return multiple pegawai in retirement age range', async () => {
    // Create multiple employees in retirement age range
    const birthDate56 = new Date();
    birthDate56.setFullYear(birthDate56.getFullYear() - 56);
    
    const birthDate59 = new Date();
    birthDate59.setFullYear(birthDate59.getFullYear() - 59);
    
    await createTestPegawai({
      nip: 'MULTI001',
      nama: 'Employee 56',
      tanggal_lahir: birthDate56
    });

    await createTestPegawai({
      nip: 'MULTI002', 
      nama: 'Employee 59',
      tanggal_lahir: birthDate59
    });

    const result = await getPegawaiMendekatiPensiun();
    expect(result).toHaveLength(2);
    
    const names = result.map(p => p.nama);
    expect(names).toContain('Employee 56');
    expect(names).toContain('Employee 59');
  });

  it('should verify date fields are properly returned', async () => {
    const retirementAgeBirthDate = new Date();
    retirementAgeBirthDate.setFullYear(retirementAgeBirthDate.getFullYear() - 58);
    
    await createTestPegawai({
      nip: 'DATE001',
      nama: 'Date Test Employee',
      tanggal_lahir: retirementAgeBirthDate
    });

    const result = await getPegawaiMendekatiPensiun();
    expect(result).toHaveLength(1);
    expect(result[0].tanggal_lahir).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});
