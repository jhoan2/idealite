import { Suspense } from 'react';
import { getChannelDetails } from '~/server/farcaster';
import ChannelPosts from './ChannelPosts';
import LoadingSpinner from '~/components/ui/LoadingSpinner';
import NewMembers from './NewMembers';
import { auth } from "~/app/auth"

export default async function page() {
    const session = await auth();
    const channelDetails = await getChannelDetails('dailylearning');
    return (
        <div className='grid grid-cols-3 gap-2 m-2'>
            <div className="flex flex-col items-center justify-center w-full h-64 rounded-lg overflow-hidden">
                <img
                    src={channelDetails.channel.image_url}
                    alt="Channel Image"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex flex-col w-full h-64 gap-2">
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-800 rounded-lg">
                    <h1 className="text-3xl font-bold text-white mb-1">{channelDetails.channel.follower_count}</h1>
                    <h2 className="text-lg font-bold text-white">Total Members</h2>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-800 rounded-lg overflow-hidden">
                    <Suspense fallback={<LoadingSpinner />}>
                        <NewMembers />
                    </Suspense>
                    <h2 className="text-lg font-bold text-white mt-14">New Members</h2>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center w-full h-64 bg-gray-800 rounded-lg p-4 space-y-4">
                <h2 className="text-4xl font-bold text-white mb-2">{channelDetails.channel.name}</h2>
                <p className="text-md text-gray-400">{channelDetails.channel.description}</p>
            </div>
            <div className="flex flex-col col-span-3 h-full items-center justify-center w-full bg-gray-800 rounded-lg">
                <Suspense fallback={<LoadingSpinner />}>
                    <ChannelPosts />
                </Suspense>
            </div>
        </div>
    )
}
