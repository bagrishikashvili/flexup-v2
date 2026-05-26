import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@flexup/shared';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '@/shared/api/client';
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

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
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

function ForgotPasswordPage() {
  const { t, i18n } = useTranslation('auth');
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '', language: (i18n.language as 'ka' | 'en') ?? 'ka' },
  });

  const mutation = useMutation({
    mutationFn: (data: ForgotPasswordInput) =>
      apiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: data,
        skipAuth: true,
      }),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      // Always show generic success — never reveal server errors to attacker
      setSubmitted(true);
    },
  });

  if (submitted) {
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
              <CardTitle className="text-2xl">{t('forgotPassword.title')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {t('forgotPassword.success')}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void navigate({ to: '/auth/login' })}
              >
                {t('forgotPassword.backToLogin')}
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground font-mono">
            FLEXUP © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    );
  }

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
            <CardTitle className="text-2xl">{t('forgotPassword.title')}</CardTitle>
            <CardDescription>{t('forgotPassword.description')}</CardDescription>
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
                      <FormLabel>{t('forgotPassword.emailLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          autoComplete="email"
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
                    ? t('forgotPassword.loading')
                    : t('forgotPassword.submit')}
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-1">
                  <Link
                    to="/auth/login"
                    className="text-primary font-medium hover:underline"
                  >
                    {t('forgotPassword.backToLogin')}
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
