'use client';

import { useEffect } from 'react';

/**
 * The page's single motion controller.
 *
 * It does four small jobs and no more: reveals marked sections once, assigns
 * a stagger index to their children, keeps the running head in sync with the
 * scroll position, and drifts the editorial photographs a few pixels. Every
 * effect is skipped when the person has asked for reduced motion.
 */
export function ScrollReveal() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;

    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    );

    document
      .querySelectorAll<HTMLElement>('[data-reveal-group]')
      .forEach((group) => {
        Array.from(group.querySelectorAll<HTMLElement>('[data-reveal]')).forEach(
          (node, index) => {
            node.style.setProperty('--stagger', String(index));
          },
        );
      });

    let revealObserver: IntersectionObserver | null = null;
    if (reveals.length > 0) {
      if (reduce || !('IntersectionObserver' in window)) {
        reveals.forEach((node) => node.classList.add('is-visible'));
      } else {
        root.classList.add('reveal-ready');
        revealObserver = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              entry.target.classList.add('is-visible');
              revealObserver?.unobserve(entry.target);
            }
          },
          { rootMargin: '0px 0px -9% 0px', threshold: 0.08 },
        );
        reveals.forEach((node) => revealObserver?.observe(node));
      }
    }

    const nav = document.querySelector<HTMLElement>('[data-nav]');
    const progress = document.querySelector<HTMLElement>('[data-progress]');
    let scrollQueued = false;

    const paintScroll = () => {
      scrollQueued = false;
      const y = window.scrollY;
      nav?.classList.toggle('is-scrolled', y > 12);

      if (progress) {
        const max = root.scrollHeight - window.innerHeight;
        progress.style.setProperty(
          '--progress',
          String(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0),
        );
      }
    };

    const onScroll = () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(paintScroll);
    };

    paintScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const parallaxNodes = reduce
      ? []
      : Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    let parallaxQueued = false;

    const paintParallax = () => {
      parallaxQueued = false;
      const viewport = window.innerHeight;
      for (const node of parallaxNodes) {
        const rect = node.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > viewport + 120) continue;
        const speed = Number(node.dataset.parallax ?? '0.05');
        const offset = (rect.top + rect.height / 2 - viewport / 2) * speed;
        node.style.setProperty(
          '--parallax',
          `${Math.max(-18, Math.min(18, offset)).toFixed(2)}px`,
        );
      }
    };

    const onParallax = () => {
      if (parallaxQueued) return;
      parallaxQueued = true;
      requestAnimationFrame(paintParallax);
    };

    if (parallaxNodes.length > 0) {
      paintParallax();
      window.addEventListener('scroll', onParallax, { passive: true });
      window.addEventListener('resize', onParallax);
    }

    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('[data-navlink]'),
    );
    const sections = links
      .map((link) =>
        document.querySelector<HTMLElement>(link.getAttribute('href') ?? ''),
      )
      .filter((section): section is HTMLElement => section !== null);

    let sectionObserver: IntersectionObserver | null = null;
    if (sections.length > 0 && 'IntersectionObserver' in window) {
      sectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const id = `#${entry.target.id}`;
            for (const link of links) {
              link.removeAttribute('aria-current');
              if (link.getAttribute('href') === id) {
                link.setAttribute('aria-current', 'true');
              }
            }
          }
        },
        { rootMargin: '-44% 0px -50% 0px', threshold: 0 },
      );
      sections.forEach((section) => sectionObserver?.observe(section));
    }

    return () => {
      revealObserver?.disconnect();
      sectionObserver?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onParallax);
      window.removeEventListener('resize', onParallax);
      root.classList.remove('reveal-ready');
    };
  }, []);

  return null;
}
