import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ko' ? 'en' : 'ko';
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2"
      aria-label="Toggle language"
    >
      <Languages className="w-4 h-4" />
      <span className="text-sm font-medium">
        {i18n.language === 'ko' ? 'EN' : 'KR'}
      </span>
    </Button>
  );
};
