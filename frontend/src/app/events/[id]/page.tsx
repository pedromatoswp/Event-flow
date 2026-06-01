'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Heart, Share2, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { eventsApi, ticketsApi } from '@/lib/api';
import { Event } from '@/types';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [params.id]);

  const loadEvent = async () => {
    try {
      const data = await eventsApi.getById(params.id as string);
      setEvent(data);
    } catch (err) {
      error('Failed to load event details');
      router.push('/events');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      error('Please login to purchase tickets');
      router.push('/login');
      return;
    }

    if (!event || event.availableTickets === 0) {
      error('No tickets available');
      return;
    }

    setIsPurchasing(true);
    try {
      await ticketsApi.purchase(event.id);
      success('Ticket purchased successfully!');
      router.push('/tickets');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to purchase ticket');
    } finally {
      setIsPurchasing(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      error('Please login to favorite events');
      return;
    }

    try {
      const updatedEvent = await eventsApi.toggleFavorite(event!.id);
      setEvent(updatedEvent);
      success(updatedEvent.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (err) {
      error('Failed to update favorites');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Event not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative h-64 md:h-96">
        <img
          src={event.imageUrl || '/placeholder-event.svg'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-8">
          <Link href="/events">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                {event.category.toUpperCase()}
              </span>
              {event.isFavorite && (
                <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-sm font-medium">
                  ❤️ Favorited
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{event.title}</h1>
            <p className="text-xl text-muted-foreground">{event.description}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">{event.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Capacity</p>
                      <p className="text-muted-foreground">
                        {event.availableTickets} of {event.capacity} tickets available
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="sticky top-4"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Price</p>
                    <p className="text-4xl font-bold">${event.price}</p>
                    <p className="text-sm text-muted-foreground">per person</p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handlePurchase}
                      disabled={isPurchasing || event.availableTickets === 0}
                    >
                      {isPurchasing ? (
                        'Processing...'
                      ) : event.availableTickets === 0 ? (
                        'Sold Out'
                      ) : (
                        <>
                          <Ticket className="h-4 w-4 mr-2" />
                          Purchase Ticket
                        </>
                      )}
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={toggleFavorite}
                        disabled={!isAuthenticated}
                      >
                        <Heart
                          className={`h-4 w-4 mr-2 ${
                            event.isFavorite ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                        {event.isFavorite ? 'Favorited' : 'Favorite'}
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      By purchasing a ticket, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Organizer</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {event.organizer?.name.charAt(0).toUpperCase() || 'E'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{event.organizer?.name || 'Event Organizer'}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.organizer?.email || 'contact@eventflow.com'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
