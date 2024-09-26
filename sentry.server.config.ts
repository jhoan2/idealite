// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://cbb037f2e5e13123d3c6f5fab6901ed5@o4507771612626944.ingest.us.sentry.io/4508011605721088",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  beforeSend: (event) => {
    if (process.env.NODE_ENV === 'development') {
      return null
    }
    return event
  }
});
