import SkillGraphPreview from "./_components/SkillGraphPreview";
import { currentUser } from "@clerk/nextjs/server";
import { getSkillGraphDataForUser } from "~/server/queries/skillGraph";

export default async function Home() {
  const user = await currentUser();
  const userId = user?.externalId;
  const displayName = user?.firstName ?? "there";
  const skillGraphData = userId
    ? await getSkillGraphDataForUser(userId)
    : { axes: [], ownedTagCount: 0 };

  return (
    <section className="mx-auto mt-6 flex w-full max-w-6xl flex-col gap-5 px-2 md:mt-8 md:px-0">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
          Welcome back, {displayName}
        </h1>
      </div>

      <SkillGraphPreview
        axes={skillGraphData.axes}
        ownedTagCount={skillGraphData.ownedTagCount}
      />
    </section>
  );
}
