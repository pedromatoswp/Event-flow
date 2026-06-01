'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import { User } from '@/types';
import { useToast } from '@/hooks/useToast';

export default function AdminUsersPage() {
  const { error } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getAllUsers()
      .then(setUsers)
      .catch(() => error('Falha ao carregar usuários'))
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
              <Users className="h-8 w-8" />
              Usuários
            </h1>
            <p className="text-muted-foreground mt-1">{users.length} cadastrados</p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Lista de usuários</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-center py-8">Carregando...</p>
              ) : users.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum usuário encontrado</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4">ID</th>
                        <th className="pb-3 pr-4">Nome</th>
                        <th className="pb-3 pr-4">E-mail</th>
                        <th className="pb-3 pr-4">Perfil</th>
                        <th className="pb-3">Cadastro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="py-3 pr-4">{u.id}</td>
                          <td className="py-3 pr-4 font-medium">{u.name}</td>
                          <td className="py-3 pr-4">{u.email}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                u.role === 'admin'
                                  ? 'bg-primary/15 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {u.role === 'admin' ? 'Admin' : 'Usuário'}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString('pt-BR')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminGuard>
  );
}
