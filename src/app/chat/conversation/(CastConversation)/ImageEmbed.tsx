import { Card } from "~/components/ui/card";

interface ImageEmbedProps {
  url: string;
}

export const ImageEmbed: React.FC<ImageEmbedProps> = ({ url }) => {
  return (
    <Card className="max-w-[30rem] overflow-hidden">
      <div className="p-3">
        <img
          src={url}
          alt="Embedded content"
          className="w-full rounded-md object-cover"
          loading="lazy"
        />
      </div>
    </Card>
  );
};
