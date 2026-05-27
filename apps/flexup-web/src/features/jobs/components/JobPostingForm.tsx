import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { AddressAutocomplete, type AddressResult } from '@/shared/components/AddressAutocomplete';
import {
  useSections,
  useCategories,
  useSkills,
  useAppearances,
  useLanguages,
} from '@/features/jobs/api/reference-data.api';
import type { JobCategoryResponse } from '@flexup/shared';

export interface JobFormValues {
  categoryId: string;
  title: string;
  briefing: string;
  addressLine: string;
  city: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  contactPersonName: string;
  contactPersonPhone: string;
  skillIds: string[];
  appearanceIds: string[];
  languageIds: string[];
}

const EMPTY: JobFormValues = {
  categoryId: '',
  title: '',
  briefing: '',
  addressLine: '',
  city: '',
  country: 'GE',
  postalCode: '',
  contactPersonName: '',
  contactPersonPhone: '',
  skillIds: [],
  appearanceIds: [],
  languageIds: [],
};

interface Props {
  defaultValues?: JobFormValues;
  onSubmit: (values: JobFormValues) => Promise<unknown>;
  isLoading: boolean;
  error: Error | null;
}

export function JobPostingForm({ defaultValues, onSubmit, isLoading, error }: Props) {
  const { t, i18n } = useTranslation('jobs');
  const [values, setValues] = useState<JobFormValues>(defaultValues ?? EMPTY);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  const { data: sections } = useSections();
  const { data: categories } = useCategories(selectedSectionId || undefined);
  const { data: skills } = useSkills();
  const { data: appearances } = useAppearances();
  const { data: languages } = useLanguages();

  function set<K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleArrayItem(
    key: 'skillIds' | 'appearanceIds' | 'languageIds',
    id: string,
  ) {
    setValues((v) => {
      const current = v[key];
      return {
        ...v,
        [key]: current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      };
    });
  }

  function handleAddressSelect(result: AddressResult) {
    setValues((v) => ({
      ...v,
      addressLine: result.displayName,
      city: result.city,
      country: result.country || 'GE',
      postalCode: result.postalCode ?? '',
      latitude: result.latitude,
      longitude: result.longitude,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(values);
  }

  const briefingLength = values.briefing.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basics */}
      <Section label={t('form.sections.basics')}>
        <Field label={t('form.section')}>
          <select
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedSectionId}
            onChange={(e) => {
              setSelectedSectionId(e.target.value);
              set('categoryId', '');
            }}
          >
            <option value="">{t('form.sectionPlaceholder')}</option>
            {sections?.map((s) => (
              <option key={s.id} value={s.id}>
                {i18n.language === 'ka' ? s.nameKa : s.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('form.category')}>
          <select
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={values.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            required
            disabled={!selectedSectionId}
          >
            <option value="">{t('form.categoryPlaceholder')}</option>
            {categories?.map((c: JobCategoryResponse) => (
              <option key={c.id} value={c.id}>
                {i18n.language === 'ka' ? c.titleKa : c.title}
                {c.isExperienceRequired ? ` · ${t('categoryMeta.experienced')}` : ''}
              </option>
            ))}
          </select>
          {values.categoryId && (() => {
            const cat = categories?.find((c: JobCategoryResponse) => c.id === values.categoryId);
            if (!cat) return null;
            const rate = (cat.minimumEarningsPerHourMinor / 100).toFixed(2);
            return (
              <p className="text-xs text-muted-foreground mt-1">
                {t('categoryMeta.minPay', { rate })}
                {cat.isTippable && ` · ${t('categoryMeta.tippable')}`}
              </p>
            );
          })()}
        </Field>

        <Field label={t('form.title')}>
          <input
            type="text"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t('form.titlePlaceholder')}
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            required
            minLength={3}
            maxLength={200}
          />
        </Field>
      </Section>

      {/* Description */}
      <Section label={t('form.sections.description')}>
        <Field label={t('form.briefing')}>
          <textarea
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[140px] resize-y"
            placeholder={t('form.briefingPlaceholder')}
            value={values.briefing}
            onChange={(e) => set('briefing', e.target.value)}
            required
            minLength={10}
            maxLength={7500}
          />
          <p className={`text-xs mt-1 ${briefingLength > 7200 ? 'text-amber-600' : 'text-muted-foreground'}`}>
            {briefingLength} / 7500
          </p>
        </Field>
      </Section>

      {/* Location */}
      <Section label={t('form.sections.location')}>
        <Field label={t('form.addressLine')}>
          <AddressAutocomplete
            value={values.addressLine}
            onChange={(v) => set('addressLine', v)}
            onSelect={handleAddressSelect}
            placeholder={t('form.addressLinePlaceholder')}
          />
        </Field>
        <Field label={t('form.city')}>
          <input
            type="text"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t('form.cityPlaceholder')}
            value={values.city}
            onChange={(e) => set('city', e.target.value)}
            required
          />
        </Field>
      </Section>

      {/* Contact */}
      <Section label={t('form.sections.contact')}>
        <Field label={t('form.contactPersonName')}>
          <input
            type="text"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t('form.contactPersonNamePlaceholder')}
            value={values.contactPersonName}
            onChange={(e) => set('contactPersonName', e.target.value)}
            required
          />
        </Field>
        <Field label={t('form.contactPersonPhone')}>
          <input
            type="tel"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t('form.contactPersonPhonePlaceholder')}
            value={values.contactPersonPhone}
            onChange={(e) => set('contactPersonPhone', e.target.value)}
            required
          />
        </Field>
      </Section>

      {/* Requirements */}
      <Section label={t('form.sections.requirements')}>
        <Field label={t('form.skills')} hint={t('form.skillsHint')}>
          <CheckboxGrid
            items={(skills ?? []).map((s) => ({
              id: s.id,
              label: i18n.language === 'ka' ? s.nameKa : s.name,
            }))}
            selected={values.skillIds}
            onToggle={(id) => toggleArrayItem('skillIds', id)}
          />
        </Field>

        <Field label={t('form.appearance')} hint={t('form.appearanceHint')}>
          <CheckboxGrid
            items={(appearances ?? []).map((a) => ({
              id: a.id,
              label: i18n.language === 'ka' ? a.nameKa : a.name,
            }))}
            selected={values.appearanceIds}
            onToggle={(id) => toggleArrayItem('appearanceIds', id)}
          />
        </Field>

        <Field label={t('form.languages')} hint={t('form.languagesHint')}>
          <CheckboxGrid
            items={(languages ?? []).map((l) => ({
              id: l.id,
              label: i18n.language === 'ka' ? l.nameKa : l.name,
            }))}
            selected={values.languageIds}
            onToggle={(id) => toggleArrayItem('languageIds', id)}
          />
        </Field>
      </Section>

      {error && (
        <p className="text-sm text-destructive">
          {(error as { message?: string }).message ?? 'An error occurred'}
        </p>
      )}

      <div className="pb-4">
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? t('form.saving') : t('form.submit')}
        </Button>
      </div>
    </form>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-xs)] flex flex-col gap-4">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CheckboxGrid({
  items,
  selected,
  onToggle,
}: {
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {items.map((item) => {
        const checked = selected.includes(item.id);
        return (
          <label
            key={item.id}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
              checked
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-white hover:bg-muted/40 text-foreground'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={() => onToggle(item.id)}
            />
            <span
              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${
                checked ? 'border-primary bg-primary text-white' : 'border-input bg-background'
              }`}
            >
              {checked && '✓'}
            </span>
            {item.label}
          </label>
        );
      })}
    </div>
  );
}
