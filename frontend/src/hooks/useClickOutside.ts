import { useEffect, type RefObject } from "react";

export function useClickOutside<TElement extends HTMLElement>(
  ref: RefObject<TElement | null>,
  onOutsideClick: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: MouseEvent) => {
      const element = ref.current;
      if (!element) return;
      if (!(event.target instanceof Node)) return;
      if (!element.contains(event.target)) onOutsideClick();
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [enabled, onOutsideClick, ref]);
}
