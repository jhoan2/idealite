export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 p-8 dark:bg-slate-950">
      <div className="relative flex items-center">
        {/* Level 1: Root Node */}
        <div className="z-10 h-[80px] w-[200px] animate-pulse rounded-lg bg-slate-200 shadow-sm dark:bg-slate-800" />

        {/* Connection Area */}
        <div className="relative flex w-[100px] flex-col items-center justify-center">
           {/* Horizontal Line from Root */}
           <div className="absolute left-0 top-1/2 h-0.5 w-[50px] bg-slate-200 dark:bg-slate-800" />
           
           {/* Vertical Spine */}
           <div className="absolute left-[50px] top-[calc(50%-70px)] h-[140px] w-0.5 bg-slate-200 dark:bg-slate-800" />
           
           {/* Top Branch */}
           <div className="absolute left-[50px] top-[calc(50%-70px)] h-0.5 w-[50px] bg-slate-200 dark:bg-slate-800" />
           
           {/* Bottom Branch */}
           <div className="absolute bottom-[calc(50%-70px)] left-[50px] h-0.5 w-[50px] bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Level 2: Children Column */}
        <div className="flex flex-col gap-12">
            {/* Child A */}
            <div className="h-[80px] w-[200px] animate-pulse rounded-lg bg-slate-200 shadow-sm dark:bg-slate-800" />
            
            {/* Child B */}
            <div className="h-[80px] w-[200px] animate-pulse rounded-lg bg-slate-200 shadow-sm dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}