
import { type WilayahItem } from '../schema';

export async function getProvinsi(): Promise<WilayahItem[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to fetch all provinces from wilayah.id API.
  // This integrates with external API: https://wilayah.id/api/provinces.json
  return [
    { id: '11', name: 'DKI Jakarta' },
    { id: '32', name: 'Jawa Barat' },
    { id: '33', name: 'Jawa Tengah' }
  ];
}

export async function getKotaByProvinsi(provinsiId: string): Promise<WilayahItem[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to fetch cities/regencies by province ID from wilayah.id API.
  // API endpoint: https://wilayah.id/api/regencies/{provinceId}.json
  return [
    { id: '1101', name: 'Jakarta Pusat' },
    { id: '1102', name: 'Jakarta Utara' }
  ];
}

export async function getKecamatanByKota(kotaId: string): Promise<WilayahItem[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to fetch districts by city/regency ID from wilayah.id API.
  // API endpoint: https://wilayah.id/api/districts/{regencyId}.json
  return [
    { id: '110101', name: 'Gambir' },
    { id: '110102', name: 'Sawah Besar' }
  ];
}

export async function getDesaByKecamatan(kecamatanId: string): Promise<WilayahItem[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to fetch villages by district ID from wilayah.id API.
  // API endpoint: https://wilayah.id/api/villages/{districtId}.json
  return [
    { id: '1101011001', name: 'Gambir' },
    { id: '1101011002', name: 'Kebon Kelapa' }
  ];
}
