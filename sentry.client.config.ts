// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://cbb037f2e5e13123d3c6f5fab6901ed5@o4507771612626944.ingest.us.sentry.io/4508011605721088",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  beforeSend: (event, hint) => {
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Filter out unauthorized errors - these are expected when users aren't logged in
    const error = hint.originalException;

    const isUnauthorized =
      (error instanceof Error && error.message === 'Unauthorized') ||
      event.contexts?.response?.status_code === 401 ||
      (event.exception?.values?.some(
        (exception) => exception.value?.includes('Unauthorized') || exception.value?.includes('401')
      ) ?? false);

    if (isUnauthorized) {
      return null;
    }

    return event
  }
});
