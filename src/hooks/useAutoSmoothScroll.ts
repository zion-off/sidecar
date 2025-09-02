import { type RefObject, useCallback, useEffect, useRef } from 'react';

interface AutoSmoothScrollOptions {
  /** px distance from bottom considered "at bottom" */
  bottomThreshold?: number;
  /** extra px offset from real bottom when scrolling */
  bottomOffset?: number;
  /** whether to always force scroll even if user scrolled up */
  force?: boolean;
  /** scroll behavior */
  behavior?: 'auto' | 'smooth';
}

/**
 * Smoothly auto-scroll a container to the bottom when content changes (e.g. streaming chat).
 * Skips auto-scroll if user scrolled away from bottom unless force or still within threshold.
 */
export function useAutoSmoothScroll(
  ref: RefObject<HTMLElement>,
  deps: unknown[],
  enabled: boolean,
  { bottomThreshold = 64, bottomOffset = 0, force = false, behavior = 'smooth' }: AutoSmoothScrollOptions = {}
) {
  const atBottomRef = useRef(true);
  const frameRef = useRef<number | null>(null);

  // Track whether user is near bottom.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      atBottomRef.current = distanceFromBottom <= bottomThreshold;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    // Initialize state.
    handleScroll();
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [ref, bottomThreshold]);

  const scrollToBottom = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      const target = el.scrollHeight - el.clientHeight + bottomOffset;
      // If already close, avoid redundant smooth triggers.
      const delta = Math.abs(el.scrollTop - target);
      if (delta < 4) return;

      try {
        el.scrollTo({ top: target, behavior });
      } catch {
        // Fallback for older browsers.
        el.scrollTop = target;
      }
    }, 0);
  }, [ref, bottomOffset, behavior]);

  // On dep changes schedule a scroll if conditions allow.
  useEffect(() => {
    if (!enabled) return;
    if (!force && !atBottomRef.current) return; // Respect user manual scroll position.

    if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(scrollToBottom);
    return () => {
      if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, force]);
}
