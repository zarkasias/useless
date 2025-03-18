'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { SignupForm } from '@/components/auth/signup-form';
import { UserProfile } from '@/lib/supabase';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LoginForm } from '@/components/auth/login-form';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

export default function SignupPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

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

  const handleLogin = () => {
    setIsAuthSheetOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const handleLoginSuccess = () => {
    setIsAuthSheetOpen(false);
    toast.success('Logged in successfully');
    redirect('/dashboard');
  };

  const handleSignupSuccess = () => {
    toast.success('Account created successfully!');
    redirect('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-12 flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <SignupForm onSuccess={handleSignupSuccess} />
          </CardContent>
        </Card>
      </div>
      
      {/* Auth sheet */}
      <Sheet open={isAuthSheetOpen} onOpenChange={setIsAuthSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Login</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 