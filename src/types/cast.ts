export interface Cast {
  hash: string;
  author: {
    username: string;
    display_name: string;
    pfp_url: string;
    fid: number;
  };
  text: string;
  timestamp: string;
  reactions: {
    likes: { fid: number }[];
    recasts: { fid: number }[];
    likes_count: number;
    recasts_count: number;
  };
  replies: {
    count: number;
  };
  embeds: Array<{
    url: string;
    metadata: {
      content_type: string | null;
      content_length: number | null;
      _status: string;
      html: {
        ogUrl?: string;
        ogType?: string;
        charset?: string;
        favicon?: string;
        ogImage?: Array<{ url: string }>;
        ogTitle?: string;
        ogLocale?: string;
        twitterCard?: string;
        twitterImage?: Array<{ url: string }>;
        ogDescription?: string;
      };
    };
  }>;
  frames: Array<{
    version: string;
    title: string;
    image: string;
    buttons: Array<{
      index: number;
      title: string;
      action_type: string;
      target: string;
    }>;
    input: Record<string, unknown>;
    state: Record<string, unknown>;
    post_url: string;
    frames_url: string;
  }>;
  viewer_context: {
    liked: boolean;
    recasted: boolean;
  };
  direct_replies?: Cast[];
}

export interface Embed {
  url?: string;
  metadata?: {
    content_type: string | null;
    content_length: number | null;
    _status: string;
    html: {
      ogUrl?: string;
      ogType?: string;
      charset?: string;
      favicon?: string;
      ogImage?: Array<{ url: string }>;
      ogTitle?: string;
      ogLocale?: string;
      twitterCard?: string;
      twitterImage?: Array<{ url: string }>;
      ogDescription?: string;
    };
  };
  cast_id?: {
    hash: string;
  };
}
