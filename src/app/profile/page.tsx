import Image from "next/image";
import { auth } from "~/app/auth";
import ProfilePlaceholder from "./ProfilePlaceholder";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
export default async function ProfilePage() {
  const session = await auth();
  if (!session) {
    return <ProfilePlaceholder />;
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Account Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <Separator />
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="relative overflow-hidden rounded-full bg-muted">
                <Image
                  src={
                    session?.user?.pfp_url ||
                    "/placeholder.svg?height=80&width=80"
                  }
                  alt="Profile picture"
                  className="aspect-square rounded-full object-cover"
                  width={80}
                  height={80}
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  {session?.user?.display_name}
                </h2>
                <p className="text-foreground/60 text-gray-600">
                  {session?.user?.username}
                </p>
                <p className="text-foreground/60 text-gray-600">
                  {session?.user?.bio}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
