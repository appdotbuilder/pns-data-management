
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Define UserSession type without password field
type UserSession = {
  id: number;
  username: string;
  role: 'admin' | 'pegawai';
  pegawai_id: number | null;
  created_at: Date;
  updated_at: Date;
};

// Import admin components
import { PegawaiManagement } from '@/components/admin/PegawaiManagement';
import { MutasiManagement } from '@/components/admin/MutasiManagement';
import { PosisiTersediaManagement } from '@/components/admin/PosisiTersediaManagement';
import { PegawaiMendekatiPensiun } from '@/components/admin/PegawaiMendekatiPensiun';

interface AdminDashboardProps {
  user: UserSession;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('pegawai');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">🏛️</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">Sistem Informasi PNS</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.username}
                </p>
                <Badge variant="default" className="text-xs">
                  Administrator
                </Badge>
              </div>
              <Button
                variant="outline"
                onClick={onLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pegawai">Data Pegawai</TabsTrigger>
            <TabsTrigger value="mutasi">Mutasi</TabsTrigger>
            <TabsTrigger value="posisi">Posisi Tersedia</TabsTrigger>
            <TabsTrigger value="pensiun">Mendekati Pensiun</TabsTrigger>
          </TabsList>

          <TabsContent value="pegawai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manajemen Data Pegawai</CardTitle>
                <CardDescription>
                  Kelola data pegawai negeri sipil termasuk tambah, ubah, dan hapus data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PegawaiManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mutasi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manajemen Mutasi</CardTitle>
                <CardDescription>
                  Kelola permohonan mutasi pegawai dan proses persetujuan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MutasiManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posisi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Posisi Tersedia</CardTitle>
                <CardDescription>
                  Kelola posisi jabatan yang tersedia untuk mutasi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PosisiTersediaManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pensiun" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pegawai Mendekati Pensiun</CardTitle>
                <CardDescription>
                  Daftar pegawai yang akan memasuki masa pensiun
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PegawaiMendekatiPensiun />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
