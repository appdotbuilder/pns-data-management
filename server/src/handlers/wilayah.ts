
import { z } from 'zod';

// Define the WilayahItem type locally since it's not in schema.ts
export const wilayahItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type WilayahItem = z.infer<typeof wilayahItemSchema>;

const BASE_URL = 'https://wilayah.id/api';

async function fetchFromWilayahAPI(endpoint: string): Promise<WilayahItem[]> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: unknown = await response.json();
    
    // Type guard to ensure data is an array
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected array');
    }
    
    // Transform the API response to match our WilayahItem interface
    return data.map((item: any) => ({
      id: item.code || item.id,
      name: item.name
    }));
  } catch (error) {
    console.error(`Failed to fetch from wilayah API (${endpoint}):`, error);
    throw error;
  }
}

export async function getProvinsi(): Promise<WilayahItem[]> {
  return await fetchFromWilayahAPI('/provinces.json');
}

export async function getKotaByProvinsi(provinsiId: string): Promise<WilayahItem[]> {
  if (!provinsiId || provinsiId.trim() === '') {
    throw new Error('Province ID is required');
  }
  
  return await fetchFromWilayahAPI(`/regencies/${provinsiId}.json`);
}

export async function getKecamatanByKota(kotaId: string): Promise<WilayahItem[]> {
  if (!kotaId || kotaId.trim() === '') {
    throw new Error('City ID is required');
  }
  
  return await fetchFromWilayahAPI(`/districts/${kotaId}.json`);
}

export async function getDesaByKecamatan(kecamatanId: string): Promise<WilayahItem[]> {
  if (!kecamatanId || kecamatanId.trim() === '') {
    throw new Error('District ID is required');
  }
  
  return await fetchFromWilayahAPI(`/villages/${kecamatanId}.json`);
}
