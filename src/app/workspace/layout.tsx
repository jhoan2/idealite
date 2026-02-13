import { getUserTagTree } from "~/server/queries/usersTags";
import { headers } from "next/headers";
import { trackEvent } from "~/lib/posthog/server";
import { getUserDiscoveredFeatures } from "~/server/queries/featureDiscovery";
import { FeatureDiscoveryProvider } from "./(FeatureDiscover)/FeatureDiscoveryContext";
import { currentUser } from "@clerk/nextjs/server";
export default async function WorkspaceLayout({
  children,
  page,
}: {
  children: React.ReactNode;
  page: React.ReactNode;
}) {
  const user = await currentUser();
  const userId = user?.externalId;
  const [userTagTree, initialDiscoveredFeatures] = await Promise.all([
    userId ? getUserTagTree(userId) : [],
    userId ? getUserDiscoveredFeatures(userId) : [],
  ]);
  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  if (userId) {
    trackEvent(Number(userId), "workspace_viewed", {
      username: user?.emailAddresses[0]?.emailAddress,
    });
  }

  return (
    <FeatureDiscoveryProvider
      userId={userId ?? ""}
      initialDiscoveredFeatures={initialDiscoveredFeatures}
    >
      <div className="flex h-screen w-full overflow-hidden">
        <div className="custom-scrollbar flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="fixed right-8 top-4 z-50"></div>
          <div className="w-full">
            {page}
            {children}
          </div>
        </div>
      </div>
    </FeatureDiscoveryProvider>
  );
}
