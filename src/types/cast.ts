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
  frames?: Array<{
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
      oembed?: {
        html: string;
        title: string;
      };
    };
  };
  cast_id?: {
    hash: string;
  };
  cast?: {
    object: string;
    hash: string;
    author: {
      object: string;
      fid: number;
      username: string;
      display_name: string;
      pfp_url: string;
    };
    thread_hash: string;
    parent_hash: string | null;
    parent_url: string | null;
    root_parent_url: string;
    parent_author: {
      fid: number | null;
    };
    text: string;
    timestamp: string;
    embeds: any[];
    channel?: {
      object: string;
      id: string;
      name: string;
      image_url: string;
      viewer_context?: {
        role: string;
        following: boolean;
      };
    };
  };
}

export interface CastConversation {
  conversation: {
    cast: {
      object: string;
      hash: string;
      thread_hash: string;
      parent_hash: string | null;
      parent_url: string | null;
      root_parent_url: string;
      parent_author: {
        fid: number | null;
      };
      author: {
        object: string;
        fid: number;
        custody_address: string;
        username: string;
        display_name: string;
        pfp_url: string;
        profile: {
          bio: {
            text: string;
          };
        };
        follower_count: number;
        following_count: number;
        verifications: string[];
        verified_addresses: {
          eth_addresses: string[];
          sol_addresses: string[];
        };
        verified_accounts: null;
        active_status: string;
        power_badge: boolean;
        viewer_context: {
          following: boolean;
          followed_by: boolean;
          blocking: boolean;
          blocked_by: boolean;
        };
      };
      text: string;
      timestamp: string;
      embeds: any[];
      reactions: {
        likes_count: number;
        recasts_count: number;
        likes: any[];
        recasts: any[];
      };
      replies: {
        count: number;
      };
      channel: {
        object: string;
        id: string;
        name: string;
        image_url: string;
      };
      mentioned_profiles: any[];
      viewer_context: {
        liked: boolean;
        recasted: boolean;
      };
      direct_replies: Cast[];
    };
  };
  next?: {
    cursor: string | null;
  };
}
