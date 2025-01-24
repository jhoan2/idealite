import ChannelFrameTags from "../ChannelFrameTags";
import { SelectTag } from "~/server/queries/tag";
import Image from "next/image";

interface TagSelectionProps {
  goToNextStep: () => void;
  tag: SelectTag[];
  userTags: SelectTag[];
  userId: string | null;
  onComplete: () => void;
}

export default function TagSelection({
  goToNextStep,
  tag,
  userTags,
  userId,
  onComplete,
}: TagSelectionProps) {
  return (
    <div>
      <div className="flex items-center justify-center">
        <Image
          src="/icon128.png"
          alt="Global Chat"
          width={75}
          height={75}
          className="mb-8"
        />
        <div className="relative">
          {/* Triangle pointer */}
          <div className="absolute left-[-8px] top-4 h-0 w-0 border-b-[6px] border-r-[8px] border-t-[6px] border-b-transparent border-r-[#fefce8] border-t-transparent" />
          {/* Message bubble */}
          <div className="rounded-2xl bg-[#fefce8] px-6 py-4 text-black">
            <p className="text-xl font-medium">What's your top goal?</p>
          </div>
        </div>
      </div>
      <ChannelFrameTags
        tag={tag}
        userTags={userTags}
        userId={userId}
        goToNextStep={goToNextStep}
      />
    </div>
  );
}
