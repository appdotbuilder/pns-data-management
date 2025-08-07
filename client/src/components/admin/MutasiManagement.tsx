
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';
import type { Mutasi, MutasiFilter, StatusMutasi } from '../../../../server/src/schema';

export function MutasiManagement() {
  const [mutasiList, setMutasiList] = useState<Mutasi[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMutasi, setSelectedMutasi] = useState<Mutasi | null>(null);
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Filter state
  const [filters, setFilters] = useState<MutasiFilter>({
    pegawai_id: undefined,
    status: undefined,
    limit: 20,
    offset: 0
  });

  const loadMutasiList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await trpc.getMutasiList.query(filters);
      setMutasiList(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load mutasi list:', error);
      toast.error('Gagal memuat data mutasi');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadMutasiList();
  }, [loadMutasiList]);

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

  const handleProcessMutasi = async (mutasiId: number, status: StatusMutasi) => {
    try {
      await trpc.updateMutasiStatus.mutate({
        id: mutasiId,
        status,
        catatan_admin: adminNotes || null
      });

      const statusText = status === 'approved' ? 'disetujui' : 'ditolak';
      toast.success(`Mutasi berhasil ${statusText}`);
      
      setIsProcessingDialogOpen(false);
      setSelectedMutasi(null);
      setAdminNotes('');
      loadMutasiList();
    } catch (error) {
      console.error('Failed to process mutasi:', error);
      toast.error('Gagal memproses mutasi');
    }
  };

  const openProcessingDialog = (mutasi: Mutasi) => {
    setSelectedMutasi(mutasi);
    setAdminNotes('');
    setIsProcessingDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Total: {total} permohonan mutasi
        </div>
        
        <Select
          value={filters.status || 'all'}
          onValueChange={(value: string) =>
            setFilters((prev: MutasiFilter) => ({
              ...prev,
              status: value === 'all' ? undefined : value as StatusMutasi
            }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mutasi List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : mutasiList.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Tidak ada data mutasi ditemukan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {mutasiList.map((mutasi: Mutasi) => (
            <Card key={mutasi.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Mutasi ID: {mutasi.id}
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
                        <p className="text-sm text-gray-600">{mutasi.catatan_admin}</p>
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
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openProcessingDialog(mutasi)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✅ Setujui
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openProcessingDialog(mutasi)}
                        className="text-red-600 hover:text-red-700"
                      >
                        ❌ Tolak
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Processing Dialog */}
      <Dialog open={isProcessingDialogOpen} onOpenChange={setIsProcessingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Permohonan Mutasi</DialogTitle>
          </DialogHeader>
          
          {selectedMutasi && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium">Detail Mutasi:</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedMutasi.satuan_kerja_asal} → {selectedMutasi.satuan_kerja_tujuan}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedMutasi.jabatan_asal} → {selectedMutasi.jabatan_tujuan}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin_notes">Catatan Admin (Opsional)</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setAdminNotes(e.target.value)
                  }
                  placeholder="Berikan catatan atau alasan untuk keputusan ini..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsProcessingDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleProcessMutasi(selectedMutasi.id, 'rejected')}
                >
                  Tolak
                </Button>
                <Button
                  onClick={() => handleProcessMutasi(selectedMutasi.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Setujui
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
