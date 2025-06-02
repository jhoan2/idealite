import { currentUser } from "@clerk/nextjs/server";
import ProfilePlaceholder from "./ProfilePlaceholder";
import { Settings } from "./Settings";

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    return <ProfilePlaceholder />;
  }

  const userData = {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    imageUrl: user.imageUrl,
    email: user.emailAddresses?.[0]?.emailAddress || null,
  };

  return (
    <div className="min-h-screen bg-background pb-20 pl-4 pr-4">
      <Settings user={userData} />
    </div>
  );
}
