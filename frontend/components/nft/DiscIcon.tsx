import { cn } from '@/lib/utils';

export function DiscIcon({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('relative grid place-items-center rounded-full bg-[#5865f2]', className)}>
    <span className="absolute inset-[14%] rounded-full border border-white/30" />
    <span className="absolute inset-[32%] rounded-full border border-white/25" />
    <span className="relative h-[18%] w-[18%] rounded-full bg-[#35ed7e] ring-4 ring-[#0a0d3a]/30" />
  </div>;
}
