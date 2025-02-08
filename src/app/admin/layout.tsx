import { redirect } from "next/navigation";
import { auth } from "~/app/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/home");
  }

  return <div>{children}</div>;
}
