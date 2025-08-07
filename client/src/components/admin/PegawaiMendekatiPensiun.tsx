
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';
import type { Pegawai } from '../../../../server/src/schema';

export function PegawaiMendekatiPensiun() {
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPegawaiMendekatiPensiun = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getPegawaiMendekatiPensiun.query();
      setPegawaiList(data);
    } catch (error) {
      console.error('Failed to load pegawai mendekati pensiun:', error);
      toast.error('Gagal memuat data pegawai mendekati pensiun');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPegawaiMendekatiPensiun();
  }, [loadPegawaiMendekatiPensiun]);

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          📅 Daftar pegawai yang akan memasuki masa pensiun berdasarkan TMT Jabatan.
          Kriteria pensiun: Usia 58-60 tahun tergantung tingkat jabatan.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : pegawaiList.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-center">
              <span className="text-6xl">🎉</span>
              <p className="text-gray-500 mt-4">
                Tidak ada pegawai yang mendekati masa pensiun saat ini
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="text-sm text-gray-600 mb-4">
            <strong>{pegawaiList.length}</strong> pegawai mendekati masa pensiun
          </div>
          
          {pegawaiList.map((pegawai: Pegawai) => (
            <Card key={pegawai.id} className="border-orange-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">⏰</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pegawai.nama_lengkap}
                      </h3>
                      <Badge variant="outline" className="border-orange-300 text-orange-700">
                        Mendekati Pensiun
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>HP:</strong> {pegawai.nomor_hp}</p>
                        <p><strong>NPWP:</strong> {pegawai.npwp}</p>
                        <p><strong>Pendidikan:</strong> {pegawai.pendidikan_terakhir}</p>
                      </div>
                      <div>
                        <p><strong>Alamat:</strong></p>
                        <p>{pegawai.desa_nama}, {pegawai.kecamatan_nama}</p>
                        <p>{pegawai.kota_nama}, {pegawai.provinsi_nama}</p>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 p-3 rounded-md">
                      <p className="text-sm text-orange-800">
                        <strong>⚠️ Perhatian:</strong> Pegawai ini perlu dipersiapkan untuk masa pensiun.
                        Pastikan proses suksesi dan transfer pengetahuan telah direncanakan.
                      </p>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      Data terakhir diperbarui: {pegawai.updated_at.toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
