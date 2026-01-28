export {};

declare global {
  interface Window {
    Clerk?: {
      __internal_openCheckout?: (params: {
        planId: string;
        planPeriod?: "month" | "year";
        subscriberType?: "user" | "org";
      }) => Promise<void>;
    };
  }
}
