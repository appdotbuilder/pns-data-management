
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

// Import pegawai components
import { PegawaiProfile } from '@/components/pegawai/PegawaiProfile';
import { RiwayatJabatan } from '@/components/pegawai/RiwayatJabatan';
import { MutasiRequest } from '@/components/pegawai/MutasiRequest';

interface PegawaiDashboardProps {
  user: UserSession;
  onLogout: () => void;
}

export function PegawaiDashboard({ user, onLogout }: PegawaiDashboardProps) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">👤</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Portal Pegawai
                </h1>
                <p className="text-sm text-gray-600">Sistem Informasi PNS</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.username}
                </p>
                <Badge variant="secondary" className="text-xs">
                  Pegawai
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profil Saya</TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat Jabatan</TabsTrigger>
            <TabsTrigger value="mutasi">Permohonan Mutasi</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Pribadi</CardTitle>
                <CardDescription>
                  Kelola informasi data pribadi Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PegawaiProfile pegawaiId={user.pegawai_id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="riwayat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Jabatan</CardTitle>
                <CardDescription>
                  Lihat riwayat jabatan dan posisi Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RiwayatJabatan pegawaiId={user.pegawai_id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mutasi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Permohonan Mutasi</CardTitle>
                <CardDescription>
                  Ajukan atau lihat status permohonan mutasi Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MutasiRequest pegawaiId={user.pegawai_id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
