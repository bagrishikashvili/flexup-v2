import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@/lib/zod-resolver';
import { loginSchema, type LoginInput, type AuthResponseWithoutRefresh } from '@flexup/shared';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect } from 'react';
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

const searchSchema = z.object({
  reset: z.literal('success').optional(),
});

export const Route = createFileRoute('/auth/login')({
  validateSearch: searchSchema,
  component: LoginPage,
});

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-bold text-[30px]" style={{ fontFamily: 'var(--font-display)' }}>
        Flex<span className="gradient-text">Up</span>
      </span>
    </div>
  );
}

function LoginPage() {
  const { t } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { reset } = Route.useSearch();

  useEffect(() => {
    if (reset === 'success') {
      toast.success(t('resetPassword.success'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: LoginInput) =>
      apiRequest<AuthResponseWithoutRefresh>('/auth/login', {
        method: 'POST',
        body: data,
        skipAuth: true,
      }),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      if (data.user.role === 'COMPANY_USER' && !data.user.emailVerified) {
        void navigate({ to: '/auth/verify-gate' });
      } else {
        void navigate({ to: '/dashboard' });
      }
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : 'UNKNOWN_ERROR';
      toast.error(tErrors(code, { defaultValue: tErrors('UNKNOWN_ERROR') }));
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
          <div className="h-1 w-full" style={{ background: 'var(--gradient-brain)' }} />
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
            <CardDescription>{t('login.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('login.emailPlaceholder')}
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>{t('login.password')}</FormLabel>
                        <Link
                          to="/auth/forgot-password"
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          {t('login.forgotPassword')}
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t('login.passwordPlaceholder')}
                          autoComplete="current-password"
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
                  {mutation.isPending ? t('login.loading') : t('login.submit')}
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-1">
                  {t('login.noAccount')}{' '}
                  <Link
                    to="/auth/register"
                    className="text-primary font-medium hover:underline"
                  >
                    {t('login.register')}
                  </Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground font-mono">
          FLEXUP © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
