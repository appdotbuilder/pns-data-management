
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';
import type { Pegawai, PegawaiFilter, Pendidikan } from '../../../../server/src/schema';

// Import form components
import { PegawaiForm } from '@/components/forms/PegawaiForm';

export function PegawaiManagement() {
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<PegawaiFilter>({
    search: '',
    satuan_kerja: undefined,
    unit_kerja: undefined,
    jabatan: undefined,
    pendidikan: undefined,
    mendekati_pensiun: false,
    limit: 20,
    offset: 0
  });

  const loadPegawaiList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await trpc.getPegawaiList.query({
        ...filters,
        offset: (currentPage - 1) * (filters.limit || 20)
      });
      setPegawaiList(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load pegawai list:', error);
      toast.error('Gagal memuat data pegawai');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    loadPegawaiList();
  }, [loadPegawaiList]);

  const handleDelete = async (id: number) => {
    try {
      await trpc.deletePegawai.mutate(id);
      toast.success('Data pegawai berhasil dihapus');
      loadPegawaiList();
    } catch (error) {
      console.error('Failed to delete pegawai:', error);
      toast.error('Gagal menghapus data pegawai');
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingPegawai(null);
    loadPegawaiList();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPegawaiList();
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      satuan_kerja: undefined,
      unit_kerja: undefined,
      jabatan: undefined,
      pendidikan: undefined,
      mendekati_pensiun: false,
      limit: 20,
      offset: 0
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / (filters.limit || 20));

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPegawai(null)}>
                ➕ Tambah Pegawai
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPegawai ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
                </DialogTitle>
              </DialogHeader>
              <PegawaiForm
                pegawai={editingPegawai}
                onSuccess={handleFormSuccess}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            onClick={resetFilters}
          >
            🔄 Reset Filter
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          Total: {total} pegawai
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Input
                placeholder="Cari nama, HP, atau NPWP..."
                value={filters.search || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: PegawaiFilter) => ({
                    ...prev,
                    search: e.target.value
                  }))
                }
              />
              
              <Input
                placeholder="Satuan Kerja"
                value={filters.satuan_kerja || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: PegawaiFilter) => ({
                    ...prev,
                    satuan_kerja: e.target.value || undefined
                  }))
                }
              />
              
              <Input
                placeholder="Unit Kerja"
                value={filters.unit_kerja || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: PegawaiFilter) => ({
                    ...prev,
                    unit_kerja: e.target.value || undefined
                  }))
                }
              />
              
              <Input
                placeholder="Jabatan"
                value={filters.jabatan || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: PegawaiFilter) => ({
                    ...prev,
                    jabatan: e.target.value || undefined
                  }))
                }
              />
              
              <Select
                value={filters.pendidikan || 'all'}
                onValueChange={(value: string) =>
                  setFilters((prev: PegawaiFilter) => ({
                    ...prev,
                    pendidikan: value === 'all' ? undefined : value as Pendidikan
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pendidikan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Pendidikan</SelectItem>
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
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.mendekati_pensiun || false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilters((prev: PegawaiFilter) => ({
                      ...prev,
                      mendekati_pensiun: e.target.checked
                    }))
                  }
                  className="rounded"
                />
                <span className="text-sm">Mendekati Pensiun</span>
              </label>
              
              <Button type="submit">
                🔍 Cari
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Pegawai List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : pegawaiList.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Tidak ada data pegawai ditemukan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pegawaiList.map((pegawai: Pegawai) => (
            <Card key={pegawai.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pegawai.nama_lengkap}
                      </h3>
                      <Badge variant="outline">
                        {pegawai.pendidikan_terakhir}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Gol. Darah {pegawai.golongan_darah}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>HP:</strong> {pegawai.nomor_hp}</p>
                        <p><strong>NPWP:</strong> {pegawai.npwp}</p>
                      </div>
                      <div>
                        <p><strong>Alamat:</strong></p>
                        <p>{pegawai.desa_nama}, {pegawai.kecamatan_nama}</p>
                        <p>{pegawai.kota_nama}, {pegawai.provinsi_nama}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      Dibuat: {pegawai.created_at.toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPegawai(pegawai);
                        setIsFormOpen(true);
                      }}
                    >
                      ✏️ Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          🗑️ Hapus
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data pegawai{' '}
                            <strong>{pegawai.nama_lengkap}</strong>?
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(pegawai.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
