import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import Image from "next/image"
import { findUserByFid } from "~/server/userQueries"
import { auth } from "~/app/auth"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
    const session = await auth();
    if (!session) {
      redirect('/home');
    }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-6">
          <div className="rounded-lg bg-background p-6 shadow">
            <div className="mb-6 flex items-center justify-between text-foreground">
              <div className="flex items-center space-x-4 text-foreground/60">
                <Image
                  src={session?.user?.pfp_url || "/placeholder.svg?height=80&width=80"}
                  alt="Profile picture"
                  className="h-20 w-20 rounded-full"
                  width={80}
                  height={80}
                />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{session?.user?.display_name}</h2>
                  <p className="text-gray-600 text-foreground/60">{session?.user?.username}</p>
                  <p className="text-gray-600 text-foreground/60">{session?.user?.bio}</p>
                </div>
              </div>
              {/* <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Button> */}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}