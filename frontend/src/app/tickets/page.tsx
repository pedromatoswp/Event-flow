'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, QrCode, Download, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ticketsApi } from '@/lib/api';
import { Ticket as TicketType } from '@/types';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

export default function TicketsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadTickets();
    }
  }, [isAuthenticated, authLoading]);

  const loadTickets = async () => {
    try {
      const data = await ticketsApi.getByUser();
      setTickets(data);
    } catch (err) {
      error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId: string) => {
    try {
      await ticketsApi.cancel(ticketId);
      success('Ticket cancelled successfully');
      loadTickets();
    } catch (err) {
      error('Failed to cancel ticket');
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
            <h1 className="text-4xl font-bold mb-2">My Tickets</h1>
            <p className="text-xl text-muted-foreground">
              Manage your event tickets
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        {tickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't purchased any event tickets
            </p>
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-32 bg-gradient-to-br from-primary/20 to-secondary/20">
                    <img
                      src={ticket.event?.imageUrl || '/placeholder-event.svg'}
                      alt={ticket.event?.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ticket.status === 'active'
                            ? 'bg-green-500 text-white'
                            : ticket.status === 'used'
                            ? 'bg-blue-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {ticket.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {ticket.event?.title}
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {ticket.event?.date
                            ? new Date(ticket.event.date).toLocaleDateString()
                            : 'TBD'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{ticket.event?.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedTicket(ticket)}
                        disabled={ticket.status !== 'active'}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        View QR
                      </Button>
                      {ticket.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelTicket(ticket.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* QR Code Modal */}
      {selectedTicket && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Ticket QR Code</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center mb-4">
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <QrCode className="h-48 w-48 text-black" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Show this QR code at the event entrance
              </p>
              <p className="text-xs text-muted-foreground">
                Ticket ID: {selectedTicket.id}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
