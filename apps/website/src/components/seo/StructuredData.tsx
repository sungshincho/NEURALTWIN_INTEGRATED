import { Helmet } from 'react-helmet-async';

const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'NEURALTWIN',
  url: 'https://neuraltwin.io',
  logo: 'https://neuraltwin.io/logo.png',
  description: 'AI-Powered Retail Intelligence Platform',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contact@neuraltwin.com',
    contactType: 'sales',
    availableLanguage: ['Korean', 'English', 'Japanese'],
  },
};

const SOFTWARE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'NEURALTWIN',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'AI-powered retail digital twin platform for store operations optimization',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'KRW',
    lowPrice: '0',
    highPrice: '3000000',
    offerCount: '4',
  },
};

export const OrganizationSchema = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify(ORG_SCHEMA)}
    </script>
  </Helmet>
);

export const SoftwareSchema = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify(SOFTWARE_SCHEMA)}
    </script>
  </Helmet>
);
