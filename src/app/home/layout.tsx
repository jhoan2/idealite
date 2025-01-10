import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { getChannelDetails, getNewMembers } from "~/server/farcaster";
import PostButton from "./PostButton";
import Image from "next/image";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const channelDetails = await getChannelDetails("idealite");
  const { users } = await getNewMembers("idealite");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-lg md:w-2/3">
        <div className="relative h-64">
          <Image
            src={channelDetails.channel.header_image_url}
            alt="Group banner"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {channelDetails.channel.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Farcaster · {channelDetails.channel.follower_count} members
              </p>
            </div>
            <div>
              <PostButton />
            </div>
          </div>
          <div className="mb-4 flex -space-x-2 overflow-hidden">
            {users.map((user: any, index: number) => (
              <Avatar
                key={index}
                className="inline-block border-2 border-background"
              >
                <AvatarImage src={user.pfp_url} alt={user.username} />
                <AvatarFallback>{user.username[0]}</AvatarFallback>
              </Avatar>
            ))}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
              +{channelDetails.channel.follower_count - users.length}
            </div>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
