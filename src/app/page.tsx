import Hero from "./(landing)/Hero";
import Remember from "./(landing)/Remember";
import Progress from "./(landing)/Progress";
import Footer from "./(landing)/Footer";
import GetStarted from "./(landing)/GetStarted";

export default function FrontPage() {
  return (
    <div className="min-h-screen bg-black text-gray-800">
      <Hero />
      <main>
        <Remember />
        <Progress />
        <GetStarted />
      </main>
      <Footer />
    </div>
  );
}
