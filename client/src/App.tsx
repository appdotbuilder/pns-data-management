
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Database, Users, UserCheck, FileText, GitBranch, Building } from 'lucide-react';
import type { Pegawai, Mutasi, PosisiTersedia } from '../../server/src/schema';

function App() {
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [mutasiPending, setMutasiPending] = useState<Mutasi[]>([]);
  const [posisiTersedia, setPosisiTersedia] = useState<PosisiTersedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ status: string; timestamp: string } | null>(null);

  // Load data on component mount
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [health, pegawai, mutasi, posisi] = await Promise.all([
        trpc.healthcheck.query(),
        trpc.getPegawai.query(),
        trpc.getMutasiPending.query(),
        trpc.getPosisiTersedia.query()
      ]);
      
      setHealthStatus(health);
      setPegawaiList(pegawai);
      setMutasiPending(mutasi);
      setPosisiTersedia(posisi);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const schemaFeatures = [
    {
      table: 'users',
      feature: 'pegawai_id foreign key',
      constraint: "references pegawai.id with onDelete: 'set null'",
      status: 'implemented',
      icon: Users,
      description: 'User accounts persist even if pegawai records are deleted'
    },
    {
      table: 'riwayat_jabatan', 
      feature: 'pegawai_id foreign key',
      constraint: "references pegawai.id with onDelete: 'cascade'",
      status: 'implemented',
      icon: FileText,
      description: 'Job history automatically removed with pegawai deletion'
    },
    {
      table: 'mutasi',
      feature: 'pegawai_id foreign key', 
      constraint: "references pegawai.id with onDelete: 'cascade'",
      status: 'implemented',
      icon: GitBranch,
      description: 'Mutation requests cleaned up with pegawai deletion'
    },
    {
      table: 'all tables',
      feature: 'updated_at auto-update',
      constraint: '$onUpdate(() => new Date()) for automatic timestamp updates',
      status: 'implemented',
      icon: Database,
      description: 'All record modifications automatically tracked'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏢 Sistem Manajemen Kepegawaian
          </h1>
          <p className="text-lg text-gray-600">
            Database Schema Status & Employee Management System
          </p>
          {healthStatus && (
            <div className="flex items-center space-x-2 mt-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Server Status: {healthStatus.status}
              </Badge>
              <span className="text-sm text-gray-500">
                Last check: {new Date(healthStatus.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        <Tabs defaultValue="schema" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schema">Schema Status</TabsTrigger>
            <TabsTrigger value="pegawai">Pegawai ({pegawaiList.length})</TabsTrigger>
            <TabsTrigger value="mutasi">Mutasi Pending ({mutasiPending.length})</TabsTrigger>
            <TabsTrigger value="posisi">Posisi Tersedia ({posisiTersedia.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="schema">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-green-700 flex items-center space-x-2">
                  <Database className="h-8 w-8" />
                  <span>Database Schema Status</span>
                </CardTitle>
                <CardDescription>
                  Current status of foreign key constraints and automatic timestamp updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {schemaFeatures.map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                        <div className="flex items-start space-x-4">
                          <IconComponent className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="text-sm">
                                {feature.table}
                              </Badge>
                              <Badge variant="secondary" className="text-sm bg-green-100 text-green-800">
                                ✓ {feature.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {feature.feature}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {feature.description}
                            </p>
                            <p className="text-xs text-gray-500 font-mono bg-gray-50 p-1 rounded">
                              {feature.constraint}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Schema Benefits</span>
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Foreign key constraints ensure referential integrity</li>
                      <li>• CASCADE deletes maintain data consistency</li>
                      <li>• SET NULL preserves user accounts</li>
                      <li>• Automatic timestamp updates track changes</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h3 className="font-semibold text-amber-900 mb-2 flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Pension Calculation</span>
                    </h3>
                    <p className="text-sm text-amber-800">
                      The "mendekati pensiun" feature calculates retirement eligibility 
                      dynamically from `tmt_jabatan` without requiring an explicit 
                      `tanggal_pensiun` column, maintaining schema flexibility.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pegawai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-6 w-6" />
                  <span>Data Pegawai</span>
                </CardTitle>
                <CardDescription>
                  Daftar semua pegawai dalam sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : pegawaiList.length === 0 ? (
                  <p className="text-gray-500">Belum ada data pegawai.</p>
                ) : (
                  <div className="grid gap-4">
                    {pegawaiList.slice(0, 5).map((pegawai: Pegawai) => (
                      <div key={pegawai.id} className="border p-4 rounded-md bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold">{pegawai.nama}</h3>
                            <p className="text-gray-600">NIP: {pegawai.nip}</p>
                            <p className="text-sm text-gray-500">{pegawai.email}</p>
                          </div>
                          <Badge variant={pegawai.is_active ? "default" : "secondary"}>
                            {pegawai.is_active ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Jabatan:</span> {pegawai.jabatan_saat_ini || 'Belum ditentukan'}
                          </div>
                          <div>
                            <span className="font-medium">Unit Kerja:</span> {pegawai.unit_kerja || 'Belum ditentukan'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {pegawaiList.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        Dan {pegawaiList.length - 5} pegawai lainnya...
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mutasi">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GitBranch className="h-6 w-6" />
                  <span>Mutasi Pending</span>
                </CardTitle>
                <CardDescription>
                  Daftar pengajuan mutasi yang menunggu persetujuan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : mutasiPending.length === 0 ? (
                  <p className="text-gray-500">Tidak ada mutasi pending.</p>
                ) : (
                  <div className="space-y-4">
                    {mutasiPending.map((mutasi: Mutasi) => (
                      <div key={mutasi.id} className="border p-4 rounded-md bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">Pegawai ID: {mutasi.pegawai_id}</h3>
                            <p className="text-sm text-gray-600">
                              {mutasi.jabatan_baru} - {mutasi.unit_kerja_baru}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {mutasi.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Tanggal Efektif: {mutasi.tanggal_efektif.toLocaleDateString()}
                        </p>
                        {mutasi.alasan_mutasi && (
                          <p className="text-sm mt-2">
                            <span className="font-medium">Alasan:</span> {mutasi.alasan_mutasi}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posisi">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-6 w-6" />
                  <span>Posisi Tersedia</span>
                </CardTitle>
                <CardDescription>
                  Daftar posisi yang sedang tersedia
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : posisiTersedia.length === 0 ? (
                  <p className="text-gray-500">Tidak ada posisi tersedia.</p>
                ) : (
                  <div className="space-y-4">
                    {posisiTersedia.map((posisi: PosisiTersedia) => (
                      <div key={posisi.id} className="border p-4 rounded-md bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{posisi.nama_posisi}</h3>
                            <p className="text-sm text-gray-600">{posisi.unit_kerja}</p>
                          </div>
                          <Badge variant={posisi.is_available ? "default" : "secondary"}>
                            {posisi.is_available ? "Tersedia" : "Tidak Tersedia"}
                          </Badge>
                        </div>
                        {posisi.deskripsi && (
                          <p className="text-sm text-gray-700 mb-2">{posisi.deskripsi}</p>
                        )}
                        {posisi.persyaratan && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Persyaratan:</span> {posisi.persyaratan}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Button 
            onClick={loadData} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
