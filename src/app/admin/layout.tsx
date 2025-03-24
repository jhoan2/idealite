import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (user?.publicMetadata.role !== "admin") {
    redirect("/home");
  }

  return <div>{children}</div>;
}
