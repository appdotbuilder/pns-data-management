
import { type WilayahItem } from '../schema';

interface WilayahApiResponse {
  data: Array<{
    code: string | number;
    name: string;
  }>;
}

export async function getProvinsi(): Promise<WilayahItem[]> {
  try {
    const response = await fetch('https://wilayah.id/api/provinces.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch provinces: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as WilayahApiResponse;
    
    // Validate and transform the response data
    if (!Array.isArray(data.data)) {
      throw new Error('Invalid response format: expected data array');
    }

    return data.data.map((item) => ({
      id: String(item.code),
      name: item.name
    }));
  } catch (error) {
    console.error('Failed to fetch provinces:', error);
    throw error;
  }
}

export async function getKotaByProvinsi(provinsiId: string): Promise<WilayahItem[]> {
  try {
    const response = await fetch(`https://wilayah.id/api/regencies/${provinsiId}.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch cities for province ${provinsiId}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as WilayahApiResponse;
    
    // Validate and transform the response data
    if (!Array.isArray(data.data)) {
      throw new Error('Invalid response format: expected data array');
    }

    return data.data.map((item) => ({
      id: String(item.code),
      name: item.name
    }));
  } catch (error) {
    console.error(`Failed to fetch cities for province ${provinsiId}:`, error);
    throw error;
  }
}

export async function getKecamatanByKota(kotaId: string): Promise<WilayahItem[]> {
  try {
    const response = await fetch(`https://wilayah.id/api/districts/${kotaId}.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch districts for city ${kotaId}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as WilayahApiResponse;
    
    // Validate and transform the response data
    if (!Array.isArray(data.data)) {
      throw new Error('Invalid response format: expected data array');
    }

    return data.data.map((item) => ({
      id: String(item.code),
      name: item.name
    }));
  } catch (error) {
    console.error(`Failed to fetch districts for city ${kotaId}:`, error);
    throw error;
  }
}

export async function getDesaByKecamatan(kecamatanId: string): Promise<WilayahItem[]> {
  try {
    const response = await fetch(`https://wilayah.id/api/villages/${kecamatanId}.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch villages for district ${kecamatanId}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as WilayahApiResponse;
    
    // Validate and transform the response data
    if (!Array.isArray(data.data)) {
      throw new Error('Invalid response format: expected data array');
    }

    return data.data.map((item) => ({
      id: String(item.code),
      name: item.name
    }));
  } catch (error) {
    console.error(`Failed to fetch villages for district ${kecamatanId}:`, error);
    throw error;
  }
}
