import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { zodResolver } from '@/lib/zod-resolver';
import { createCompanySchema, type CreateCompanyInput } from '@flexup/shared';
import { ApiError } from '@/shared/api/client';
import { createCompany } from '../api/companies.api';
import { companyQueryKeys } from '../api/companies.queries';
import { useCompanyStore } from '../stores/company.store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import type { CompanyDetailResponse } from '@flexup/shared';

interface CompanyCreateFormProps {
  onSuccess: (company: CompanyDetailResponse) => void;
}

export function CompanyCreateForm({ onSuccess }: CompanyCreateFormProps) {
  const { t } = useTranslation('companies');
  const { t: tErrors } = useTranslation('errors');
  const queryClient = useQueryClient();
  const setActiveCompanyId = useCompanyStore((s) => s.setActiveCompanyId);

  const form = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
      legalName: '',
      registrationNumber: '',
      vatNumber: '',
      websiteUrl: '',
      defaultCurrency: 'GEL',
    },
  });

  const mutation = useMutation({
    mutationFn: createCompany,
    onSuccess: async (company) => {
      setActiveCompanyId(company.id);
      await queryClient.invalidateQueries({ queryKey: companyQueryKeys.mine() });
      toast.success(t('companyCreated'));
      onSuccess(company);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.response.details && Array.isArray(error.response.details)) {
          for (const detail of error.response.details as { field: string; message: string }[]) {
            form.setError(detail.field as keyof CreateCompanyInput, { message: detail.message });
          }
          return;
        }
        toast.error(tErrors(error.code, { defaultValue: t('genericError') }));
      } else {
        toast.error(t('genericError'));
      }
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          const payload = Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== '' && v !== undefined),
          ) as CreateCompanyInput;
          mutation.mutate(payload);
        })}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('companyName')} *</FormLabel>
              <FormControl>
                <Input placeholder={t('companyNamePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="legalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('legalName')}</FormLabel>
              <FormControl>
                <Input placeholder={t('legalNamePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="registrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('registrationNumber')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('registrationNumberPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vatNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('vatNumber')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('vatNumberPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('websiteUrl')}</FormLabel>
              <FormControl>
                <Input type="url" placeholder={t('websiteUrlPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('defaultCurrency')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('defaultCurrencyPlaceholder')}
                  maxLength={3}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending} className="mt-2">
          {mutation.isPending ? t('creating') : t('createCompany')}
        </Button>
      </form>
    </Form>
  );
}
