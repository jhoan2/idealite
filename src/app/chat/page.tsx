import ChannelFeed from "./(ChannelFeed)/ChannelFeed";
import { Suspense } from "react";
import LoadingFeed from "./(ChannelFeed)/LoadingFeed";

export default function Chat() {
  return (
    <>
      <Suspense fallback={<LoadingFeed />}>
        <ChannelFeed />
      </Suspense>
    </>
  );
}
