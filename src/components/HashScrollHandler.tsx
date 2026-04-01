import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Handles scrolling to elements with IDs specified in the URL hash.
 * This is useful for cross-page anchor linking (e.g., navigating from /about to /#how-it-works).
 */
export default function HashScrollHandler() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Small delay to ensure the target page has rendered
      const timer = setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, hash]);

  return null;
}
