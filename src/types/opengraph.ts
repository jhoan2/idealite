export interface OpenGraphData {
  ogTitle?: string;
  ogType?: string;
  ogUrl?: string;
  ogDescription?: string;
  ogImage?: Array<{
    height?: string;
    type?: string;
    url: string;
    width?: string;
  }>;
  charset?: string;
  requestUrl?: string;
  success?: boolean;
}
