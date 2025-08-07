
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';
import type { Pegawai } from '../../../../server/src/schema';

// Import form component
import { PegawaiForm } from '@/components/forms/PegawaiForm';

interface PegawaiProfileProps {
  pegawaiId: number | null;
}

export function PegawaiProfile({ pegawaiId }: PegawaiProfileProps) {
  const [pegawaiData, setPegawaiData] = useState<Pegawai | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const loadPegawaiData = useCallback(async () => {
    if (!pegawaiId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await trpc.getPegawaiById.query(pegawaiId);
      setPegawaiData(data);
    } catch (error) {
      console.error('Failed to load pegawai data:', error);
      toast.error('Gagal memuat data pribadi');
    } finally {
      setIsLoading(false);
    }
  }, [pegawaiId]);

  useEffect(() => {
    loadPegawaiData();
  }, [loadPegawaiData]);

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    loadPegawaiData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!pegawaiId) {
    return (
      <Alert>
        <AlertDescription>
          Akun Anda belum terhubung dengan data pegawai. Hubungi administrator untuk menghubungkan akun Anda.
        </AlertDescription>
      </Alert>
    );
  }

  if (!pegawaiData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Data pegawai tidak ditemukan. Hubungi administrator untuk bantuan.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {pegawaiData.nama_lengkap}
            </h2>
            <p className="text-gray-600">Pegawai Negeri Sipil</p>
          </div>
        </div>
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              ✏️ Edit Profil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Data Pribadi</DialogTitle>
            </DialogHeader>
            <PegawaiForm
              pegawai={pegawaiData}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pribadi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nama Lengkap</label>
                <p className="text-lg text-gray-900">{pegawaiData.nama_lengkap}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Nomor HP</label>
                <p className="text-lg text-gray-900">{pegawaiData.nomor_hp}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">NPWP</label>
                <p className="text-lg text-gray-900">{pegawaiData.npwp}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Pendidikan Terakhir</label>
                <p className="text-lg text-gray-900">{pegawaiData.pendidikan_terakhir}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Golongan Darah</label>
                <p className="text-lg text-gray-900">{pegawaiData.golongan_darah}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Alamat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Provinsi</label>
              <p className="text-lg text-gray-900">{pegawaiData.provinsi_nama}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Kota/Kabupaten</label>
              <p className="text-lg text-gray-900">{pegawaiData.kota_nama}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Kecamatan</label>
              <p className="text-lg text-gray-900">{pegawaiData.kecamatan_nama}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Desa/Kelurahan</label>
              <p className="text-lg text-gray-900">{pegawaiData.desa_nama}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Tanggal Bergabung</label>
              <p className="text-lg text-gray-900">
                {pegawaiData.created_at.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Terakhir Diperbarui</label>
              <p className="text-lg text-gray-900">
                {pegawaiData.updated_at.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
