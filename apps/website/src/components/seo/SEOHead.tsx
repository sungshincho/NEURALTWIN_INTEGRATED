import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
  type?: 'website' | 'article';
  image?: string;
  noIndex?: boolean;
}

const SITE_NAME = 'NEURALTWIN';
const BASE_URL = 'https://neuraltwin.io';
const DEFAULT_IMAGE = '/og-image.png';

export const SEOHead = ({
  title,
  description,
  path = '',
  type = 'website',
  image,
  noIndex = false,
}: SEOHeadProps) => {
  const { i18n } = useTranslation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = `${BASE_URL}${path}`;
  const ogImage = image || DEFAULT_IMAGE;
  const lang = i18n.language;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={lang === 'ja' ? 'ja_JP' : lang === 'en' ? 'en_US' : 'ko_KR'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {/* Alternate languages */}
      <link rel="alternate" hrefLang="ko" href={`${BASE_URL}${path}`} />
      <link rel="alternate" hrefLang="en" href={`${BASE_URL}${path}`} />
      <link rel="alternate" hrefLang="ja" href={`${BASE_URL}${path}`} />
      <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${path}`} />

      {noIndex && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  );
};
