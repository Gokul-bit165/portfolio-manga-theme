type Gsap = typeof import("./gsap");
type Cleanup = () => void;

/**
 * Loads GSAP after first paint, so it stays out of the initial bundle, and runs a setup once
 * it arrives. Returns an effect cleanup that is safe to call before the setup has run.
 * Nothing here is needed to read the page: the first paint comes from CSS alone.
 */
export function loadGsap(setup: (modules: Gsap) => Cleanup | void): Cleanup {
  let cancelled = false;
  let cleanup: Cleanup | void;

  void import("./gsap").then((modules) => {
    if (!cancelled) cleanup = setup(modules);
  });

  return () => {
    cancelled = true;
    cleanup?.();
  };
}
