import Hero from "../../(landing)/Hero";
import Progress from "../../(landing)/Progress";
import Footer from "../../(landing)/Footer";
import GetStarted from "../../(landing)/GetStarted";
import FeatureSection from "../../(landing)/FeatureSection";
import { ExperimentTracker } from "~/components/ExperimentTracker";

export default function ControlLanding() {
  return (
    <div className="min-h-screen bg-black text-gray-800">
      <ExperimentTracker experimentName="landing_test" variant="control" />
      <Hero />
      <main>
        <FeatureSection />
        <Progress />
        <GetStarted variant="control" />
      </main>
      <Footer />
    </div>
  );
}
