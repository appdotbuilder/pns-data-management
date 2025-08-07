
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';
import type { RiwayatJabatan } from '../../../../server/src/schema';

interface RiwayatJabatanProps {
  pegawaiId: number | null;
}

export function RiwayatJabatan({ pegawaiId }: RiwayatJabatanProps) {
  const [riwayatList, setRiwayatList] = useState<RiwayatJabatan[]>([]);
  const [currentJabatan, setCurrentJabatan] = useState<RiwayatJabatan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRiwayatJabatan = useCallback(async () => {
    if (!pegawaiId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [riwayatData, currentData] = await Promise.all([
        trpc.getRiwayatJabatanByPegawai.query(pegawaiId),
        trpc.getCurrentJabatan.query(pegawaiId)
      ]);
      
      setRiwayatList(riwayatData);
      setCurrentJabatan(currentData);
    } catch (error) {
      console.error('Failed to load riwayat jabatan:', error);
      toast.error('Gagal memuat data riwayat jabatan');
    } finally {
      setIsLoading(false);
    }
  }, [pegawaiId]);

  useEffect(() => {
    loadRiwayatJabatan();
  }, [loadRiwayatJabatan]);

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

  return (
    <div className="space-y-6">
      {/* Current Position */}
      {currentJabatan && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🏢</span>
              <span>Jabatan Saat Ini</span>
              <Badge variant="default" className="bg-green-600">
                Aktif
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-600">Satuan Kerja</label>
                  <p className="text-lg text-gray-900">{currentJabatan.satuan_kerja}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Unit Kerja</label>
                  <p className="text-lg text-gray-900">{currentJabatan.unit_kerja}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-600">Jabatan Utama</label>
                  <p className="text-lg text-gray-900">{currentJabatan.jabatan_utama}</p>
                </div>
                
                {currentJabatan.jabatan_tambahan && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Jabatan Tambahan</label>
                    <p className="text-lg text-gray-900">{currentJabatan.jabatan_tambahan}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <label className="font-medium">TMT Jabatan</label>
                  <p>{currentJabatan.tmt_jabatan.toLocaleDateString('id-ID')}</p>
                </div>
                
                {currentJabatan.tmt_jabatan_tambahan && (
                  <div>
                    <label className="font-medium">TMT Jabatan Tambahan</label>
                    <p>{currentJabatan.tmt_jabatan_tambahan.toLocaleDateString('id-ID')}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📋</span>
            <span>Riwayat Jabatan</span>
          </CardTitle>
        
        </CardHeader>
        <CardContent>
          {riwayatList.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">📝</span>
              <p className="text-gray-500 mt-2">Belum ada riwayat jabatan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {riwayatList
                .sort((a: RiwayatJabatan, b: RiwayatJabatan) => 
                  new Date(b.tmt_jabatan).getTime() - new Date(a.tmt_jabatan).getTime()
                )
                .map((riwayat: RiwayatJabatan, index: number) => (
                  <div
                    key={riwayat.id}
                    className={`p-4 rounded-lg border ${
                      index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Satuan Kerja
                              </label>
                              <p className="text-gray-900">{riwayat.satuan_kerja}</p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Unit Kerja
                              </label>
                              <p className="text-gray-900">{riwayat.unit_kerja}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Jabatan Utama
                              </label>
                              <p className="text-gray-900">{riwayat.jabatan_utama}</p>
                            </div>
                            
                            {riwayat.jabatan_tambahan && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">
                                  Jabatan Tambahan
                                </label>
                                <p className="text-gray-900">{riwayat.jabatan_tambahan}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <label className="font-medium">TMT Jabatan</label>
                              <p>{riwayat.tmt_jabatan.toLocaleDateString('id-ID')}</p>
                            </div>
                            
                            {riwayat.tmt_jabatan_tambahan && (
                              <div>
                                <label className="font-medium">TMT Jabatan Tambahan</label>
                                <p>{riwayat.tmt_jabatan_tambahan.toLocaleDateString('id-ID')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {index === 0 && (
                        <Badge variant="secondary" className="ml-4">
                          Terbaru
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
