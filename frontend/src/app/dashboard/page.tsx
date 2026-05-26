'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Ticket, Heart, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { eventsApi, ticketsApi } from '@/lib/api';
import { Event, Ticket as TicketType } from '@/types';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { error } = useToast();
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [myTickets, setMyTickets] = useState<TicketType[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, authLoading]);

  const loadDashboardData = async () => {
    try {
      const [events, tickets, favorites] = await Promise.all([
        eventsApi.getAll().then((data) => data.slice(0, 6)),
        ticketsApi.getByUser(),
        eventsApi.getFavorites(),
      ]);

      setRecentEvents(events);
      setMyTickets(tickets);
      setFavoriteEvents(favorites);
    } catch (err) {
      error('Failed to load dashboard data');
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
            <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-xl text-muted-foreground">
              Here's what's happening with your events
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 -mt-6">
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">My Tickets</p>
                    <p className="text-3xl font-bold">{myTickets.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Favorites</p>
                    <p className="text-3xl font-bold">{favoriteEvents.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Upcoming Events</p>
                    <p className="text-3xl font-bold">
                      {myTickets.filter((t) => t.status === 'active').length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Events</CardTitle>
                  <Link href="/events">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No events available</p>
                ) : (
                  <div className="space-y-4">
                    {recentEvents.slice(0, 4).map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`}>
                        <div className="flex gap-4 p-4 rounded-lg hover:bg-accent transition-colors">
                          <img
                            src={event.imageUrl || '/placeholder-event.jpg'}
                            alt={event.title}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">{event.location}</p>
                            <p className="text-sm font-medium text-primary mt-1">${event.price}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* My Tickets */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Tickets</CardTitle>
                  <Link href="/tickets">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {myTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't purchased any tickets yet</p>
                    <Link href="/events">
                      <Button>Browse Events</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myTickets.slice(0, 4).map((ticket) => (
                      <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                        <div className="flex gap-4 p-4 rounded-lg hover:bg-accent transition-colors">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Ticket className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{ticket.event?.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(ticket.purchaseDate).toLocaleDateString()}
                            </p>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                ticket.status === 'active'
                                  ? 'bg-green-500/10 text-green-500'
                                  : ticket.status === 'used'
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-red-500/10 text-red-500'
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Favorite Events */}
        {favoriteEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Favorite Events</CardTitle>
                  <Link href="/favorites">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {favoriteEvents.slice(0, 3).map((event) => (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <Card className="hover:shadow-lg transition-shadow">
                        <div className="relative h-32">
                          <img
                            src={event.imageUrl || '/placeholder-event.jpg'}
                            alt={event.title}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold truncate mb-2">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.location}</p>
                          <p className="text-sm font-medium text-primary mt-2">${event.price}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </section>
    </div>
  );
}
