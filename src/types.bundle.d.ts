import './types';

declare module './types' {
  interface CustomerCartItem {
    /** Customized products selected for this combo, kept with the bundle cart line. */
    bundleSelections?: CustomerCartItem[];
  }
}
