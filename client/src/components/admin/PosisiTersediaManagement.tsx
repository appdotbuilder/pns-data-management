
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';
import type { PosisiTersedia, CreatePosisiTersediaInput } from '../../../../server/src/schema';

export function PosisiTersediaManagement() {
  const [posisiList, setPosisiList] = useState<PosisiTersedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPosisi, setEditingPosisi] = useState<PosisiTersedia | null>(null);
  
  const [formData, setFormData] = useState<CreatePosisiTersediaInput>({
    satuan_kerja: '',
    unit_kerja: '',
    jabatan: '',
    kuota_tersedia: 1,
    persyaratan: ''
  });

  const loadPosisiList = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getPosisiTersediaList.query();
      setPosisiList(data);
    } catch (error) {
      console.error('Failed to load posisi list:', error);
      toast.error('Gagal memuat data posisi tersedia');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosisiList();
  }, [loadPosisiList]);

  const resetForm = () => {
    setFormData({
      satuan_kerja: '',
      unit_kerja: '',
      jabatan: '',
      kuota_tersedia: 1,
      persyaratan: ''
    });
    setEditingPosisi(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditDialog = (posisi: PosisiTersedia) => {
    setFormData({
      satuan_kerja: posisi.satuan_kerja,
      unit_kerja: posisi.unit_kerja,
      jabatan: posisi.jabatan,
      kuota_tersedia: posisi.kuota_tersedia,
      persyaratan: posisi.persyaratan
    });
    setEditingPosisi(posisi);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPosisi) {
        await trpc.updatePosisiTersedia.mutate({
          id: editingPosisi.id,
          data: formData
        });
        toast.success('Posisi berhasil diperbarui');
      } else {
        await trpc.createPosisiTersedia.mutate(formData);
        toast.success('Posisi baru berhasil ditambahkan');
      }
      
      setIsFormOpen(false);
      resetForm();
      loadPosisiList();
    } catch (error) {
      console.error('Failed to save posisi:', error);
      toast.error('Gagal menyimpan data posisi');
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await trpc.deactivatePosisiTersedia.mutate(id);
      toast.success('Posisi berhasil dinonaktifkan');
      loadPosisiList();
    } catch (error) {
      console.error('Failed to deactivate posisi:', error);
      toast.error('Gagal menonaktifkan posisi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              ➕ Tambah Posisi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPosisi ? 'Edit Posisi' : 'Tambah Posisi Tersedia'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="satuan_kerja">Satuan Kerja *</Label>
                  <Input
                    id="satuan_kerja"
                    value={formData.satuan_kerja}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePosisiTersediaInput) => ({
                        ...prev,
                        satuan_kerja: e.target.value
                      }))
                    }
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit_kerja">Unit Kerja *</Label>
                  <Input
                    id="unit_kerja"
                    value={formData.unit_kerja}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePosisiTersediaInput) => ({
                        ...prev,
                        unit_kerja: e.target.value
                      }))
                    }
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jabatan">Jabatan *</Label>
                  <Input
                    id="jabatan"
                    value={formData.jabatan}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePosisiTersediaInput) => ({
                        ...prev,
                        jabatan: e.target.value
                      }))
                    }
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="kuota_tersedia">Kuota Tersedia *</Label>
                  <Input
                    id="kuota_tersedia"
                    type="number"
                    min="1"
                    value={formData.kuota_tersedia}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePosisiTersediaInput) => ({
                        ...prev,
                        kuota_tersedia: parseInt(e.target.value) || 1
                      }))
                    }
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="persyaratan">Persyaratan *</Label>
                <Textarea
                  id="persyaratan"
                  value={formData.persyaratan}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreatePosisiTersediaInput) => ({
                      ...prev,
                      persyaratan: e.target.value
                    }))
                  }
                  rows={3}
                  placeholder="Deskripsikan persyaratan untuk posisi ini..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  {editingPosisi ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        <div className="text-sm text-gray-600">
          Total: {posisiList.length} posisi
        </div>
      </div>

      {/* Posisi List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : posisiList.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Belum ada posisi tersedia</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posisiList.map((posisi: PosisiTersedia) => (
            <Card key={posisi.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {posisi.jabatan}
                      </h3>
                      <Badge variant={posisi.is_active ? "default" : "secondary"}>
                        {posisi.is_active ? '🟢 Aktif' : '🔴 Nonaktif'}
                      </Badge>
                      <Badge variant="outline" className="text-blue-600">
                        Kuota: {posisi.kuota_tersedia}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Satuan Kerja:</strong> {posisi.satuan_kerja}</p>
                        <p><strong>Unit Kerja:</strong> {posisi.unit_kerja}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Persyaratan:</h4>
                      <p className="text-sm text-gray-600">{posisi.persyaratan}</p>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      Dibuat: {posisi.created_at.toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(posisi)}
                    >
                      ✏️ Edit
                    </Button>
                    
                    {posisi.is_active && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            🔴 Nonaktifkan
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi Nonaktifkan</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menonaktifkan posisi{' '}
                              <strong>{posisi.jabatan}</strong>?
                              Posisi yang nonaktif tidak akan tampil dalam pilihan mutasi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeactivate(posisi.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Nonaktifkan
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
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
