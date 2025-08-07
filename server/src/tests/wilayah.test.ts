
import { describe, expect, it } from 'bun:test';
import { getProvinsi, getKotaByProvinsi, getKecamatanByKota, getDesaByKecamatan } from '../handlers/wilayah';

describe('wilayah handlers', () => {
  describe('getProvinsi', () => {
    it('should fetch provinces from wilayah.id API', async () => {
      const result = await getProvinsi();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check structure of first item
      const firstProvince = result[0];
      expect(firstProvince).toHaveProperty('id');
      expect(firstProvince).toHaveProperty('name');
      expect(typeof firstProvince.id).toBe('string');
      expect(typeof firstProvince.name).toBe('string');
      expect(firstProvince.name.length).toBeGreaterThan(0);
    });

    it('should include well-known provinces', async () => {
      const result = await getProvinsi();
      
      const provinceNames = result.map(p => p.name);
      
      // Check for some well-known Indonesian provinces
      expect(provinceNames.some(name => name.includes('Jakarta') || name.includes('DKI'))).toBe(true);
      expect(provinceNames.some(name => name.includes('Jawa Barat'))).toBe(true);
    });
  });

  describe('getKotaByProvinsi', () => {
    it('should fetch cities for a valid province', async () => {
      // First get a real province ID
      const provinces = await getProvinsi();
      expect(provinces.length).toBeGreaterThan(0);
      
      const firstProvinceId = provinces[0].id;
      const result = await getKotaByProvinsi(firstProvinceId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check structure
      const firstCity = result[0];
      expect(firstCity).toHaveProperty('id');
      expect(firstCity).toHaveProperty('name');
      expect(typeof firstCity.id).toBe('string');
      expect(typeof firstCity.name).toBe('string');
    });

    it('should handle invalid province ID', async () => {
      await expect(getKotaByProvinsi('99999')).rejects.toThrow(/Failed to fetch cities/i);
    });
  });

  describe('getKecamatanByKota', () => {
    it('should fetch districts for a valid city', async () => {
      // Get a real province and city ID
      const provinces = await getProvinsi();
      const firstProvinceId = provinces[0].id;
      const cities = await getKotaByProvinsi(firstProvinceId);
      
      expect(cities.length).toBeGreaterThan(0);
      const firstCityId = cities[0].id;
      
      const result = await getKecamatanByKota(firstCityId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check structure
      const firstDistrict = result[0];
      expect(firstDistrict).toHaveProperty('id');
      expect(firstDistrict).toHaveProperty('name');
      expect(typeof firstDistrict.id).toBe('string');
      expect(typeof firstDistrict.name).toBe('string');
    });

    it('should handle invalid city ID', async () => {
      await expect(getKecamatanByKota('99999')).rejects.toThrow(/Failed to fetch districts/i);
    });
  });

  describe('getDesaByKecamatan', () => {
    it('should fetch villages for a valid district', async () => {
      // Get real hierarchical IDs
      const provinces = await getProvinsi();
      const firstProvinceId = provinces[0].id;
      const cities = await getKotaByProvinsi(firstProvinceId);
      const firstCityId = cities[0].id;
      const districts = await getKecamatanByKota(firstCityId);
      
      expect(districts.length).toBeGreaterThan(0);
      const firstDistrictId = districts[0].id;
      
      const result = await getDesaByKecamatan(firstDistrictId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check structure
      const firstVillage = result[0];
      expect(firstVillage).toHaveProperty('id');
      expect(firstVillage).toHaveProperty('name');
      expect(typeof firstVillage.id).toBe('string');
      expect(typeof firstVillage.name).toBe('string');
    });

    it('should handle invalid district ID', async () => {
      await expect(getDesaByKecamatan('99999')).rejects.toThrow(/Failed to fetch villages/i);
    });
  });

  describe('data consistency', () => {
    it('should maintain hierarchical relationship between provinces and cities', async () => {
      // Get provinces first
      const provinces = await getProvinsi();
      expect(provinces.length).toBeGreaterThan(0);
      
      // Get cities for the first province
      const firstProvinceId = provinces[0].id;
      const cities = await getKotaByProvinsi(firstProvinceId);
      
      // Should have at least one city
      expect(cities.length).toBeGreaterThan(0);
      
      // All results should have proper structure
      cities.forEach(city => {
        expect(city.id).toBeTruthy();
        expect(city.name).toBeTruthy();
        expect(typeof city.id).toBe('string');
        expect(typeof city.name).toBe('string');
      });
    });

    it('should return consistent data types across all levels', async () => {
      // Test that all API endpoints return the same data structure
      const provinces = await getProvinsi();
      const cities = await getKotaByProvinsi(provinces[0].id);
      const districts = await getKecamatanByKota(cities[0].id);
      const villages = await getDesaByKecamatan(districts[0].id);

      // Check that all levels return proper WilayahItem structure
      [provinces, cities, districts, villages].forEach((items, level) => {
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThan(0);
        
        items.forEach(item => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('name');
          expect(typeof item.id).toBe('string');
          expect(typeof item.name).toBe('string');
        });
      });
    });
  });
});
