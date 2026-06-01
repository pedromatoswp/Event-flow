import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="min-h-screen container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Termos de uso</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert text-muted-foreground space-y-4">
          <p>
            O EventFlow é um projeto educacional para gestão e descoberta de eventos. Ao usar a
            plataforma, você concorda em fornecer informações verdadeiras no cadastro e em não
            utilizar o sistema de forma abusiva.
          </p>
          <p>
            Ingressos e eventos são de responsabilidade dos organizadores cadastrados. Reservamo-nos
            o direito de suspender contas que violem estas regras.
          </p>
          <Link href="/register">
            <Button variant="outline">Voltar ao cadastro</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
