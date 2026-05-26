import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiRequest, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { Loader2, XCircle } from 'lucide-react';

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
});

type ResetFormInput = {
  newPassword: string;
  confirmPassword: string;
};

type TokenState =
  | { kind: 'checking' }
  | { kind: 'valid'; maskedEmail: string }
  | { kind: 'invalid' };

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="font-bold text-[30px]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Flex<span className="gradient-text">Up</span>
      </span>
    </div>
  );
}

function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const logoutAuth = useAuthStore((s) => s.logout);
  const { token } = Route.useSearch();

  const [tokenState, setTokenState] = useState<TokenState>(
    token ? { kind: 'checking' } : { kind: 'invalid' },
  );

  useEffect(() => {
    if (!token) {
      setTokenState({ kind: 'invalid' });
      return;
    }

    apiRequest<{ valid: boolean; email?: string }>(
      '/auth/reset-password/validate',
      { method: 'POST', body: { token }, skipAuth: true },
    )
      .then((res) => {
        setTokenState(
          res.valid
            ? { kind: 'valid', maskedEmail: res.email ?? '' }
            : { kind: 'invalid' },
        );
      })
      .catch(() => setTokenState({ kind: 'invalid' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const form = useForm<ResetFormInput>({
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: (data: ResetFormInput) =>
      apiRequest<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: { token: token ?? '', newPassword: data.newPassword },
        skipAuth: true,
      }),
    onSuccess: () => {
      logoutAuth();
      void navigate({ to: '/auth/login', search: { reset: 'success' } });
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : 'UNKNOWN_ERROR';
      if (
        code === 'PASSWORD_RESET_TOKEN_USED' ||
        code === 'PASSWORD_RESET_TOKEN_EXPIRED' ||
        code === 'PASSWORD_RESET_TOKEN_INVALID'
      ) {
        setTokenState({ kind: 'invalid' });
      } else {
        toast.error(t('resetPassword.invalidLink'));
      }
    },
  });

  return (
    <div className="min-h-screen bg-[#fff] flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[440px] flex flex-col gap-6">
        <div className="flex justify-center">
          <BrandLogo />
        </div>

        <Card className="shadow-[var(--shadow-md)] overflow-hidden">
          <div
            className="h-1 w-full"
            style={{ background: 'var(--gradient-brain)' }}
          />

          {tokenState.kind === 'checking' && (
            <>
              <CardHeader className="pb-4 text-center">
                <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin" />
              </CardHeader>
              <CardContent />
            </>
          )}

          {tokenState.kind === 'invalid' && (
            <>
              <CardHeader className="pb-4">
                <div className="flex justify-center mb-2">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <CardTitle className="text-2xl text-center">
                  {t('resetPassword.title')}
                </CardTitle>
                <CardDescription className="text-center">
                  {t('resetPassword.invalidLink')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button
                  className="w-full"
                  onClick={() =>
                    void navigate({ to: '/auth/forgot-password' })
                  }
                >
                  {t('resetPassword.requestNewLink')}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    to="/auth/login"
                    className="text-primary font-medium hover:underline"
                  >
                    {t('forgotPassword.backToLogin')}
                  </Link>
                </p>
              </CardContent>
            </>
          )}

          {tokenState.kind === 'valid' && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">
                  {t('resetPassword.title')}
                </CardTitle>
                <CardDescription>
                  {t('resetPassword.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) =>
                      mutation.mutate(data),
                    )}
                    className="flex flex-col gap-4"
                  >
                    <FormField
                      control={form.control}
                      name="newPassword"
                      rules={{
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters',
                        },
                        pattern: {
                          value: /^(?=.*[a-zA-Z])(?=.*[0-9]).+$/,
                          message:
                            'Password must contain at least one letter and one number',
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('resetPassword.newPassword')}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t(
                                'resetPassword.newPasswordPlaceholder',
                              )}
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      rules={{
                        validate: (val) =>
                          val === form.getValues('newPassword') ||
                          t('resetPassword.passwordMismatch'),
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('resetPassword.confirmPassword')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t(
                                'resetPassword.confirmPasswordPlaceholder',
                              )}
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full mt-2"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending
                        ? t('resetPassword.loading')
                        : t('resetPassword.submit')}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground font-mono">
          FLEXUP © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
