'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Calendar, Ticket, TrendingUp, DollarSign, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const { error } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!authLoading && isAuthenticated && !isAdmin) {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated && isAdmin) {
      loadStats();
    }
  }, [isAuthenticated, isAdmin, authLoading]);

  const loadStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      error('Failed to load admin stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
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
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-primary">Admin Panel</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-xl text-muted-foreground">
              Manage events, users, and tickets
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 -mt-6">
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              label: 'Total Users',
              value: stats?.totalUsers || 0,
              icon: Users,
              color: 'blue',
            },
            {
              label: 'Total Events',
              value: stats?.totalEvents || 0,
              icon: Calendar,
              color: 'green',
            },
            {
              label: 'Total Tickets',
              value: stats?.totalTickets || 0,
              icon: Ticket,
              color: 'purple',
            },
            {
              label: 'Revenue',
              value: `$${stats?.revenue || 0}`,
              icon: DollarSign,
              color: 'yellow',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                      <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/admin/events">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Events
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/admin/tickets">
                  <Button variant="outline" className="w-full justify-start">
                    <Ticket className="h-4 w-4 mr-2" />
                    View All Tickets
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentActivity?.length ? (
                    stats.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-lg bg-accent">
                  <p className="text-3xl font-bold text-primary mb-2">
                    {stats?.activeEventsThisMonth || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Events This Month</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-accent">
                  <p className="text-3xl font-bold text-green-500 mb-2">
                    {stats?.ticketsSoldThisMonth || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Tickets Sold This Month</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-accent">
                  <p className="text-3xl font-bold text-blue-500 mb-2">
                    {stats?.newUsersThisMonth || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">New Users This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
