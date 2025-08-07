
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pegawaiTable, mutasiTable } from '../db/schema';
import { type UpdateMutasiStatusInput } from '../schema';
import { updateMutasiStatus } from '../handlers/update_mutasi_status';
import { eq } from 'drizzle-orm';

describe('updateMutasiStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update mutasi status to approved', async () => {
    // Create prerequisite data
    const adminUser = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hash123',
        role: 'admin',
      })
      .returning()
      .execute();

    const pegawai = await db.insert(pegawaiTable)
      .values({
        nip: 'NIP001',
        nama: 'Test Pegawai',
        email: 'pegawai@test.com',
        tanggal_lahir: new Date('1990-01-01'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS',
        jabatan_saat_ini: 'Staff',
        unit_kerja: 'IT',
        tmt_jabatan: new Date('2020-01-01'),
      })
      .returning()
      .execute();

    const mutasi = await db.insert(mutasiTable)
      .values({
        pegawai_id: pegawai[0].id,
        jabatan_baru: 'Manager',
        unit_kerja_baru: 'HR',
        tanggal_efektif: new Date('2024-01-01'),
        alasan_mutasi: 'Promosi',
        diajukan_oleh: adminUser[0].id,
      })
      .returning()
      .execute();

    const input: UpdateMutasiStatusInput = {
      id: mutasi[0].id,
      status: 'approved',
      disetujui_oleh: adminUser[0].id,
      catatan_persetujuan: 'Approved for promotion',
    };

    const result = await updateMutasiStatus(input);

    expect(result.id).toEqual(mutasi[0].id);
    expect(result.status).toEqual('approved');
    expect(result.disetujui_oleh).toEqual(adminUser[0].id);
    expect(result.tanggal_disetujui).toBeInstanceOf(Date);
    expect(result.catatan_persetujuan).toEqual('Approved for promotion');
  });

  it('should update pegawai position when mutasi is approved', async () => {
    // Create prerequisite data
    const adminUser = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hash123',
        role: 'admin',
      })
      .returning()
      .execute();

    const pegawai = await db.insert(pegawaiTable)
      .values({
        nip: 'NIP001',
        nama: 'Test Pegawai',
        email: 'pegawai@test.com',
        tanggal_lahir: new Date('1990-01-01'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS',
        jabatan_saat_ini: 'Staff',
        unit_kerja: 'IT',
        tmt_jabatan: new Date('2020-01-01'),
      })
      .returning()
      .execute();

    const mutasi = await db.insert(mutasiTable)
      .values({
        pegawai_id: pegawai[0].id,
        jabatan_baru: 'Manager',
        unit_kerja_baru: 'HR',
        tanggal_efektif: new Date('2024-01-01'),
        alasan_mutasi: 'Promosi',
        diajukan_oleh: adminUser[0].id,
      })
      .returning()
      .execute();

    const input: UpdateMutasiStatusInput = {
      id: mutasi[0].id,
      status: 'approved',
      disetujui_oleh: adminUser[0].id,
      catatan_persetujuan: 'Approved for promotion',
    };

    await updateMutasiStatus(input);

    // Check that pegawai position was updated
    const updatedPegawai = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, pegawai[0].id))
      .execute();

    expect(updatedPegawai[0].jabatan_saat_ini).toEqual('Manager');
    expect(updatedPegawai[0].unit_kerja).toEqual('HR');
    expect(updatedPegawai[0].tmt_jabatan).toBeInstanceOf(Date);
    expect(updatedPegawai[0].tmt_jabatan).toEqual(mutasi[0].tanggal_efektif);
  });

  it('should update mutasi status to rejected without updating pegawai position', async () => {
    // Create prerequisite data
    const adminUser = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hash123',
        role: 'admin',
      })
      .returning()
      .execute();

    const pegawai = await db.insert(pegawaiTable)
      .values({
        nip: 'NIP001',
        nama: 'Test Pegawai',
        email: 'pegawai@test.com',
        tanggal_lahir: new Date('1990-01-01'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS',
        jabatan_saat_ini: 'Staff',
        unit_kerja: 'IT',
        tmt_jabatan: new Date('2020-01-01'),
      })
      .returning()
      .execute();

    const originalJabatan = pegawai[0].jabatan_saat_ini;
    const originalUnitKerja = pegawai[0].unit_kerja;

    const mutasi = await db.insert(mutasiTable)
      .values({
        pegawai_id: pegawai[0].id,
        jabatan_baru: 'Manager',
        unit_kerja_baru: 'HR',
        tanggal_efektif: new Date('2024-01-01'),
        alasan_mutasi: 'Promosi',
        diajukan_oleh: adminUser[0].id,
      })
      .returning()
      .execute();

    const input: UpdateMutasiStatusInput = {
      id: mutasi[0].id,
      status: 'rejected',
      disetujui_oleh: adminUser[0].id,
      catatan_persetujuan: 'Not ready for promotion',
    };

    const result = await updateMutasiStatus(input);

    expect(result.status).toEqual('rejected');
    expect(result.catatan_persetujuan).toEqual('Not ready for promotion');

    // Check that pegawai position was NOT updated
    const updatedPegawai = await db.select()
      .from(pegawaiTable)
      .where(eq(pegawaiTable.id, pegawai[0].id))
      .execute();

    expect(updatedPegawai[0].jabatan_saat_ini).toEqual(originalJabatan);
    expect(updatedPegawai[0].unit_kerja).toEqual(originalUnitKerja);
  });

  it('should throw error for non-existent mutasi', async () => {
    const input: UpdateMutasiStatusInput = {
      id: 999,
      status: 'approved',
      disetujui_oleh: 1,
    };

    expect(updateMutasiStatus(input)).rejects.toThrow(/not found/i);
  });

  it('should handle null catatan_persetujuan', async () => {
    // Create prerequisite data
    const adminUser = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hash123',
        role: 'admin',
      })
      .returning()
      .execute();

    const pegawai = await db.insert(pegawaiTable)
      .values({
        nip: 'NIP001',
        nama: 'Test Pegawai',
        email: 'pegawai@test.com',
        tanggal_lahir: new Date('1990-01-01'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS',
      })
      .returning()
      .execute();

    const mutasi = await db.insert(mutasiTable)
      .values({
        pegawai_id: pegawai[0].id,
        jabatan_baru: 'Manager',
        unit_kerja_baru: 'HR',
        tanggal_efektif: new Date('2024-01-01'),
        diajukan_oleh: adminUser[0].id,
      })
      .returning()
      .execute();

    const input: UpdateMutasiStatusInput = {
      id: mutasi[0].id,
      status: 'approved',
      disetujui_oleh: adminUser[0].id,
      catatan_persetujuan: null,
    };

    const result = await updateMutasiStatus(input);

    expect(result.catatan_persetujuan).toBeNull();
  });
});
