import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export function CompanyEmptyState() {
  const { t } = useTranslation('companies');

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(102,71,240,0.1), rgba(0,145,255,0.1))' }}
      >
        <Building2 className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>
      <h2
        className="text-2xl font-bold text-foreground mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('createFirstTitle')}
      </h2>
      <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">
        {t('createFirstDescription')}
      </p>
      <Button asChild>
        <Link to="/app/onboarding/company">{t('createCompany')}</Link>
      </Button>
    </div>
  );
}
