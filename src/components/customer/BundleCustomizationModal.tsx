import React, { useEffect, useMemo, useState } from 'react';
import { CustomerCartItem, MenuItem, ModifierCategory, ProductAddon, PromoBundle } from '../../types';
import { CustomerProductModal } from './CustomerProductModal';

interface BundleCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundle: PromoBundle | null;
  menuItems: MenuItem[];
  addonsList?: ProductAddon[];
  modifierCategories?: ModifierCategory[];
  onComplete: (selections: CustomerCartItem[]) => void;
}

export const BundleCustomizationModal: React.FC<BundleCustomizationModalProps> = ({
  isOpen,
  onClose,
  bundle,
  menuItems = [],
  addonsList = [],
  modifierCategories = [],
  onComplete,
}) => {
  const [selections, setSelections] = useState<Record<string, CustomerCartItem>>({});
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bundles use the product's modifier configuration, but optional add-ons/extras
  // are intentionally excluded from combo customization.
  const bundleModifierCategories = useMemo(
    () => modifierCategories.filter((category) => category.itemType !== 'addon'),
    [modifierCategories]
  );

  const bundleModifierItems = useMemo(() => {
    return addonsList.filter((addon) => {
      const category = modifierCategories.find(
        (cat) =>
          cat.id === addon.category ||
          cat.name.toLowerCase() === addon.category.toLowerCase()
      );
      return category ? category.itemType !== 'addon' : false;
    });
  }, [addonsList, modifierCategories]);

  // Hide the quantity control only while a product is being customized from a combo.
  // Regular standalone product customization keeps its normal quantity control.
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add('bundle-product-customization');
    return () => {
      document.body.classList.remove('bundle-product-customization');
    };
  }, [isOpen]);

  const includedProducts = useMemo(() => {
    if (!bundle) return [];
    return bundle.bundleItems.map((itemRef, index) => {
      const product = menuItems.find((item) => item.id === itemRef || item.name === itemRef);
      return { key: `${product?.id || itemRef}-${index}`, reference: itemRef, product };
    });
  }, [bundle, menuItems]);

  const hasCustomization = (product: MenuItem) =>
    Boolean(
      product.modifierCategoryIds &&
        product.modifierCategoryIds.some((categoryId) => {
          const category = bundleModifierCategories.find(
            (cat) =>
              cat.id === categoryId ||
              cat.name.toLowerCase() === categoryId.toLowerCase()
          );
          return Boolean(category);
        })
    );

  const createStandardSelection = (product: MenuItem): CustomerCartItem => ({
    id: `bundle-selection-${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    menuItem: product,
    selectedTemperature:
      product.temperature === 'Cold' ? 'Iced' : product.temperature === 'N/A' ? 'N/A' : 'Hot',
    selectedAddons: [],
    quantity: 1,
    unitPrice: product.price,
    totalPrice: product.price,
  });

  useEffect(() => {
    if (!isOpen || !bundle) return;
    const initial: Record<string, CustomerCartItem> = {};
    includedProducts.forEach(({ key, product }) => {
      if (product && !hasCustomization(product)) {
        initial[key] = createStandardSelection(product);
      }
    });
    setSelections(initial);
    setSelectedProduct(null);
    setIsProductModalOpen(false);
    setError(null);
  }, [isOpen, bundle?.id, includedProducts]);

  const handleCustomize = (product: MenuItem) => {
    setError(null);
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleProductAdded = (item: CustomerCartItem) => {
    if (!selectedProduct) return;
    const entry = includedProducts.find(({ product }) => product?.id === selectedProduct.id);
    if (!entry) return;
    setSelections((prev) => ({ ...prev, [entry.key]: item }));
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  const handleComplete = () => {
    if (!bundle) return;
    const missing = includedProducts.filter(({ key, product }) => product && !selections[key]);
    if (includedProducts.some(({ product }) => !product)) {
      setError('One or more products in this combo are no longer available. Please contact the store.');
      return;
    }
    if (missing.length > 0) {
      setError('Please customize/select each included product before adding this combo to your bag.');
      return;
    }
    onComplete(includedProducts.map(({ key }) => selections[key]).filter(Boolean));
    onClose();
  };

  if (!isOpen || !bundle) return null;

  return (
    <>
      <style>{`
        body.bundle-product-customization #customer-product-modal > div > div:last-child > div:first-child {
          display: none !important;
        }
      `}</style>

      <div
        className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-[#fff8f5] w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl border border-[#dec1af] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b border-[#f3ecea] bg-[#f9f2f0] flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex px-2 py-0.5 bg-[#e1e1c9] text-[#636451] text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                Combo Customization
              </span>
              <h3 className="font-serif text-xl font-bold text-[#26170c] mt-1">{bundle.name}</h3>
              <p className="text-[11px] text-[#4f453f] mt-1">
                Customize each product included in this combo.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#e8e1df] text-[#4f453f] cursor-pointer flex-shrink-0"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            <div className="p-3 bg-white rounded-2xl border border-[#dec1af]/60">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-[#26170c]">Included Products</span>
                <span className="text-[10px] text-[#81756e]">
                  {includedProducts.length} item{includedProducts.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-2">
                {includedProducts.map(({ key, reference, product }) => {
                  const selected = selections[key];
                  const customizable = product ? hasCustomization(product) : true;
                  return (
                    <div
                      key={key}
                      className="p-2.5 rounded-xl bg-[#f9f2f0] border border-[#f3ecea] flex items-center gap-2.5"
                    >
                      {product?.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#e8e1df] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-[#81756e]">restaurant</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#26170c] truncate">{product?.name || reference}</p>
                        <p className="text-[10px] text-[#81756e] mt-0.5">
                          {!product
                            ? 'Product unavailable'
                            : customizable
                            ? selected
                              ? 'Customization selected'
                              : 'Modifier selection required'
                            : 'Standard preparation'}
                        </p>
                      </div>
                      {product && customizable && (
                        <button
                          type="button"
                          onClick={() => handleCustomize(product)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#26170c] text-white text-[10px] font-bold hover:bg-[#3d2b1f] cursor-pointer flex-shrink-0"
                        >
                          {selected ? 'Edit' : 'Customize'}
                        </button>
                      )}
                      {product && !customizable && (
                        <span className="px-2 py-1 bg-[#e1e1c9] text-[#636451] text-[10px] font-bold rounded-lg flex-shrink-0">
                          Standard
                        </span>
                      )}
                      {selected && (
                        <span className="material-symbols-outlined text-[#2e6b3e] text-[18px] flex-shrink-0">
                          check_circle
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#ffdad6] text-[#93000a] text-xs font-semibold border border-[#ba1a1a]/20">
                {error}
              </div>
            )}
          </div>

          <div className="px-4 sm:px-5 py-3.5 border-t border-[#f3ecea] bg-white flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-[#81756e]">Combo Price</p>
              <p className="font-serif text-lg font-bold text-[#26170c]">₱{bundle.price.toFixed(2)}</p>
            </div>
            <button
              type="button"
              onClick={handleComplete}
              className="px-4 py-2.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
              Add Combo to Bag
            </button>
          </div>
        </div>
      </div>

      <CustomerProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        addonsList={bundleModifierItems}
        modifierCategories={bundleModifierCategories}
        onAddToCart={handleProductAdded}
      />
    </>
  );
};
