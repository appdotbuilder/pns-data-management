
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { LoginInput, LoginResponse } from '../../server/src/schema';

// Import components
import { LoginPage } from '@/components/LoginPage';
import { AdminDashboard } from '@/components/AdminDashboard';
import { PegawaiDashboard } from '@/components/PegawaiDashboard';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Define UserSession type without password field
type UserSession = {
  id: number;
  username: string;
  role: 'admin' | 'pegawai';
  pegawai_id: number | null;
  created_at: Date;
  updated_at: Date;
};

function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const loadCurrentUser = useCallback(async (userId: number) => {
    try {
      const userData = await trpc.getCurrentUser.query(userId);
      // Extract only the fields we need for the session
      const userSession: UserSession = {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        pegawai_id: userData.pegawai_id,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };
      setUser(userSession);
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Clear invalid session
      localStorage.removeItem('pns_token');
      localStorage.removeItem('pns_user_id');
      toast.error('Session expired. Please login again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for existing session on app load
  useEffect(() => {
    const token = localStorage.getItem('pns_token');
    const userId = localStorage.getItem('pns_user_id');
    
    if (token && userId) {
      loadCurrentUser(parseInt(userId));
    } else {
      setIsLoading(false);
    }
  }, [loadCurrentUser]);

  const handleLogin = async (credentials: LoginInput) => {
    setIsAuthenticating(true);
    try {
      const response: LoginResponse = await trpc.login.mutate(credentials);
      
      // Store session data
      localStorage.setItem('pns_token', response.token);
      localStorage.setItem('pns_user_id', response.user.id.toString());
      
      // Set user session from login response (which already excludes password)
      setUser(response.user);
      toast.success(`Welcome, ${response.user.username}!`);
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pns_token');
    localStorage.removeItem('pns_user_id');
    setUser(null);
    toast.success('Logged out successfully');
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} isLoading={isAuthenticating} />
        <Toaster />
      </>
    );
  }

  // Show appropriate dashboard based on user role
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {user.role === 'admin' ? (
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <PegawaiDashboard user={user} onLogout={handleLogout} />
        )}
      </div>
      <Toaster />
    </>
  );
}

export default App;
