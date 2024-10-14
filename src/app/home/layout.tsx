import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { getChannelDetails, getNewMembers } from '~/server/farcaster'

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  
    const channelDetails = await getChannelDetails('dailylearning')
    const {users} = await getNewMembers('dailylearning')

    return (
    <div className="max-w-4xl mx-auto bg-background text-foreground shadow-lg rounded-lg overflow-hidden border border-border">
      <div className="relative h-64">
        <img
          src={channelDetails.channel.image_url}
          alt="Group banner"
          className="w-full h-full object-cover"
        />
        {/* <Button className="absolute top-4 right-4 bg-background text-foreground hover:bg-accent hover:text-accent-foreground">Edit</Button> */}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{channelDetails.channel.name}</h1>
            <p className="text-sm text-muted-foreground">Public group · {channelDetails.channel.follower_count} members</p>
          </div>
          {/* <Button>+ Invite</Button> */}
        </div>
        <div className="flex -space-x-2 overflow-hidden mb-4">
          {users.map((user: any, index: any) => (
            <Avatar key={index} className="inline-block border-2 border-background">
              <AvatarImage src={user.pfp_url} alt={user.username} />
              <AvatarFallback>{user.username[0]}</AvatarFallback>
            </Avatar>
          ))}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground text-sm font-medium">
            +{channelDetails.channel.follower_count - users.length}
          </div>
        </div>
        <Tabs defaultValue="discussion" className="w-full">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="about" className="data-[state=active]:bg-background data-[state=active]:text-foreground">About</TabsTrigger>
            <TabsTrigger value="discussion" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Discussion</TabsTrigger>
          </TabsList>
          <TabsContent value="about" className="mt-4 border border-border p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-2 text-foreground">About</h2>
            <p className="text-sm text-muted-foreground">
              {channelDetails.channel.description}
            </p>
          </TabsContent>
          <TabsContent value="discussion" className="mt-4 border border-border p-4 rounded-md">
            {children}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
