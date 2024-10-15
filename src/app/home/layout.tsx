import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { getChannelDetails, getNewMembers } from '~/server/farcaster';

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const channelDetails = await getChannelDetails('dailylearning');
  const { users } = await getNewMembers('dailylearning');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto bg-background text-foreground shadow-lg rounded-lg overflow-hidden border border-border w-full md:w-2/3">
        <div className="relative h-64">
          <img
            src={channelDetails.channel.image_url}
            alt="Group banner"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{channelDetails.channel.name}</h1>
              <p className="text-sm text-muted-foreground">Farcaster · {channelDetails.channel.follower_count} members</p>
            </div>
            <div>
              <Button variant="outline">Post</Button>
            </div>
          </div>
          <div className="flex -space-x-2 overflow-hidden mb-4">
            {users.map((user: any, index: number) => (
              <Avatar key={index} className="inline-block border-2 border-background">
                <AvatarImage src={user.pfp_url} alt={user.username} />
                <AvatarFallback>{user.username[0]}</AvatarFallback>
              </Avatar>
            ))}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground text-sm font-medium">
              +{channelDetails.channel.follower_count - users.length}
            </div>
          </div>
          <div>
                {children}
          </div>
        </div>
      </div>
    </div>
  );
}