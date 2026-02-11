/*
import { getCardStatusDistribution } from "~/server/queries/dashboard";
import { CardStatusChart } from "./CardStatusChart";

export default async function TotalCards() {
  const data = await getCardStatusDistribution();
  const totalCards = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="h-full">
      <CardStatusChart data={data} totalCards={totalCards} />
    </div>
  );
}
*/

export default function TotalCards() {
  return null;
}
