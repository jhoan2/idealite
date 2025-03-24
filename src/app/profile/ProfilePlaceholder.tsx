import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { User, LogIn } from "lucide-react";
import { Separator } from "~/components/ui/separator";
import { SignInButton, SignedOut } from "@clerk/nextjs";

export default function ProfilePlaceholder() {
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
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
                <User className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Sign in to view your profile
                </p>
                <div className="flex justify-center space-x-2 md:hidden">
                  <SignedOut>
                    <LogIn className="h-6 w-6" />
                    <SignInButton />
                  </SignedOut>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
