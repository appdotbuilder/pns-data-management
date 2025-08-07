
import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { getProvinsi, getKotaByProvinsi, getKecamatanByKota, getDesaByKecamatan } from '../handlers/wilayah';

// Mock server setup for testing
let mockServer: any;
const originalFetch = globalThis.fetch;

beforeAll(async () => {
  // Create a mock server to simulate wilayah.id API responses
  mockServer = Bun.serve({
    port: 3001,
    async fetch(request) {
      const url = new URL(request.url);
      const path = url.pathname;

      // Mock responses based on API endpoints
      if (path === '/api/provinces.json') {
        return new Response(JSON.stringify([
          { code: '11', name: 'DKI Jakarta' },
          { code: '32', name: 'Jawa Barat' },
          { code: '33', name: 'Jawa Tengah' }
        ]), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/regencies/11.json') {
        return new Response(JSON.stringify([
          { code: '1101', name: 'Jakarta Pusat' },
          { code: '1102', name: 'Jakarta Utara' },
          { code: '1103', name: 'Jakarta Barat' }
        ]), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/districts/1101.json') {
        return new Response(JSON.stringify([
          { code: '110101', name: 'Gambir' },
          { code: '110102', name: 'Sawah Besar' },
          { code: '110103', name: 'Kemayoran' }
        ]), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/villages/110101.json') {
        return new Response(JSON.stringify([
          { code: '1101011001', name: 'Gambir' },
          { code: '1101011002', name: 'Kebon Kelapa' },
          { code: '1101011003', name: 'Petojo Utara' }
        ]), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Return 404 for unknown endpoints
      return new Response('Not Found', { status: 404 });
    }
  });

  // Override fetch to use our mock server, preserving the original fetch properties
  const mockFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    let url: string;
    
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = input.url;
    }

    // Replace the real API URL with our mock server
    const mockUrl = url.replace('https://wilayah.id', 'http://localhost:3001');
    
    return await originalFetch(mockUrl, init);
  };

  // Preserve the preconnect method from the original fetch
  (mockFetch as any).preconnect = originalFetch.preconnect;
  
  globalThis.fetch = mockFetch as typeof fetch;
});

afterAll(async () => {
  // Restore original fetch
  globalThis.fetch = originalFetch;
  
  if (mockServer) {
    mockServer.stop();
  }
});

describe('getProvinsi', () => {
  it('should fetch all provinces', async () => {
    const result = await getProvinsi();
    
    expect(result).toBeArrayOfSize(3);
    expect(result[0]).toEqual({ id: '11', name: 'DKI Jakarta' });
    expect(result[1]).toEqual({ id: '32', name: 'Jawa Barat' });
    expect(result[2]).toEqual({ id: '33', name: 'Jawa Tengah' });
  });

  it('should return array of WilayahItem objects', async () => {
    const result = await getProvinsi();
    
    result.forEach(province => {
      expect(province).toHaveProperty('id');
      expect(province).toHaveProperty('name');
      expect(typeof province.id).toBe('string');
      expect(typeof province.name).toBe('string');
    });
  });
});

describe('getKotaByProvinsi', () => {
  it('should fetch cities by province ID', async () => {
    const result = await getKotaByProvinsi('11');
    
    expect(result).toBeArrayOfSize(3);
    expect(result[0]).toEqual({ id: '1101', name: 'Jakarta Pusat' });
    expect(result[1]).toEqual({ id: '1102', name: 'Jakarta Utara' });
    expect(result[2]).toEqual({ id: '1103', name: 'Jakarta Barat' });
  });

  it('should throw error for empty province ID', async () => {
    await expect(getKotaByProvinsi('')).rejects.toThrow(/province id is required/i);
    await expect(getKotaByProvinsi('   ')).rejects.toThrow(/province id is required/i);
  });

  it('should throw error for missing province ID', async () => {
    await expect(getKotaByProvinsi(null as any)).rejects.toThrow(/province id is required/i);
    await expect(getKotaByProvinsi(undefined as any)).rejects.toThrow(/province id is required/i);
  });
});

describe('getKecamatanByKota', () => {
  it('should fetch districts by city ID', async () => {
    const result = await getKecamatanByKota('1101');
    
    expect(result).toBeArrayOfSize(3);
    expect(result[0]).toEqual({ id: '110101', name: 'Gambir' });
    expect(result[1]).toEqual({ id: '110102', name: 'Sawah Besar' });
    expect(result[2]).toEqual({ id: '110103', name: 'Kemayoran' });
  });

  it('should throw error for empty city ID', async () => {
    await expect(getKecamatanByKota('')).rejects.toThrow(/city id is required/i);
    await expect(getKecamatanByKota('   ')).rejects.toThrow(/city id is required/i);
  });

  it('should throw error for missing city ID', async () => {
    await expect(getKecamatanByKota(null as any)).rejects.toThrow(/city id is required/i);
    await expect(getKecamatanByKota(undefined as any)).rejects.toThrow(/city id is required/i);
  });
});

describe('getDesaByKecamatan', () => {
  it('should fetch villages by district ID', async () => {
    const result = await getDesaByKecamatan('110101');
    
    expect(result).toBeArrayOfSize(3);
    expect(result[0]).toEqual({ id: '1101011001', name: 'Gambir' });
    expect(result[1]).toEqual({ id: '1101011002', name: 'Kebon Kelapa' });
    expect(result[2]).toEqual({ id: '1101011003', name: 'Petojo Utara' });
  });

  it('should throw error for empty district ID', async () => {
    await expect(getDesaByKecamatan('')).rejects.toThrow(/district id is required/i);
    await expect(getDesaByKecamatan('   ')).rejects.toThrow(/district id is required/i);
  });

  it('should throw error for missing district ID', async () => {
    await expect(getDesaByKecamatan(null as any)).rejects.toThrow(/district id is required/i);
    await expect(getDesaByKecamatan(undefined as any)).rejects.toThrow(/district id is required/i);
  });
});

describe('API Integration', () => {
  it('should handle hierarchical data flow correctly', async () => {
    // Test the full hierarchy: Province -> City -> District -> Village
    const provinces = await getProvinsi();
    expect(provinces.length).toBeGreaterThan(0);
    
    const cities = await getKotaByProvinsi(provinces[0].id);
    expect(cities.length).toBeGreaterThan(0);
    
    const districts = await getKecamatanByKota(cities[0].id);
    expect(districts.length).toBeGreaterThan(0);
    
    const villages = await getDesaByKecamatan(districts[0].id);
    expect(villages.length).toBeGreaterThan(0);
  });

  it('should maintain consistent data structure across all levels', async () => {
    const provinces = await getProvinsi();
    const cities = await getKotaByProvinsi('11');
    const districts = await getKecamatanByKota('1101');
    const villages = await getDesaByKecamatan('110101');
    
    const allItems = [...provinces, ...cities, ...districts, ...villages];
    
    allItems.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(typeof item.id).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.name.length).toBeGreaterThan(0);
    });
  });
});
