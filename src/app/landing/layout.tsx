import { GoogleTag } from "~/components/GoogleTag";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GoogleTag />
      {children}
    </>
  );
}
