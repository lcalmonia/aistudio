import React, { useEffect, useMemo, useState } from 'react';
import { CustomerCartItem, Order, StoreSettings, CustomerUser } from '../../types';
import { storageAdapter } from '../../services/storageAdapter';
import { BundleCustomizationModal } from './BundleCustomizationModal';
import { CustomerCartDrawer as LegacyCustomerCartDrawer } from './CustomerCartDrawer.tsx';

interface CustomerCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CustomerCartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onPlaceOrder: (order: Order) => void;
  storeSettings?: StoreSettings;
  currentCustomer?: CustomerUser | null;
}

export const CustomerCartDrawer: React.FC<CustomerCartDrawerProps> = (props) => {
  const [preparedBundles, setPreparedBundles] = useState<Record<string, CustomerCartItem[]>>({});
  const [pendingBundleCartItemId, setPendingBundleCartItemId] = useState<string | null>(null);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);

  const catalog = useMemo(
    () => ({
      menuItems: storageAdapter.getMenuItems(),
      addons: storageAdapter.getAddons(),
      modifierCategories: storageAdapter.getModifierCategories(),
    }),
    [props.cartItems.length, props.isOpen]
  );

  const effectiveCartItems = useMemo(
    () =>
      props.cartItems.map((item) => {
        const selections = preparedBundles[item.id];
        return selections ? { ...item, bundleSelections: selections } : item;
      }),
    [props.cartItems, preparedBundles]
  );

  const pendingBundle = useMemo(() => {
    if (!pendingBundleCartItemId) return null;
    return (
      props.cartItems.find(
        (item) => item.id === pendingBundleCartItemId && item.isBundle && item.bundleData
      ) || null
    );
  }, [props.cartItems, pendingBundleCartItemId]);

  useEffect(() => {
    const activeIds = new Set(props.cartItems.map((item) => item.id));
    setPreparedBundles((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).filter(([id]) => activeIds.has(id))
      );
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });

    if (pendingBundleCartItemId && !activeIds.has(pendingBundleCartItemId)) {
      setPendingBundleCartItemId(null);
      setIsBundleModalOpen(false);
    }
  }, [props.cartItems, pendingBundleCartItemId]);

  useEffect(() => {
    if (!props.isOpen) return;
    const firstUnprepared = props.cartItems.find(
      (item) => item.isBundle && item.bundleData && !preparedBundles[item.id]
    );
    if (firstUnprepared && !isBundleModalOpen) {
      setPendingBundleCartItemId(firstUnprepared.id);
      setIsBundleModalOpen(true);
    }
  }, [props.isOpen, props.cartItems, preparedBundles, isBundleModalOpen]);

  const handleCompleteBundle = (selections: CustomerCartItem[]) => {
    if (!pendingBundleCartItemId) return;
    setPreparedBundles((prev) => ({
      ...prev,
      [pendingBundleCartItemId]: selections,
    }));
    setPendingBundleCartItemId(null);
    setIsBundleModalOpen(false);
  };

  const handlePlaceOrder = (order: Order) => {
    const missingBundle = props.cartItems.find(
      (item) => item.isBundle && item.bundleData && !preparedBundles[item.id]
    );
    if (missingBundle) {
      setPendingBundleCartItemId(missingBundle.id);
      setIsBundleModalOpen(true);
      return;
    }
    props.onPlaceOrder(order);
  };

  const handleRemoveItem = (cartItemId: string) => {
    setPreparedBundles((prev) => {
      if (!prev[cartItemId]) return prev;
      const next = { ...prev };
      delete next[cartItemId];
      return next;
    });
    props.onRemoveItem(cartItemId);
  };

  return (
    <>
      <LegacyCustomerCartDrawer
        {...props}
        cartItems={effectiveCartItems}
        onRemoveItem={handleRemoveItem}
        onPlaceOrder={handlePlaceOrder}
      />

      <BundleCustomizationModal
        isOpen={isBundleModalOpen}
        onClose={() => setIsBundleModalOpen(false)}
        bundle={pendingBundle?.bundleData || null}
        menuItems={catalog.menuItems}
        addonsList={catalog.addons}
        modifierCategories={catalog.modifierCategories}
        onComplete={handleCompleteBundle}
      />
    </>
  );
};
