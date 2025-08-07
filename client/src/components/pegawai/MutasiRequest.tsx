
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';
import type { 
  Mutasi, 
  PosisiTersedia, 
  CreateMutasiInput, 
  RiwayatJabatan,
  StatusMutasi
} from '../../../../server/src/schema';

interface MutasiRequestProps {
  pegawaiId: number | null;
}

export function MutasiRequest({ pegawaiId }: MutasiRequestProps) {
  const [mutasiList, setMutasiList] = useState<Mutasi[]>([]);
  const [posisiTersedia, setPosisiTersedia] = useState<PosisiTersedia[]>([]);
  const [currentJabatan, setCurrentJabatan] = useState<RiwayatJabatan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<Omit<CreateMutasiInput, 'pegawai_id'>>({
    satuan_kerja_asal: '',
    unit_kerja_asal: '',
    jabatan_asal: '',
    satuan_kerja_tujuan: '',
    unit_kerja_tujuan: '',
    jabatan_tujuan: '',
    alasan: ''
  });

  const loadData = useCallback(async () => {
    if (!pegawaiId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [mutasiData, posisiData, currentData] = await Promise.all([
        trpc.getMutasiList.query({ pegawai_id: pegawaiId }),
        trpc.getPosisiTersediaList.query(),
        trpc.getCurrentJabatan.query(pegawaiId)
      ]);
      
      setMutasiList(mutasiData.data);
      setPosisiTersedia(posisiData.filter((p: PosisiTersedia) => p.is_active));
      setCurrentJabatan(currentData);
      
      // Auto-fill current position data
      if (currentData) {
        setFormData((prev: Omit<CreateMutasiInput, 'pegawai_id'>) => ({
          ...prev,
          satuan_kerja_asal: currentData.satuan_kerja,
          unit_kerja_asal: currentData.unit_kerja,
          jabatan_asal: currentData.jabatan_utama
        }));
      }
    } catch (error) {
      console.error('Failed to load mutasi data:', error);
      toast.error('Gagal memuat data mutasi');
    } finally {
      setIsLoading(false);
    }
  }, [pegawaiId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusBadge = (status: StatusMutasi) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">⏳ Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">✅ Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="destructive">❌ Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePosisiSelect = (posisiId: string) => {
    const selectedPosisi = posisiTersedia.find((p: PosisiTersedia) => p.id.toString() === posisiId);
    if (selectedPosisi) {
      setFormData((prev: Omit<CreateMutasiInput, 'pegawai_id'>) => ({
        ...prev,
        satuan_kerja_tujuan: selectedPosisi.satuan_kerja,
        unit_kerja_tujuan: selectedPosisi.unit_kerja,
        jabatan_tujuan: selectedPosisi.jabatan
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pegawaiId) return;

    try {
      const createData: CreateMutasiInput = {
        pegawai_id: pegawaiId,
        ...formData
      };
      
      await trpc.createMutasi.mutate(createData);
      toast.success('Permohonan mutasi berhasil diajukan');
      
      setIsFormDialogOpen(false);
      setFormData({
        satuan_kerja_asal: currentJabatan?.satuan_kerja || '',
        unit_kerja_asal: currentJabatan?.unit_kerja || '',
        jabatan_asal: currentJabatan?.jabatan_utama || '',
        satuan_kerja_tujuan: '',
        unit_kerja_tujuan: '',
        jabatan_tujuan: '',
        alasan: ''
      });
      
      loadData();
    } catch (error) {
      console.error('Failed to create mutasi:', error);
      toast.error('Gagal mengajukan permohonan mutasi');
    }
  };

  const handleDelete = async (mutasiId: number) => {
    try {
      await trpc.deleteMutasi.mutate(mutasiId);
      toast.success('Permohonan mutasi berhasil dibatalkan');
      loadData();
    } catch (error) {
      console.error('Failed to delete mutasi:', error);
      toast.error('Gagal membatalkan permohonan mutasi');
    }
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

  if (!currentJabatan) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Data jabatan saat ini tidak ditemukan. Anda perlu memiliki jabatan aktif untuk dapat mengajukan mutasi.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              📝 Ajukan Mutasi Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajukan Permohonan Mutasi</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Position (Read-only) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Posisi Saat Ini</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Satuan Kerja:</strong> {formData.satuan_kerja_asal}</p>
                  <p><strong>Unit Kerja:</strong> {formData.unit_kerja_asal}</p>
                  <p><strong>Jabatan:</strong> {formData.jabatan_asal}</p>
                </CardContent>
              </Card>

              {/* Target Position */}
              <div className="space-y-4">
                <Label>Pilih Posisi Tujuan</Label>
                <Select onValueChange={handlePosisiSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih posisi yang tersedia" />
                  </SelectTrigger>
                  <SelectContent>
                    {posisiTersedia.map((posisi: PosisiTersedia) => (
                      <SelectItem key={posisi.id} value={posisi.id.toString()}>
                        <div>
                          <div className="font-medium">{posisi.jabatan}</div>
                          <div className="text-sm text-gray-500">
                            {posisi.satuan_kerja} - {posisi.unit_kerja}
                          </div>
                          <div className="text-xs text-blue-600">
                            Kuota: {posisi.kuota_tersedia}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Position Details (Auto-filled) */}
              {formData.satuan_kerja_tujuan && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Posisi Tujuan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Satuan Kerja:</strong> {formData.satuan_kerja_tujuan}</p>
                    <p><strong>Unit Kerja:</strong> {formData.unit_kerja_tujuan}</p>
                    <p><strong>Jabatan:</strong> {formData.jabatan_tujuan}</p>
                  </CardContent>
                </Card>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="alasan">Alasan Mutasi *</Label>
                <Textarea
                  id="alasan"
                  value={formData.alasan}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: Omit<CreateMutasiInput, 'pegawai_id'>) => ({
                      ...prev,
                      alasan: e.target.value
                    }))
                  }
                  rows={3}
                  placeholder="Jelaskan alasan Anda mengajukan mutasi..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.satuan_kerja_tujuan || !formData.alasan}
                >
                  Ajukan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        <div className="text-sm text-gray-600">
          Total: {mutasiList.length} permohonan
        </div>
      </div>

      {/* Available Positions Info */}
      <Alert>
        <AlertDescription>
          💡 Tersedia <strong>{posisiTersedia.length}</strong> posisi untuk mutasi. 
          Pilih posisi yang sesuai dengan kualifikasi dan minat Anda.
        </AlertDescription>
      </Alert>

      {/* Mutasi List */}
      {mutasiList.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <span className="text-4xl">📋</span>
            <p className="text-gray-500 mt-2">
              Belum ada permohonan mutasi. Klik "Ajukan Mutasi Baru" untuk memulai.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {mutasiList
            .sort((a: Mutasi, b: Mutasi) => 
              new Date(b.tanggal_pengajuan).getTime() - new Date(a.tanggal_pengajuan).getTime()
            )
            .map((mutasi: Mutasi) => (
              <Card key={mutasi.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Permohonan #{mutasi.id}
                        </h3>
                        {getStatusBadge(mutasi.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Dari:</h4>
                          <div className="text-sm text-gray-600">
                            <p><strong>Satuan Kerja:</strong> {mutasi.satuan_kerja_asal}</p>
                            <p><strong>Unit Kerja:</strong> {mutasi.unit_kerja_asal}</p>
                            <p><strong>Jabatan:</strong> {mutasi.jabatan_asal}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Ke:</h4>
                          <div className="text-sm text-gray-600">
                            <p><strong>Satuan Kerja:</strong> {mutasi.satuan_kerja_tujuan}</p>
                            <p><strong>Unit Kerja:</strong> {mutasi.unit_kerja_tujuan}</p>
                            <p><strong>Jabatan:</strong> {mutasi.jabatan_tujuan}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Alasan:</h4>
                        <p className="text-sm text-gray-600">{mutasi.alasan}</p>
                      </div>
                      
                      {mutasi.catatan_admin && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Catatan Admin:</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {mutasi.catatan_admin}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>Diajukan: {mutasi.tanggal_pengajuan.toLocaleDateString('id-ID')}</span>
                        {mutasi.tanggal_persetujuan && (
                          <span>Diproses: {mutasi.tanggal_persetujuan.toLocaleDateString('id-ID')}</span>
                        )}
                      </div>
                    </div>
                    
                    {mutasi.status === 'pending' && (
                      <div className="ml-4">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              ❌ Batalkan
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Konfirmasi Pembatalan</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin membatalkan permohonan mutasi ini?
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(mutasi.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Batalkan Permohonan
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
