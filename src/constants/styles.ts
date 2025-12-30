/**
 * Shared styles and constants for the application
 */

export const mobileNavStyles = `
  @media (min-width: 768px) {
    nav.bottom-nav-mobile {
      display: none !important;
    }
  }
  @media (max-width: 767px) {
    header {
      display: none !important;
    }
  }
`;

export const safeAreaBottom = "env(safe-area-inset-bottom, 0px)";


