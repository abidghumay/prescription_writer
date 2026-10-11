import gsap from 'gsap';

/**
 * Checks if the user has requested reduced motion in their OS or browser.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Staggered entrance for lists of items (e.g. Rx rows, template pills, search results).
 */
export function animateListEntrance(
  targets: gsap.DOMTarget,
  options?: {
    stagger?: number;
    duration?: number;
    yOffset?: number;
  },
): gsap.core.Tween | null {
  if (prefersReducedMotion() || !targets) return null;

  return gsap.fromTo(
    targets,
    {
      opacity: 0,
      y: options?.yOffset ?? 8,
    },
    {
      opacity: 1,
      y: 0,
      duration: options?.duration ?? 0.28,
      stagger: options?.stagger ?? 0.035,
      ease: 'power2.out',
    },
  );
}

/**
 * Fluid pop-in animation when a single new card/item is appended.
 */
export function animateCardAddition(
  target: gsap.DOMTarget,
): gsap.core.Tween | null {
  if (prefersReducedMotion() || !target) return null;

  return gsap.fromTo(
    target,
    {
      opacity: 0,
      y: 12,
      scale: 0.98,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.3,
      ease: 'back.out(1.4)',
    },
  );
}

/**
 * Slide animation for side drawers (History, Templates, Patient Queue).
 */
export function animateDrawer(
  target: gsap.DOMTarget,
  isOpen: boolean,
  onComplete?: () => void,
): gsap.core.Tween | null {
  if (!target) return null;

  if (prefersReducedMotion()) {
    gsap.set(target, { xPercent: isOpen ? 0 : 100, opacity: isOpen ? 1 : 0 });
    if (onComplete) onComplete();
    return null;
  }

  return gsap.to(target, {
    xPercent: isOpen ? 0 : 100,
    opacity: isOpen ? 1 : 0,
    duration: isOpen ? 0.35 : 0.25,
    ease: isOpen ? 'power3.out' : 'power2.in',
    onComplete,
  });
}

/**
 * Subtle pulse feedback (e.g. for auto-save status or duplicate generic warning).
 */
export function animatePulse(target: gsap.DOMTarget): gsap.core.Tween | null {
  if (prefersReducedMotion() || !target) return null;

  return gsap.fromTo(
    target,
    { scale: 0.97 },
    {
      scale: 1,
      duration: 0.25,
      ease: 'elastic.out(1.2, 0.4)',
    },
  );
}
