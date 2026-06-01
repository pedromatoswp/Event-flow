'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, QrCode, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ticketsApi } from '@/lib/api';
import { Ticket as TicketType } from '@/types';
import { PLACEHOLDER_EVENT_IMAGE } from '@/lib/constants';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { error, success } = useToast();
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated && ticketId) loadTicket();
  }, [isAuthenticated, authLoading, ticketId]);

  const loadTicket = async () => {
    try {
      const data = await ticketsApi.getById(ticketId);
      setTicket(data);
    } catch {
      error('Ingresso não encontrado');
      router.push('/tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!ticket || !confirm('Cancelar este ingresso?')) return;
    try {
      await ticketsApi.cancel(ticket.id);
      success('Ingresso cancelado');
      router.push('/tickets');
    } catch {
      error('Não foi possível cancelar');
    }
  };

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/tickets" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Meus ingressos
        </Link>

        <Card>
          <div className="h-40 overflow-hidden rounded-t-lg">
            <img
              src={ticket.event?.imageUrl || PLACEHOLDER_EVENT_IMAGE}
              alt={ticket.event?.title ?? 'Evento'}
              className="w-full h-full object-cover"
            />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              {ticket.event?.title ?? 'Ingresso'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.event && (
              <>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {ticket.event.date} às {ticket.event.time}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {ticket.event.location}
                </p>
              </>
            )}
            <p className="text-sm">
              Comprado em:{' '}
              <span className="font-medium">
                {new Date(ticket.purchaseDate).toLocaleString('pt-BR')}
              </span>
            </p>
            <p className="text-sm">
              Status:{' '}
              <span className="font-medium capitalize">{ticket.status}</span>
            </p>
            {ticket.qrCode && (
              <div className="p-4 rounded-lg bg-muted text-center">
                <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs break-all font-mono">{ticket.qrCode}</p>
              </div>
            )}
            {ticket.status === 'active' && (
              <Button variant="destructive" className="w-full" onClick={handleCancel}>
                Cancelar ingresso
              </Button>
            )}
            {ticket.event && (
              <Link href={`/events/${ticket.eventId}`}>
                <Button variant="outline" className="w-full">
                  Ver evento
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
