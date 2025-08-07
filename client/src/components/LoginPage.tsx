
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LoginInput } from '../../../server/src/schema';

interface LoginPageProps {
  onLogin: (credentials: LoginInput) => Promise<void>;
  isLoading: boolean;
}

export function LoginPage({ onLogin, isLoading }: LoginPageProps) {
  const [credentials, setCredentials] = useState<LoginInput>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await onLogin(credentials);
    } catch {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">🏛️</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Sistem Informasi PNS
          </CardTitle>
          <CardDescription>
            Masuk dengan akun Admin atau Pegawai Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={credentials.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCredentials((prev: LoginInput) => ({
                    ...prev,
                    username: e.target.value
                  }))
                }
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={credentials.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCredentials((prev: LoginInput) => ({
                    ...prev,
                    password: e.target.value
                  }))
                }
                required
                disabled={isLoading}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sedang masuk...' : 'Masuk'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="font-semibold">Demo Login:</p>
            <p>Admin: admin / admin123</p>
            <p>Pegawai: pegawai / pegawai123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
