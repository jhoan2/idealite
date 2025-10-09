// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://cbb037f2e5e13123d3c6f5fab6901ed5@o4507771612626944.ingest.us.sentry.io/4508011605721088",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

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
