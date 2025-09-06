"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, User, ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { toast } from "sonner";
import FileUploadDropdown from "./FileUploadDropdown";

// Define a proper type for the user data
type UserData = {
  id: string;
  fullName?: string | null;
  username?: string | null;
  imageUrl?: string;
  email?: string | null;
};

export function Settings({ user }: { user: UserData }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="container mx-auto space-y-8 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Account Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User size={16} />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <ExternalLink size={16} />
            <span>Upload Notes</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and how others see you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-6 md:flex-row">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <div className="h-24 w-24 overflow-hidden rounded-full bg-muted">
                        <Image
                          src={
                            user?.imageUrl ||
                            "/placeholder.svg?height=96&width=96"
                          }
                          alt="Profile picture"
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      >
                        <Camera size={16} />
                        <span className="sr-only">Upload new photo</span>
                      </Button>
                    </div>
                    {/* <Button variant="outline" size="sm">
                      Change avatar
                    </Button> */}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display name</Label>
                        <Input
                          id="displayName"
                          defaultValue={user?.fullName || ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          defaultValue={user?.username || ""}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user?.email || ""}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">
                        Your email address is managed by Clerk
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Write a short bio about yourself"
                    className="min-h-[100px]"
                    defaultValue=""
                  />
                  <p className="text-sm text-muted-foreground">
                    Tell people a bit about yourself
                  </p>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6">
              <Button variant="outline">Cancel</Button>
              {/* <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save changes"}
              </Button> */}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="upload">
          <div className="space-y-6">
            <FileUploadDropdown />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
