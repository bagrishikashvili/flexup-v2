import type { ZodErrorMap } from 'zod';
import { i18n } from './i18n';

// Zod v3 error map — second arg `ctx` has `ctx.defaultError` as fallback
export const zodI18nErrorMap: ZodErrorMap = (issue, ctx) => {
  const t = (key: string) => i18n.t(key, { ns: 'validation' });

  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined' || issue.received === 'null') {
        return { message: t('required') };
      }
      break;
    case 'invalid_string':
      if (issue.validation === 'email') return { message: t('invalidEmail') };
      if (issue.validation === 'regex') return { message: t('invalidFormat') };
      break;
    case 'too_small':
      if (issue.minimum === 1) return { message: t('required') };
      return { message: t('tooShort') };
    case 'too_big':
      return { message: t('tooLong') };
    case 'invalid_enum_value':
      return { message: t('invalidOption') };
  }

  return { message: ctx.defaultError };
};
