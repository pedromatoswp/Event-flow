import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Política de privacidade</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-4">
          <p>
            Coletamos apenas os dados necessários para o funcionamento do EventFlow: nome, e-mail e
            informações de ingressos comprados.
          </p>
          <p>
            Seus dados não são vendidos a terceiros. Tokens de autenticação ficam armazenados
            localmente no seu navegador durante a sessão.
          </p>
          <Link href="/register">
            <Button variant="outline">Voltar ao cadastro</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
