
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pegawaiTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login, getCurrentUser, createUser } from '../handlers/auth';
import { eq } from 'drizzle-orm';

const testLoginInput: LoginInput = {
  username: 'testuser',
  password: 'testpassword123'
};

const adminLoginInput: LoginInput = {
  username: 'admin',
  password: 'admin123'
};

describe('auth handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('login', () => {
    it('should authenticate valid user credentials', async () => {
      // Create test user
      const user = await createUser('testuser', 'testpassword123', 'admin');

      const result = await login(testLoginInput);

      expect(result.user.id).toEqual(user.id);
      expect(result.user.username).toEqual('testuser');
      expect(result.user.role).toEqual('admin');
      expect(result.user.pegawai_id).toBeNull();
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);

      // Ensure password is not included in response
      expect(result.user).not.toHaveProperty('password');
    });

    it('should authenticate pegawai user with pegawai_id', async () => {
      // Create pegawai first
      const pegawai = await db.insert(pegawaiTable)
        .values({
          nama_lengkap: 'John Doe',
          nomor_hp: '08123456789',
          npwp: '123456789012345',
          pendidikan_terakhir: 'S1',
          golongan_darah: 'A',
          provinsi_id: '32',
          provinsi_nama: 'Jawa Barat',
          kota_id: '3201',
          kota_nama: 'Bogor',
          kecamatan_id: '3201010',
          kecamatan_nama: 'Bogor Selatan',
          desa_id: '3201010001',
          desa_nama: 'Mulyaharja'
        })
        .returning()
        .execute();

      // Create user linked to pegawai
      const user = await createUser('pegawai1', 'pegawai123', 'pegawai', pegawai[0].id);

      const result = await login({
        username: 'pegawai1',
        password: 'pegawai123'
      });

      expect(result.user.id).toEqual(user.id);
      expect(result.user.username).toEqual('pegawai1');
      expect(result.user.role).toEqual('pegawai');
      expect(result.user.pegawai_id).toEqual(pegawai[0].id);
      expect(result.token).toBeDefined();
    });

    it('should reject invalid username', async () => {
      // Create test user
      await createUser('testuser', 'testpassword123', 'admin');

      await expect(login({
        username: 'wronguser',
        password: 'testpassword123'
      })).rejects.toThrow(/invalid username or password/i);
    });

    it('should reject invalid password', async () => {
      // Create test user
      await createUser('testuser', 'testpassword123', 'admin');

      await expect(login({
        username: 'testuser',
        password: 'wrongpassword'
      })).rejects.toThrow(/invalid username or password/i);
    });

    it('should save user to database with hashed password', async () => {
      const user = await createUser('testuser', 'testpassword123', 'admin');

      // Query user from database
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toEqual('testuser');
      expect(users[0].role).toEqual('admin');
      
      // Password should be hashed, not plain text
      expect(users[0].password).not.toEqual('testpassword123');
      expect(users[0].password.length).toBeGreaterThan(20); // Hashed passwords are longer
      expect(users[0].created_at).toBeInstanceOf(Date);
      expect(users[0].updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user by ID', async () => {
      const user = await createUser('testuser', 'testpassword123', 'admin');

      const result = await getCurrentUser(user.id);

      expect(result.id).toEqual(user.id);
      expect(result.username).toEqual('testuser');
      expect(result.role).toEqual('admin');
      expect(result.pegawai_id).toBeNull();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      
      // Password should be included in this response (for completeness)
      expect(result.password).toBeDefined();
    });

    it('should return pegawai user with pegawai_id', async () => {
      // Create pegawai first
      const pegawai = await db.insert(pegawaiTable)
        .values({
          nama_lengkap: 'Jane Doe',
          nomor_hp: '08123456789',
          npwp: '123456789012345',
          pendidikan_terakhir: 'S2',
          golongan_darah: 'B',
          provinsi_id: '32',
          provinsi_nama: 'Jawa Barat',
          kota_id: '3201',
          kota_nama: 'Bogor',
          kecamatan_id: '3201010',
          kecamatan_nama: 'Bogor Selatan',
          desa_id: '3201010001',
          desa_nama: 'Mulyaharja'
        })
        .returning()
        .execute();

      const user = await createUser('pegawai2', 'pegawai123', 'pegawai', pegawai[0].id);

      const result = await getCurrentUser(user.id);

      expect(result.id).toEqual(user.id);
      expect(result.username).toEqual('pegawai2');
      expect(result.role).toEqual('pegawai');
      expect(result.pegawai_id).toEqual(pegawai[0].id);
    });

    it('should throw error for non-existent user', async () => {
      await expect(getCurrentUser(999)).rejects.toThrow(/user not found/i);
    });

    it('should verify user exists in database', async () => {
      const user = await createUser('testuser', 'testpassword123', 'admin');

      // Verify user was actually created in database
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toEqual('testuser');

      // Now test getCurrentUser
      const result = await getCurrentUser(user.id);
      expect(result.id).toEqual(user.id);
    });
  });

  describe('createUser helper', () => {
    it('should create admin user', async () => {
      const user = await createUser('admin', 'admin123', 'admin');

      expect(user.username).toEqual('admin');
      expect(user.role).toEqual('admin');
      expect(user.pegawai_id).toBeNull();
      expect(user.id).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
    });

    it('should create pegawai user', async () => {
      // Create pegawai first
      const pegawai = await db.insert(pegawaiTable)
        .values({
          nama_lengkap: 'Test Employee',
          nomor_hp: '08123456789',
          npwp: '123456789012345',
          pendidikan_terakhir: 'S1',
          golongan_darah: 'AB',
          provinsi_id: '32',
          provinsi_nama: 'Jawa Barat',
          kota_id: '3201',
          kota_nama: 'Bogor',
          kecamatan_id: '3201010',
          kecamatan_nama: 'Bogor Selatan',
          desa_id: '3201010001',
          desa_nama: 'Mulyaharja'
        })
        .returning()
        .execute();

      const user = await createUser('employee1', 'emp123', 'pegawai', pegawai[0].id);

      expect(user.username).toEqual('employee1');
      expect(user.role).toEqual('pegawai');
      expect(user.pegawai_id).toEqual(pegawai[0].id);
    });

    it('should enforce unique username constraint', async () => {
      await createUser('duplicate', 'pass123', 'admin');

      await expect(
        createUser('duplicate', 'pass456', 'admin')
      ).rejects.toThrow();
    });
  });
});
