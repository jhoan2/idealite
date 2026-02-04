
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from "~/lib/utils";
import { Plus } from "lucide-react";

type TagNodeData = {
  label: string;
  isInBoth: boolean;
  color: string;
  id: string;
};

const GlobalTagNode = ({ data }: NodeProps<TagNodeData>) => {
  const { label, isInBoth, color } = data;

  return (
    <div
      className={cn(
        "group relative flex w-[200px] flex-col overflow-hidden rounded-lg border transition-all duration-300",
        isInBoth
          ? "border-transparent bg-white shadow-md dark:bg-slate-900"
          : "border-dashed border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/20 dark:hover:border-slate-600"
      )}
      style={{
        boxShadow: isInBoth ? `0 4px 6px -1px ${color}25` : undefined,
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className={cn(
          "!w-2 !h-2 !-left-1 transition-colors duration-300",
          isInBoth ? "!bg-slate-400" : "!bg-slate-300"
        )}
      />
      
      {/* Header Stripe - Thinner now */}
      <div 
        className={cn("h-1 w-full transition-all duration-300", isInBoth ? "opacity-100" : "opacity-40")}
        style={{ backgroundColor: color }}
      />

      <div className="flex items-center justify-between p-3 gap-2">
        {/* Main Label */}
        <span className={cn(
          "line-clamp-2 text-sm font-semibold leading-tight transition-colors duration-300",
          isInBoth ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
        )}>
            {label}
        </span>
        
        {/* Simple Plus Action for Unowned */}
        {!isInBoth && (
            <div 
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-transform group-hover:scale-110 dark:bg-slate-800 dark:ring-slate-700"
            >
              <Plus className="h-3.5 w-3.5 text-slate-500" />
            </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className={cn(
          "!w-2 !h-2 !-right-1 transition-colors duration-300",
          isInBoth ? "!bg-slate-400" : "!bg-slate-300"
        )}
      />
    </div>
  );
};

export default memo(GlobalTagNode);
