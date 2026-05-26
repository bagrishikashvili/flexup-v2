import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ApiError } from '@/shared/api/client';
import { uploadCompanyLogo, removeCompanyLogo } from '../api/companies.api';
import { companyQueryKeys } from '../api/companies.queries';
import type { CompanyDetailResponse } from '@flexup/shared';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface CompanyLogoUploaderProps {
  company: CompanyDetailResponse;
}

function CompanyLogoPreview({ company }: { company: CompanyDetailResponse }) {
  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (company.logoUrl) {
    return (
      <img
        src={company.logoUrl}
        alt={company.name}
        className="w-20 h-20 rounded-xl object-cover"
      />
    );
  }

  return (
    <div
      className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
      style={{ background: 'var(--gradient-cool)' }}
    >
      {initials}
    </div>
  );
}

export function CompanyLogoUploader({ company }: CompanyLogoUploaderProps) {
  const { t } = useTranslation('companies');
  const { t: tErrors } = useTranslation('errors');
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadCompanyLogo(company.id, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyQueryKeys.detail(company.id) });
      await queryClient.invalidateQueries({ queryKey: companyQueryKeys.mine() });
      toast.success(t('logoUpdated'));
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.status === 413) {
          toast.error(t('logoFileTooLarge'));
        } else {
          toast.error(tErrors(error.code, { defaultValue: t('genericError') }));
        }
      } else {
        toast.error(t('genericError'));
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeCompanyLogo(company.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyQueryKeys.detail(company.id) });
      await queryClient.invalidateQueries({ queryKey: companyQueryKeys.mine() });
      toast.success(t('logoRemoved'));
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : 'UNKNOWN_ERROR';
      toast.error(tErrors(code, { defaultValue: t('genericError') }));
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t('logoInvalidType'));
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(t('logoFileTooLarge'));
      e.target.value = '';
      return;
    }

    uploadMutation.mutate(file);
    e.target.value = '';
  };

  const isLoading = uploadMutation.isPending || removeMutation.isPending;

  return (
    <div className="flex items-center gap-6">
      <CompanyLogoPreview company={company} />

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">{t('logoHint')}</p>
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5" />
            {company.logoUrl ? t('changeLogo') : t('uploadLogo')}
          </Button>
          {company.logoUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => removeMutation.mutate()}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('removeLogo')}
            </Button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
