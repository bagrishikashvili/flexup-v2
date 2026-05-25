import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useTranslation, Trans } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiRequest, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { Mail } from 'lucide-react';

export const Route = createFileRoute('/auth/verify-gate')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
    if (user?.emailVerified) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: VerifyGatePage,
});

function VerifyGatePage() {
  const { t, i18n } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const resendMutation = useMutation({
    mutationFn: () =>
      apiRequest<void>('/auth/resend-verification', {
        method: 'POST',
        body: { language: i18n.language === 'en' ? 'en' : 'ka' },
      }),
    onSuccess: () => {
      toast.success(t('verifyGate.resendSuccess'));
      setCooldown(60);
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : 'UNKNOWN_ERROR';
      toast.error(tErrors(code, { defaultValue: tErrors('UNKNOWN_ERROR') }));
      if (code === 'VERIFICATION_RESEND_COOLDOWN') {
        setCooldown(60);
      }
    },
  });

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    logout();
    void navigate({ to: '/auth/register' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
        <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
          {t('logout')}
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t('verifyGate.title')}</CardTitle>
          <CardDescription>{t('verifyGate.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            <Trans
              i18nKey="verifyGate.body"
              ns="auth"
              values={{ email: user?.email }}
              components={{ strong: <strong className="text-foreground" /> }}
            />
          </p>

          <Button
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending || cooldown > 0}
            className="w-full"
            variant="outline"
          >
            {resendMutation.isPending
              ? t('verifyGate.resending')
              : cooldown > 0
              ? t('verifyGate.resendCooldown', { seconds: cooldown })
              : t('verifyGate.resend')}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {t('verifyGate.wrongEmail')}
            <button
              onClick={() => void handleLogout()}
              className="text-primary hover:underline"
            >
              {t('verifyGate.logoutAndRegister')}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
