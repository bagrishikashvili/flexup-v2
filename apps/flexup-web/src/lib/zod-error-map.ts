import { i18n } from './i18n';

// Supports both Zod v3 and v4 error codes
export const zodI18nErrorMap: any = (issue: any, ctx: any) => {
  const t = (key: string) => i18n.t(key, { ns: 'validation' });

  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined' || issue.received === 'null') {
        return { message: t('required') };
      }
      break;

    // Zod v4: invalid_format replaces invalid_string
    case 'invalid_format': {
      const fmt = (issue as { format?: string }).format;
      if (fmt === 'email') return { message: t('invalidEmail') };
      if (fmt === 'regex') return { message: t('invalidFormat') };
      break;
    }

    // Zod v3 compat
    case 'invalid_string': {
      const v = (issue as { validation?: string }).validation;
      if (v === 'email') return { message: t('invalidEmail') };
      if (v === 'regex') return { message: t('invalidFormat') };
      break;
    }

    case 'too_small':
      if (issue.minimum === 1) return { message: t('required') };
      return { message: t('tooShort') };

    case 'too_big':
      return { message: t('tooLong') };

    case 'invalid_enum_value':
      return { message: t('invalidOption') };
  }

  return { message: ctx?.defaultError ?? (issue as { message?: string }).message ?? 'Invalid input' };
};
