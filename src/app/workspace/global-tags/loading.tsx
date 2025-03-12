export default function Loading() {
  return (
    <div className="w-full py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto aspect-square w-full max-w-3xl">
          <div className="relative flex h-full w-full animate-pulse items-center justify-center rounded-full bg-orange-100/50">
            {/* Root circle */}
            <div className="absolute inset-0 animate-pulse rounded-full" />

            {/* Mathematics section */}
            <div className="absolute left-[35%] top-[15%] h-[30%] w-[30%] animate-pulse rounded-full bg-orange-200/50">
              <div className="absolute left-[15%] top-[20%] h-[40%] w-[40%] animate-pulse rounded-full bg-yellow-200/50" />
              <div className="absolute right-[15%] top-[20%] h-[40%] w-[40%] animate-pulse rounded-full bg-yellow-200/50" />
            </div>

            {/* Social Sciences section */}
            <div className="absolute left-[15%] top-[35%] h-[30%] w-[30%] animate-pulse rounded-full bg-yellow-100/50">
              <div className="absolute left-[15%] top-[15%] h-[30%] w-[30%] animate-pulse rounded-full bg-orange-200/50" />
              <div className="absolute right-[15%] top-[15%] h-[30%] w-[30%] animate-pulse rounded-full bg-orange-200/50" />
              <div className="absolute bottom-[15%] left-[15%] h-[30%] w-[30%] animate-pulse rounded-full bg-yellow-200/50" />
              <div className="absolute bottom-[15%] right-[15%] h-[30%] w-[30%] animate-pulse rounded-full bg-yellow-200/50" />
              <div className="absolute bottom-[25%] left-[35%] h-[30%] w-[30%] animate-pulse rounded-full bg-yellow-200/50" />
            </div>

            {/* Natural Sciences section */}
            <div className="absolute right-[15%] top-[35%] h-[30%] w-[30%] animate-pulse rounded-full bg-yellow-100/50">
              <div className="absolute left-[15%] top-[15%] h-[30%] w-[30%] animate-pulse rounded-full bg-purple-300/50" />
              <div className="absolute right-[15%] top-[15%] h-[30%] w-[30%] animate-pulse rounded-full bg-pink-300/50" />
              <div className="absolute bottom-[15%] left-[15%] h-[30%] w-[30%] animate-pulse rounded-full bg-pink-200/50" />
              <div className="absolute bottom-[15%] right-[15%] h-[30%] w-[30%] animate-pulse rounded-full bg-purple-200/50" />
            </div>

            {/* Humanities section */}
            <div className="absolute bottom-[15%] left-[35%] h-[30%] w-[30%] animate-pulse rounded-full bg-orange-200/50">
              <div className="absolute left-[15%] top-[20%] h-[40%] w-[40%] animate-pulse rounded-full bg-purple-300/50" />
              <div className="absolute right-[15%] top-[20%] h-[40%] w-[40%] animate-pulse rounded-full bg-yellow-200/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
