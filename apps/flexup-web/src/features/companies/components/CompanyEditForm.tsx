import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { zodResolver } from '@/lib/zod-resolver';
import { updateCompanySchema, type UpdateCompanyInput, type CompanyDetailResponse } from '@flexup/shared';
import { ApiError } from '@/shared/api/client';
import { updateCompany } from '../api/companies.api';
import { companyQueryKeys } from '../api/companies.queries';
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

interface CompanyEditFormProps {
  company: CompanyDetailResponse;
}

export function CompanyEditForm({ company }: CompanyEditFormProps) {
  const { t } = useTranslation('companies');
  const { t: tErrors } = useTranslation('errors');
  const queryClient = useQueryClient();

  const form = useForm<UpdateCompanyInput>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      name: company.name,
      legalName: company.legalName ?? '',
      registrationNumber: company.registrationNumber ?? '',
      vatNumber: company.vatNumber ?? '',
      websiteUrl: company.websiteUrl ?? '',
      defaultCurrency: company.defaultCurrency,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateCompanyInput) => updateCompany(company.id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyQueryKeys.mine() });
      await queryClient.invalidateQueries({ queryKey: companyQueryKeys.detail(company.id) });
      toast.success(t('companyUpdated'));
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.response.details && Array.isArray(error.response.details)) {
          for (const detail of error.response.details as { field: string; message: string }[]) {
            form.setError(detail.field as keyof UpdateCompanyInput, { message: detail.message });
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
          ) as UpdateCompanyInput;
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
                <Input {...field} />
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
                <Input {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
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
                <Input type="url" {...field} />
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
                  maxLength={3}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
