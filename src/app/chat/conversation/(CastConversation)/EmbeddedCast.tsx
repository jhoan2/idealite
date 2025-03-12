interface EmbeddedCastProps {
  cast: {
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

export const EmbeddedCast: React.FC<EmbeddedCastProps> = ({ cast }) => {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <img
          src={cast.author.pfp_url}
          alt={cast.author.display_name}
          className="h-10 w-10 rounded-full"
        />
        <div>
          <div className="font-semibold">{cast.author.display_name}</div>
          <div className="text-sm text-gray-500">@{cast.author.username}</div>
        </div>
      </div>
      <p className="mt-2">{cast.text}</p>
      <div className="mt-2 text-sm text-gray-500">
        {new Date(cast.timestamp).toLocaleDateString()}
      </div>
    </div>
  );
};
