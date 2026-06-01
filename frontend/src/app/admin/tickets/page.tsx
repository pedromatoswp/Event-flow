'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Ticket } from 'lucide-react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import { Ticket as TicketType } from '@/types';
import { useToast } from '@/hooks/useToast';

export default function AdminTicketsPage() {
  const { error } = useToast();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getAllTickets()
      .then(setTickets)
      .catch(() => error('Falha ao carregar ingressos'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-10">
          <div className="container mx-auto px-4">
            <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar ao painel admin
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Ticket className="h-8 w-8" />
              Todos os ingressos
            </h1>
            <p className="text-muted-foreground mt-1">{tickets.length} vendidos / registrados</p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Ingressos da plataforma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-muted-foreground text-center py-8">Carregando...</p>
              ) : tickets.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum ingresso</p>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{t.event?.title ?? `Evento #${t.eventId}`}</p>
                      <p className="text-sm text-muted-foreground">
                        Ingresso #{t.id} · Usuário #{t.userId}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(t.purchaseDate).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.status === 'active'
                          ? 'bg-green-500/10 text-green-600'
                          : t.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminGuard>
  );
}
