import Hero from "./(landing)/Hero";
import Progress from "./(landing)/Progress";
import Footer from "./(landing)/Footer";
import GetStarted from "./(landing)/GetStarted";
import FeatureSection from "./(landing)/FeatureSection";
import { GoogleTag } from "~/components/GoogleTag";

export default function FrontPage() {
  return (
    <div className="min-h-screen bg-black text-gray-800">
      <GoogleTag />
      <Hero />
      <main>
        <FeatureSection />
        <Progress />
        <GetStarted />
      </main>
      <Footer />
    </div>
  );
}
