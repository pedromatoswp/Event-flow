'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield, Camera, Save, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
      });
    }
  }, [user, isAuthenticated, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await authApi.updateProfile(formData);
      success('Profile updated successfully');
      // Reload user data
      const updatedUser = await authApi.getProfile();
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (err) {
      error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-2">Profile</h1>
            <p className="text-xl text-muted-foreground">
              Manage your account settings
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt={formData.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary">
                          {formData.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <Button type="button" variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        Change Avatar
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        JPG, PNG or GIF. Max 2MB
                      </p>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="role"
                        className="pl-10"
                        value={user?.role || 'user'}
                        disabled
                      />
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="space-y-2">
                    <Label htmlFor="joined">Member Since</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="joined"
                        className="pl-10"
                        value={
                          user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : 'N/A'
                        }
                        disabled
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={isSaving} className="flex-1">
                      {isSaving ? 'Saving...' : 'Save Changes'}
                      <Save className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
