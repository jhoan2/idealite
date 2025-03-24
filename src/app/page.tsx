import Link from "next/link";
import Image from "next/image";
import { Book, FileImage, Trophy, Users, Zap } from "lucide-react";

export default function FrontPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-300 via-orange-300 to-blue-200 text-gray-800">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-6 animate-pulse text-5xl font-bold md:text-6xl">
          Learn & Adventure with{" "}
          <span className="text-orange-600">Idealite</span>
        </h1>
        <p className="mb-8 text-xl md:text-2xl">
          The MMO where knowledge is your superpower!
        </p>

        <Link
          href="/home"
          className="inline-block transform rounded-full bg-orange-500 px-6 py-3 text-lg font-bold text-white transition duration-300 hover:scale-105 hover:bg-orange-600"
        >
          Start Your Adventure
        </Link>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Game Preview */}
        <div className="mb-16 text-center">
          <Image
            src="/landing-page.png"
            alt="Idealite Preview"
            width={1365}
            height={911}
            priority
            className="mx-auto rounded-lg shadow-2xl"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4dHRsdHR4dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/2wBDAR0XFyAeIRshIRshHRsdIR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        </div>

        {/* Features */}
        <div className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Book className="mb-4 h-12 w-12 text-yellow-400" />}
            title="Learn Anything"
            description="From math to history, science to languages - your curriculum, your choice!"
            comingSoon={false}
          />
          <FeatureCard
            icon={<FileImage className="mb-4 h-12 w-12 text-green-400" />}
            title="Create Memory Palaces"
            description="Supercharge your learning with interactive memory palaces!"
            comingSoon={false}
          />
          <FeatureCard
            icon={<Trophy className="mb-4 h-12 w-12 text-red-400" />}
            title="Achieve & Grow"
            description="Level up your character as you master new skills and knowledge."
            comingSoon={true}
          />
          <FeatureCard
            icon={<Zap className="mb-4 h-12 w-12 text-blue-400" />}
            title="Real-Time Battles"
            description="Test your knowledge in exciting PvP quiz battles!"
            comingSoon={true}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm opacity-75">
        <p>&copy; 2025 idealite. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  comingSoon = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  comingSoon?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white bg-opacity-50 p-6 text-center transition duration-300 hover:bg-opacity-70">
      {icon}
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-gray-600">{description}</p>
      {comingSoon && (
        <div className="absolute right-2 top-2 rotate-12 transform rounded-full bg-yellow-400 px-2 py-1 text-xs font-bold shadow-md">
          Coming Soon!
        </div>
      )}
    </div>
  );
}
