import { getTagsMasteryData } from "~/server/queries/dashboard";
import TagMasteryChart from "./TagMasteryChart";

export default async function TagMastery() {
  const data = await getTagsMasteryData();
  return <TagMasteryChart data={data} />;
}
