import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

export function UserName({ name, className }: { name: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`} aria-label={`User: ${name}`} role="group">
      <div className="w-8 h-8 rounded-full bg-[#1a1f2e] border border-[#2a3144] flex items-center justify-center text-white">
        <UserIcon className="w-4 h-4" aria-hidden="true" />
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="text-white text-sm font-medium truncate max-w-[40vw] sm:max-w-[14rem]"
            title={name}
            role="text"
          >
            {name}
          </span>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    </div>
  );
}
