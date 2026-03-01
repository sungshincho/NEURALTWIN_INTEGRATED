import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

const LANGUAGES = ['ko', 'en', 'ja'] as const;
const LABELS: Record<string, string> = { ko: 'KR', en: 'EN', ja: 'JP' };

export const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const cycleLanguage = () => {
    const idx = LANGUAGES.indexOf(i18n.language as typeof LANGUAGES[number]);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    i18n.changeLanguage(next);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleLanguage}
      className="gap-2"
      aria-label="Toggle language"
    >
      <Languages className="w-4 h-4" />
      <span className="text-sm font-medium">
        {LABELS[i18n.language] || 'KR'}
      </span>
    </Button>
  );
};
