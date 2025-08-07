
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';
import type { 
  Pegawai, 
  CreatePegawaiInput, 
  UpdatePegawaiInput,
  WilayahItem,
  Pendidikan,
  GolonganDarah
} from '../../../../server/src/schema';

interface PegawaiFormProps {
  pegawai?: Pegawai | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PegawaiForm({ pegawai, onSuccess, onCancel }: PegawaiFormProps) {
  const [formData, setFormData] = useState<CreatePegawaiInput>({
    nama_lengkap: '',
    nomor_hp: '',
    npwp: '',
    pendidikan_terakhir: 'SMA',
    golongan_darah: 'A',
    provinsi_id: '',
    provinsi_nama: '',
    kota_id: '',
    kota_nama: '',
    kecamatan_id: '',
    kecamatan_nama: '',
    desa_id: '',
    desa_nama: ''
  });

  // Wilayah data
  const [provinsiList, setProvinsiList] = useState<WilayahItem[]>([]);
  const [kotaList, setKotaList] = useState<WilayahItem[]>([]);
  const [kecamatanList, setKecamatanList] = useState<WilayahItem[]>([]);
  const [desaList, setDesaList] = useState<WilayahItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data for editing
  useEffect(() => {
    if (pegawai) {
      setFormData({
        nama_lengkap: pegawai.nama_lengkap,
        nomor_hp: pegawai.nomor_hp,
        npwp: pegawai.npwp,
        pendidikan_terakhir: pegawai.pendidikan_terakhir,
        golongan_darah: pegawai.golongan_darah,
        provinsi_id: pegawai.provinsi_id,
        provinsi_nama: pegawai.provinsi_nama,
        kota_id: pegawai.kota_id,
        kota_nama: pegawai.kota_nama,
        kecamatan_id: pegawai.kecamatan_id,
        kecamatan_nama: pegawai.kecamatan_nama,
        desa_id: pegawai.desa_id,
        desa_nama: pegawai.desa_nama
      });
    }
  }, [pegawai]);

  // Load provinsi on component mount
  const loadProvinsi = useCallback(async () => {
    try {
      const data = await trpc.getProvinsi.query();
      setProvinsiList(data);
    } catch (error) {
      console.error('Failed to load provinsi:', error);
      toast.error('Gagal memuat data provinsi');
    }
  }, []);

  useEffect(() => {
    loadProvinsi();
  }, [loadProvinsi]);

  // Load kota when provinsi changes
  useEffect(() => {
    if (formData.provinsi_id) {
      loadKota(formData.provinsi_id);
    } else {
      setKotaList([]);
      setKecamatanList([]);
      setDesaList([]);
    }
  }, [formData.provinsi_id]);

  // Load kecamatan when kota changes
  useEffect(() => {
    if (formData.kota_id) {
      loadKecamatan(formData.kota_id);
    } else {
      setKecamatanList([]);
      setDesaList([]);
    }
  }, [formData.kota_id]);

  // Load desa when kecamatan changes
  useEffect(() => {
    if (formData.kecamatan_id) {
      loadDesa(formData.kecamatan_id);
    } else {
      setDesaList([]);
    }
  }, [formData.kecamatan_id]);

  const loadKota = async (provinsiId: string) => {
    try {
      const data = await trpc.getKotaByProvinsi.query(provinsiId);
      setKotaList(data);
    } catch (error) {
      console.error('Failed to load kota:', error);
      toast.error('Gagal memuat data kota');
    }
  };

  const loadKecamatan = async (kotaId: string) => {
    try {
      const data = await trpc.getKecamatanByKota.query(kotaId);
      setKecamatanList(data);
    } catch (error) {
      console.error('Failed to load kecamatan:', error);
      toast.error('Gagal memuat data kecamatan');
    }
  };

  const loadDesa = async (kecamatanId: string) => {
    try {
      const data = await trpc.getDesaByKecamatan.query(kecamatanId);
      setDesaList(data);
    } catch (error) {
      console.error('Failed to load desa:', error);
      toast.error('Gagal memuat data desa');
    }
  };

  const handleProvinsiChange = (value: string) => {
    const selectedProvinsi = provinsiList.find((p: WilayahItem) => p.id === value);
    if (selectedProvinsi) {
      setFormData((prev: CreatePegawaiInput) => ({
        ...prev,
        provinsi_id: selectedProvinsi.id,
        provinsi_nama: selectedProvinsi.name,
        kota_id: '',
        kota_nama: '',
        kecamatan_id: '',
        kecamatan_nama: '',
        desa_id: '',
        desa_nama: ''
      }));
    }
  };

  const handleKotaChange = (value: string) => {
    const selectedKota = kotaList.find((k: WilayahItem) => k.id === value);
    if (selectedKota) {
      setFormData((prev: CreatePegawaiInput) => ({
        ...prev,
        kota_id: selectedKota.id,
        kota_nama: selectedKota.name,
        kecamatan_id: '',
        kecamatan_nama: '',
        desa_id: '',
        desa_nama: ''
      }));
    }
  };

  const handleKecamatanChange = (value: string) => {
    const selectedKecamatan = kecamatanList.find((k: WilayahItem) => k.id === value);
    if (selectedKecamatan) {
      setFormData((prev: CreatePegawaiInput) => ({
        ...prev,
        kecamatan_id: selectedKecamatan.id,
        kecamatan_nama: selectedKecamatan.name,
        desa_id: '',
        desa_nama: ''
      }));
    }
  };

  const handleDesaChange = (value: string) => {
    const selectedDesa = desaList.find((d: WilayahItem) => d.id === value);
    if (selectedDesa) {
      setFormData((prev: CreatePegawaiInput) => ({
        ...prev,
        desa_id: selectedDesa.id,
        desa_nama: selectedDesa.name
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (pegawai) {
        // Update existing pegawai
        const updateData: UpdatePegawaiInput = {
          id: pegawai.id,
          ...formData
        };
        await trpc.updatePegawai.mutate(updateData);
        toast.success('Data pegawai berhasil diperbarui');
      } else {
        // Create new pegawai
        await trpc.createPegawai.mutate(formData);
        toast.success('Data pegawai berhasil ditambahkan');
      }
      onSuccess();
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Gagal menyimpan data. Pastikan semua field telah diisi dengan benar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
            <Input
              id="nama_lengkap"
              value={formData.nama_lengkap}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePegawaiInput) => ({
                  ...prev,
                  nama_lengkap: e.target.value
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nomor_hp">Nomor HP *</Label>
            <Input
              id="nomor_hp"
              value={formData.nomor_hp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePegawaiInput) => ({
                  ...prev,
                  nomor_hp: e.target.value
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="npwp">NPWP *</Label>
            <Input
              id="npwp"
              value={formData.npwp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePegawaiInput) => ({
                  ...prev,
                  npwp: e.target.value
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pendidikan_terakhir">Pendidikan Terakhir *</Label>
            <Select
              value={formData.pendidikan_terakhir}
              onValueChange={(value: string) =>
                setFormData((prev: CreatePegawaiInput) => ({
                  ...prev,
                  pendidikan_terakhir: value as Pendidikan
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SD">SD</SelectItem>
                <SelectItem value="SMP">SMP</SelectItem>
                <SelectItem value="SMA">SMA</SelectItem>
                <SelectItem value="D3">D3</SelectItem>
                <SelectItem value="S1">S1</SelectItem>
                <SelectItem value="S2">S2</SelectItem>
                <SelectItem value="S3">S3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="golongan_darah">Golongan Darah *</Label>
            <Select
              value={formData.golongan_darah}
              onValueChange={(value: string) =>
                setFormData((prev: CreatePegawaiInput) => ({
                  ...prev,
                  golongan_darah: value as GolonganDarah
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="AB">AB</SelectItem>
                <SelectItem value="O">O</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Alamat</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provinsi">Provinsi *</Label>
            <Select value={formData.provinsi_id || ''} onValueChange={handleProvinsiChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Provinsi" />
              </SelectTrigger>
              <SelectContent>
                {provinsiList.map((provinsi: WilayahItem) => (
                  <SelectItem key={provinsi.id} value={provinsi.id}>
                    {provinsi.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kota">Kota/Kabupaten *</Label>
            <Select
              value={formData.kota_id || ''}
              onValueChange={handleKotaChange}
              disabled={!formData.provinsi_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kota/Kabupaten" />
              </SelectTrigger>
              <SelectContent>
                {kotaList.map((kota: WilayahItem) => (
                  <SelectItem key={kota.id} value={kota.id}>
                    {kota.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kecamatan">Kecamatan *</Label>
            <Select
              value={formData.kecamatan_id || ''}
              onValueChange={handleKecamatanChange}
              disabled={!formData.kota_id}
            >
              <SelectTrigger>
                
                <SelectValue placeholder="Pilih Kecamatan" />
              </SelectTrigger>
              <SelectContent>
                {kecamatanList.map((kecamatan: WilayahItem) => (
                  <SelectItem key={kecamatan.id} value={kecamatan.id}>
                    {kecamatan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desa">Desa/Kelurahan *</Label>
            <Select
              value={formData.desa_id || ''}
              onValueChange={handleDesaChange}
              disabled={!formData.kecamatan_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Desa/Kelurahan" />
              </SelectTrigger>
              <SelectContent>
                {desaList.map((desa: WilayahItem) => (
                  <SelectItem key={desa.id} value={desa.id}>
                    {desa.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Menyimpan...' : pegawai ? 'Perbarui' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}
