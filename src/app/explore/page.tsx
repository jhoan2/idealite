import ExploreState from "./(ExploreTagTree)/ExploreState";
import { getTagWithChildren } from "~/server/tagQueries";

export default async function Explore() {
  const tag = await getTagWithChildren("5a6fa43e-7d62-4e3e-bc46-d0bd9c7997a3");
  return <ExploreState tag={tag} />;
}
