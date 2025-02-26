import Head from "next/head";
import GenerateComponentButton from "./GenerateComponentButton";
import LiveComponentRenderer from "./LiveComponentRenderer";
export default function SimulationPage() {
  return (
    <div>
      <Head>
        <title>Permutations & Combinations Simulator</title>
        <meta
          name="description"
          content="Interactive simulator for understanding permutations and combinations"
        />
      </Head>

      <GenerateComponentButton />
      <LiveComponentRenderer componentId="1" />
    </div>
  );
}
