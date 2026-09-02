import './types';

declare module './types' {
  interface CustomerCartItem {
    bundleSelections?: CustomerCartItem[];
  }
}
