
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pegawaiTable } from '../db/schema';
import { login, getCurrentUser, createPasswordHash, type LoginInput } from '../handlers/auth';

describe('Auth Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('login', () => {
    it('should login with valid credentials', async () => {
      // Create test user
      const hashedPassword = createPasswordHash('password123');
      await db.insert(usersTable).values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        role: 'admin'
      }).execute();

      const loginInput: LoginInput = {
        username: 'testuser',
        password: 'password123'
      };

      const result = await login(loginInput);

      // Verify response structure
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');

      // Verify user data
      expect(result.user.username).toEqual('testuser');
      expect(result.user.email).toEqual('test@example.com');
      expect(result.user.role).toEqual('admin');
      expect(result.user.id).toBeDefined();
      expect(result.user.created_at).toBeInstanceOf(Date);

      // Verify token format (should have 3 parts separated by dots)
      const tokenParts = result.token.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    it('should reject invalid username', async () => {
      // Create test user
      const hashedPassword = createPasswordHash('password123');
      await db.insert(usersTable).values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        role: 'user'
      }).execute();

      const loginInput: LoginInput = {
        username: 'nonexistent',
        password: 'password123'
      };

      await expect(login(loginInput)).rejects.toThrow(/invalid credentials/i);
    });

    it('should reject invalid password', async () => {
      // Create test user
      const hashedPassword = createPasswordHash('password123');
      await db.insert(usersTable).values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        role: 'user'
      }).execute();

      const loginInput: LoginInput = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      await expect(login(loginInput)).rejects.toThrow(/invalid credentials/i);
    });

    it('should handle user with pegawai_id', async () => {
      // First create a pegawai record to satisfy foreign key constraint
      const pegawaiResult = await db.insert(pegawaiTable).values({
        nip: '123456789',
        nama: 'Test Pegawai',
        email: 'pegawai@example.com',
        tanggal_lahir: new Date('1980-01-01'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS'
      }).returning().execute();

      const pegawaiId = pegawaiResult[0].id;

      // Create test user with pegawai_id
      const hashedPassword = createPasswordHash('password123');
      await db.insert(usersTable).values({
        username: 'pegawaiuser',
        email: 'pegawaiuser@example.com',
        password_hash: hashedPassword,
        role: 'user',
        pegawai_id: pegawaiId
      }).execute();

      const loginInput: LoginInput = {
        username: 'pegawaiuser',
        password: 'password123'
      };

      const result = await login(loginInput);

      expect(result.user.pegawai_id).toEqual(pegawaiId);
      expect(result.user.role).toEqual('user');
    });

    it('should handle legacy password hash format', async () => {
      // Create test user with simple hash (no salt)
      const crypto = require('crypto');
      const simpleHash = crypto.createHash('sha256').update('password123').digest('hex');
      
      await db.insert(usersTable).values({
        username: 'legacyuser',
        email: 'legacy@example.com',
        password_hash: simpleHash,
        role: 'user'
      }).execute();

      const loginInput: LoginInput = {
        username: 'legacyuser',
        password: 'password123'
      };

      const result = await login(loginInput);

      expect(result.user.username).toEqual('legacyuser');
      expect(result.token).toBeDefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user by id', async () => {
      // Create test user
      const hashedPassword = createPasswordHash('password123');
      const insertResult = await db.insert(usersTable).values({
        username: 'currentuser',
        email: 'current@example.com',
        password_hash: hashedPassword,
        role: 'admin'
      }).returning().execute();

      const userId = insertResult[0].id;
      const result = await getCurrentUser(userId);

      expect(result.id).toEqual(userId);
      expect(result.username).toEqual('currentuser');
      expect(result.email).toEqual('current@example.com');
      expect(result.role).toEqual('admin');
      expect(result.password_hash).toEqual(hashedPassword);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent user', async () => {
      await expect(getCurrentUser(999)).rejects.toThrow(/user not found/i);
    });

    it('should return user with pegawai_id', async () => {
      // First create a pegawai record to satisfy foreign key constraint
      const pegawaiResult = await db.insert(pegawaiTable).values({
        nip: '987654321',
        nama: 'Test Pegawai 2',
        email: 'pegawai2@example.com',
        tanggal_lahir: new Date('1985-01-01'),
        jenis_kelamin: 'Perempuan',
        status_kepegawaian: 'PNS'
      }).returning().execute();

      const pegawaiId = pegawaiResult[0].id;

      // Create test user with pegawai_id
      const hashedPassword = createPasswordHash('password123');
      const insertResult = await db.insert(usersTable).values({
        username: 'pegawaiuser2',
        email: 'pegawai2user@example.com',
        password_hash: hashedPassword,
        role: 'user',
        pegawai_id: pegawaiId
      }).returning().execute();

      const userId = insertResult[0].id;
      const result = await getCurrentUser(userId);

      expect(result.pegawai_id).toEqual(pegawaiId);
      expect(result.role).toEqual('user');
    });
  });

  describe('createPasswordHash', () => {
    it('should create hash with salt format', () => {
      const hash = createPasswordHash('testpassword');
      
      expect(hash).toContain(':');
      const parts = hash.split(':');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toHaveLength(64); // SHA-256 hex length
      expect(parts[1]).toHaveLength(32); // 16 bytes salt as hex
    });

    it('should create different hashes for same password', () => {
      const hash1 = createPasswordHash('samepassword');
      const hash2 = createPasswordHash('samepassword');
      
      expect(hash1).not.toEqual(hash2); // Different due to random salt
    });
  });
});
