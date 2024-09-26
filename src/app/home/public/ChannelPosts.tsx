import { getChannelFeed } from "~/server/farcaster";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "~/components/ui/carousel"

export default async function ChannelPosts() {
    const channelPosts = await getChannelFeed('dailylearning');
    return (
        <div className="space-y-2 flex justify-center">
            <Carousel
                opts={{
                    align: "start",
                }}
                className="w-2/3 p-2"
                orientation="horizontal"
            >
                <CarouselContent className="-ml-[4px]">
                    {channelPosts.casts.map((post: any) => (

                        <CarouselItem key={post.hash} className="bg-violet-900 rounded-lg shadow p-4">
                            <div className="flex items-center mb-2 pl-4" >
                                <img
                                    src={post.author.pfp_url}
                                    alt={post.author.display_name}
                                    className="w-10 h-10 rounded-full mr-3"
                                />
                                <div>
                                    <h3 className="font-bold">{post.author.display_name}</h3>
                                </div>
                            </div>
                            <p className="mb-2 pl-4">{post.text}</p>
                            {post.embeds && post.embeds.length > 0 && (
                                <img
                                    src={post.embeds[0].url}
                                    alt="Post image"
                                    className="w-full rounded-lg"
                                />
                            )}
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="bg-violet-900 dark:bg-violet-700 text-white hover:bg-violet-800 dark:hover:bg-violet-600" />
                <CarouselNext className="bg-violet-900 dark:bg-violet-700 text-white hover:bg-violet-800 dark:hover:bg-violet-600" />
            </Carousel>
        </div>
    );
}
