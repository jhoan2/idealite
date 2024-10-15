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
    embeds: any[];
    frames: any[];
    viewer_context: {
      liked: boolean;
    };
    direct_replies?: Cast[];
  }