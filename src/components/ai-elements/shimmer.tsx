import { cn } from '@/lib/utils';
import type { CSSProperties, ElementType } from 'react';
import { memo, useMemo } from 'react';

export interface TextShimmerProps {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

const ShimmerComponent = ({ children, as: Component = 'p', className, duration = 2, spread = 2 }: TextShimmerProps) => {
  const dynamicSpread = useMemo(() => (children?.length ?? 0) * spread, [children, spread]);

  return (
    <Component
      className={cn(
        'relative inline-block animate-shimmer bg-[length:250%_100%,auto] bg-clip-text text-transparent [background-repeat:no-repeat,padding-box]',
        className
      )}
      style={
        {
          '--spread': `${dynamicSpread}px`,
          '--shimmer-bg': `linear-gradient(90deg,#0000 calc(50% - var(--spread)),hsl(var(--background)),#0000 calc(50% + var(--spread)))`,
          backgroundImage: `var(--shimmer-bg), linear-gradient(hsl(var(--muted-foreground)), hsl(var(--muted-foreground)))`,
          animationDuration: `${duration}s`
        } as CSSProperties
      }
    >
      {children}
    </Component>
  );
};

export const Shimmer = memo(ShimmerComponent);
