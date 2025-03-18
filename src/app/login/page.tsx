'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { LoginForm } from '@/components/auth/login-form';
import { UserProfile } from '@/lib/supabase';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const [user, setUser] = useState<UserProfile | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        // Already authenticated, redirect to dashboard
        redirect('/dashboard');
      }
    };
    
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const handleLoginSuccess = () => {
    toast.success('Logged in successfully');
    redirect('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} onLogin={() => {}} onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-12 flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <LoginForm onSuccess={handleLoginSuccess} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 