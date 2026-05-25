import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { registerSchema, type RegisterInput, type AuthResponseWithoutRefresh, UserRole } from '@flexup/shared';
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

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
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

function RegisterPage() {
  const { t, i18n } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: UserRole.COMPANY_USER,
      language: i18n.language === 'en' ? 'en' : 'ka',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: RegisterInput) =>
      apiRequest<AuthResponseWithoutRefresh>('/auth/register', {
        method: 'POST',
        body: { ...data, language: i18n.language === 'en' ? 'en' : 'ka' },
        skipAuth: true,
      }),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      // Route via index — will redirect to verify-gate if not verified
      void navigate({ to: '/' });
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : 'UNKNOWN_ERROR';
      toast.error(tErrors(code, { defaultValue: tErrors('UNKNOWN_ERROR') }));
    },
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
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
            <CardTitle className="text-2xl">{t('register.title')}</CardTitle>
            <CardDescription>{t('register.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                className="flex flex-col gap-4"
              >
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('register.firstName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('register.firstNamePlaceholder')}
                            autoComplete="given-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('register.lastName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('register.lastNamePlaceholder')}
                            autoComplete="family-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('register.emailPlaceholder')}
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
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.phoneNumber')}</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder={t('register.phoneNumberPlaceholder')}
                          autoComplete="tel"
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
                      <FormLabel>{t('register.password')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t('register.passwordPlaceholder')}
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {t('register.passwordHint')}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? t('register.loading') : t('register.submit')}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {t('register.terms')}
                </p>

                <p className="text-center text-sm text-muted-foreground pt-1">
                  {t('register.hasAccount')}{' '}
                  <Link
                    to="/auth/login"
                    className="text-primary font-medium hover:underline"
                  >
                    {t('register.login')}
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
