import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { apiRequest, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute('/auth/verify-email')({
  validateSearch: searchSchema,
  component: VerifyEmailPage,
});

type VerifyState =
  | { kind: 'verifying' }
  | { kind: 'success' }
  | { kind: 'error'; code: string };

function VerifyEmailPage() {
  const { t } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [state, setState] = useState<VerifyState>({ kind: 'verifying' });

  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', code: 'VERIFICATION_TOKEN_INVALID' });
      return;
    }

    apiRequest<{ success: true }>('/auth/verify-email', {
      method: 'POST',
      body: { token },
      skipAuth: true,
    })
      .then(() => {
        setState({ kind: 'success' });
        if (user && accessToken) {
          setAuth(accessToken, { ...user, emailVerified: true });
        }
        setTimeout(() => void navigate({ to: '/dashboard' }), 2000);
      })
      .catch((err: unknown) => {
        const code = err instanceof ApiError ? err.code : 'UNKNOWN_ERROR';
        setState({ kind: 'error', code });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {state.kind === 'verifying' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
              <CardTitle className="mt-4">{t('verifyEmail.verifying')}</CardTitle>
            </>
          )}
          {state.kind === 'success' && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <CardTitle className="mt-4">{t('verifyEmail.successTitle')}</CardTitle>
            </>
          )}
          {state.kind === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <CardTitle className="mt-4">{t('verifyEmail.errorTitle')}</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state.kind === 'success' && (
            <p className="text-sm text-muted-foreground">{t('verifyEmail.successBody')}</p>
          )}
          {state.kind === 'error' && (
            <>
              <p className="text-sm text-muted-foreground">
                {tErrors(state.code, { defaultValue: tErrors('UNKNOWN_ERROR') })}
              </p>
              <Button onClick={() => void navigate({ to: '/auth/login' })}>
                {t('verifyEmail.goToLogin')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
