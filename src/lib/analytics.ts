// Google Analytics 4 & Meta Pixel Event Tracking

declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
    fbq?: (command: string, ...args: any[]) => void;
    dataLayer?: any[];
  }
}

export type FunnelStep = 1 | 2 | 3 | 4;

interface EventProperties {
  [key: string]: any;
  funnel_step?: FunnelStep;
}

/**
 * Track event to Google Analytics 4
 */
export const trackEvent = (eventName: string, properties?: EventProperties) => {
  // GA4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties);
  }

  // Meta Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    // Map GA4 events to Meta Pixel standard events
    const metaEventMap: { [key: string]: string } = {
      'submit_contact': 'Contact',
      'view_pricing': 'ViewContent',
      'meeting_booked': 'Schedule',
      'click_mini_features': 'ViewContent',
      'mini_feature_used': 'ViewContent',
    };

    const metaEvent = metaEventMap[eventName] || 'CustomEvent';
    window.fbq('track', metaEvent, properties);
  }

  // Console log for debugging (remove in production)
  console.log('[Analytics Event]', eventName, properties);
};

/**
 * Track page view
 */
export const trackPageView = (pageName: string, funnelStep?: FunnelStep) => {
  const properties: EventProperties = {
    page_title: pageName,
  };

  if (funnelStep !== undefined) {
    properties.funnel_step = funnelStep;
  }

  trackEvent('page_view', properties);
};

/**
 * Track funnel progression
 */
export const trackFunnelStep = (step: FunnelStep, stepName: string) => {
  trackEvent('funnel_progress', {
    funnel_step: step,
    step_name: stepName,
  });
};

/**
 * Track CTA button clicks
 */
export const trackCTAClick = (ctaName: string, destination: string, funnelStep?: FunnelStep) => {
  trackEvent('cta_click', {
    cta_name: ctaName,
    destination,
    funnel_step: funnelStep,
  });
};

/**
 * Track mini-feature interactions
 */
export const trackMiniFeature = (featureId: string, action: 'view' | 'interact') => {
  trackEvent('mini_feature_used', {
    feature_id: featureId,
    action,
    funnel_step: 2,
  });
};

/**
 * Track contact form events
 */
export const trackContactForm = (action: 'start' | 'submit' | 'error', errorMessage?: string) => {
  const eventName = action === 'start' ? 'start_contact' : 'submit_contact';
  trackEvent(eventName, {
    funnel_step: 3,
    form_action: action,
    error_message: errorMessage,
  });
};

/**
 * Track meeting booking
 */
export const trackMeetingBooked = (source: string) => {
  trackEvent('meeting_booked', {
    source,
    funnel_step: 4,
  });
};

/**
 * Initialize analytics on app load
 */
export const initAnalytics = () => {
  // GA4 initialization is handled in index.html
  // This function can be used for any additional setup
  console.log('[Analytics] Initialized');
};
