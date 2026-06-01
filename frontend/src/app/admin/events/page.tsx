'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi, categoriesApi, eventsApi } from '@/lib/api';
import { Event } from '@/types';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

interface Category {
  id: number;
  name: string;
}

const emptyForm = {
  title: '',
  description: '',
  date: '',
  time: '09:00',
  location: '',
  capacity: '100',
  categoryId: '',
};

export default function AdminEventsPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      loadData();
    }
  }, [isAuthenticated, isAdmin, authLoading]);

  const loadData = async () => {
    try {
      const [eventsData, categoriesData] = await Promise.all([
        adminApi.getAllEvents(),
        categoriesApi.getAll() as Promise<Category[]>,
      ]);
      setEvents(eventsData);
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setForm((f) => ({
          ...f,
          categoryId: f.categoryId || String(categoriesData[0].id),
        }));
      } else {
        error('Nenhuma categoria no banco. Recarregue a página para criar as padrões.');
      }
    } catch {
      error('Falha ao carregar eventos ou categorias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) {
      error('Selecione uma categoria');
      return;
    }

    setIsSaving(true);
    try {
      const created = await eventsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        imageUrl: '',
        category: '',
        price: 0,
        capacity: Number(form.capacity),
        categoryId: Number(form.categoryId),
      });
      success('Evento criado com sucesso!');
      setEvents((prev) => [created, ...prev]);
      setForm({
        ...emptyForm,
        categoryId: form.categoryId,
      });
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
          ? String((err.response.data as { message: string }).message)
          : 'Falha ao criar evento';
      error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este evento?')) return;
    try {
      await eventsApi.delete(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      success('Evento excluído');
    } catch {
      error('Falha ao excluir evento');
    }
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-10">
        <div className="container mx-auto px-4">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar ao painel admin
          </Link>
          <h1 className="text-3xl font-bold">Gerenciar eventos</h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie eventos da plataforma (somente administrador)
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Criar novo evento
              </CardTitle>
              <CardDescription>
                Preencha os campos abaixo. O evento ficará ativo imediatamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Festival de Música"
                    required
                    minLength={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descreva o evento..."
                    required
                    rows={4}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input
                      id="time"
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Local *</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ex: Auditório Central"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacidade *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min={1}
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Categoria *</Label>
                    {categories.length === 0 ? (
                      <p className="text-sm text-destructive">
                        Nenhuma categoria disponível. Recarregue a página.
                      </p>
                    ) : (
                      <Select
                        id="categoryId"
                        value={form.categoryId}
                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                        required
                      >
                        <option value="" disabled>
                          Selecione uma categoria
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSaving || categories.length === 0}
                >
                  {isSaving ? 'Criando...' : 'Criar evento'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Eventos cadastrados ({events.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum evento ainda. Crie o primeiro ao lado.
                </p>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.date} {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.availableTickets}/{event.capacity} vagas
                        </span>
                        <span className="w-full text-primary">
                          {event.category || 'Sem categoria'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Link href={`/events/${event.id}`}>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
