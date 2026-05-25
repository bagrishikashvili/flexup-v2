import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useTranslation('auth');

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{t('register.title')}</h1>
        <p className="text-muted-foreground mb-4">{t('register.hasAccount')}</p>
        <Link to="/auth/login" className="text-primary hover:underline">
          {t('register.login')}
        </Link>
      </div>
    </div>
  );
}
