'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Bell, Calendar, Plus, Shield } from 'lucide-react';

const navLinks = [
  { href: '/events', label: 'Eventos' },
  { href: '/dashboard', label: 'Dashboard', protected: true },
  { href: '/tickets', label: 'Ingressos', protected: true },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.protected && !user) return null;
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={active ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    {link.label}
                  </Button>
                </Link>
              );
            })}
            {user && isAdmin && (
              <>
                <Link href="/admin">
                  <Button
                    variant={pathname.startsWith('/admin') && pathname !== '/admin/events' ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                </Link>
                <Link href="/admin/events">
                  <Button
                    variant={pathname === '/admin/events' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Criar evento
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user && (
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Bell className="h-5 w-5" />
            </Button>
          )}

          {user ? (
            <>
              <Link href="/profile" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  {user.name}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="hidden lg:flex">
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Cadastrar</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {user && isAdmin && (
        <div className="md:hidden flex gap-2 px-4 pb-3 overflow-x-auto">
          <Link href="/admin/events">
            <Button size="sm" className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-1" />
              Criar evento
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="sm" variant="outline" className="whitespace-nowrap">
              <Shield className="h-4 w-4 mr-1" />
              Admin
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
