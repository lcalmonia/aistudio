import React, { useState, useMemo } from 'react';
import { ModifierCategory, ProductAddon } from '../types';

interface ManageModifierCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ModifierCategory[];
  addons: ProductAddon[];
  onOpenCreateCategory: (initialType?: 'modifier' | 'addon') => void;
  onOpenEditCategory: (category: ModifierCategory) => void;
  onDeleteCategory: (categoryId: string) => Promise<void> | void;
}

export const ManageModifierCategoriesModal: React.FC<ManageModifierCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories = [],
  addons = [],
  onOpenCreateCategory,
  onOpenEditCategory,
  onDeleteCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'modifier' | 'addon'>('all');
  const [deleteWarning, setDeleteWarning] = useState<{ categoryName: string; count: number } | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Calculate option counts per category name
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    addons.forEach((addon) => {
      const catKey = (addon.category || '').trim().toLowerCase();
      counts.set(catKey, (counts.get(catKey) || 0) + 1);
    });
    return counts;
  }, [addons]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (typeFilter !== 'all' && cat.itemType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = cat.name.toLowerCase().includes(q);
        const matchesType = cat.itemType.toLowerCase().includes(q);
        if (!matchesName && !matchesType) return false;
      }
      return true;
    });
  }, [categories, typeFilter, searchQuery]);

  const handleDeleteClick = async (category: ModifierCategory) => {
    const catKey = (category.name || '').trim().toLowerCase();
    const count = categoryCounts.get(catKey) || 0;

    if (count > 0) {
      setDeleteWarning({
        categoryName: category.name,
        count,
      });
      return;
    }

    if (window.confirm(`Delete category "${category.name}"? This action cannot be undone.`)) {
      try {
        setIsDeletingId(category.id);
        await onDeleteCategory(category.id);
      } catch (err: any) {
        console.error('[ManageModifierCategoriesModal] Deletion error:', err);
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#fff8f5] rounded-2xl w-full max-w-2xl shadow-2xl border border-[#e8e1df] overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#f3ecea] flex justify-between items-center bg-[#f9f2f0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#636451]">folder_special</span>
              <h3 className="font-serif text-lg font-bold text-[#26170c]">
                Manage Modifier & Add-on Categories
              </h3>
            </div>
            <p className="text-xs text-[#81756e] mt-0.5">
              Organize modifier groups, customize selection rules, and manage category lifecycles.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-[#4f453f] hover:bg-[#e8e1df] rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 bg-[#fff8f5] border-b border-[#f3ecea] flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#81756e]">
                search
              </span>
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
              />
            </div>

            <div className="flex bg-[#f3ecea] p-0.5 rounded-xl border border-[#d2c4bc] text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  typeFilter === 'all' ? 'bg-[#26170c] text-white shadow-2xs' : 'text-[#4f453f] hover:text-[#26170c]'
                }`}
              >
                All ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('modifier')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  typeFilter === 'modifier' ? 'bg-[#26170c] text-white shadow-2xs' : 'text-[#4f453f] hover:text-[#26170c]'
                }`}
              >
                Modifiers
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('addon')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  typeFilter === 'addon' ? 'bg-[#26170c] text-white shadow-2xs' : 'text-[#4f453f] hover:text-[#26170c]'
                }`}
              >
                Add-ons
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenCreateCategory('modifier')}
              className="px-3 py-1.5 bg-[#e1e1c9] hover:bg-[#d6d6bd] text-[#636451] text-xs font-bold rounded-xl border border-[#5e604d]/20 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>+ New Modifier Group</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenCreateCategory('addon')}
              className="px-3 py-1.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>+ New Category</span>
            </button>
          </div>
        </div>

        {/* Warning Banner if Unsafe Delete was attempted */}
        {deleteWarning && (
          <div className="mx-4 mt-3 p-3.5 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl flex items-start justify-between gap-2 animate-fadeIn">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[20px] mt-0.5">warning</span>
              <div>
                <h4 className="text-xs font-bold text-[#ba1a1a]">Cannot Delete Category</h4>
                <p className="text-[11px] text-[#410002] mt-0.5">
                  Category <span className="font-bold">"{deleteWarning.categoryName}"</span> currently has{' '}
                  <span className="font-bold">{deleteWarning.count} active option{deleteWarning.count > 1 ? 's' : ''}</span> assigned to it.
                  Please delete or reassign those options first to prevent broken dependencies.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDeleteWarning(null)}
              className="p-1 text-[#ba1a1a] hover:bg-[#ffb4ab] rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Categories List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center bg-white/60 rounded-xl border border-dashed border-[#d2c4bc]">
              <span className="material-symbols-outlined text-[32px] text-[#81756e] mb-1">category</span>
              <p className="text-xs font-semibold text-[#26170c]">No categories found</p>
              <p className="text-[11px] text-[#81756e] mt-0.5">
                {searchQuery ? 'Try changing your search query or filters.' : 'Get started by creating your first modifier category.'}
              </p>
              <button
                type="button"
                onClick={() => onOpenCreateCategory('modifier')}
                className="mt-3 px-3.5 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                + Create Modifier Group
              </button>
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const isMod = cat.itemType === 'modifier';
              const catKey = (cat.name || '').trim().toLowerCase();
              const count = categoryCounts.get(catKey) || 0;
              const isDeleting = isDeletingId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="bg-white p-3.5 rounded-xl border border-[#d2c4bc] hover:border-[#81756e] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isMod ? 'bg-[#e1e1c9] text-[#636451]' : 'bg-[#f3ecea] text-[#4f453f]'
                        }`}
                      >
                        {isMod ? 'Modifier Group' : 'Purchasable Add-on'}
                      </span>
                      <h4 className="text-sm font-bold text-[#26170c]">{cat.name}</h4>
                      {cat.required && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#ffdad6] text-[#ba1a1a] rounded">
                          Required
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] text-[#636451]">
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">
                          {cat.selectionType === 'multiple' ? 'check_box' : 'radio_button_checked'}
                        </span>
                        <span>{cat.selectionType === 'multiple' ? 'Multi-select' : 'Single-choice'}</span>
                      </span>

                      <span>•</span>

                      <span>
                        {cat.applicableTemperature === 'Both'
                          ? '🔥/❄️ Hot & Cold'
                          : cat.applicableTemperature === 'Hot'
                          ? '🔥 Hot Only'
                          : cat.applicableTemperature === 'Cold'
                          ? '❄️ Cold Only'
                          : 'All Temps'}
                      </span>

                      <span>•</span>

                      <span className={`font-semibold ${count === 0 ? 'text-[#81756e]' : 'text-[#26170c]'}`}>
                        {count} active option{count === 1 ? '' : 's'}
                      </span>
                    </div>

                    {cat.applicableCategories && cat.applicableCategories.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-[#81756e]">Menu Categories:</span>
                        {cat.applicableCategories.slice(0, 4).map((c) => (
                          <span key={c} className="text-[9px] px-1.5 py-0.2 bg-[#f3ecea] text-[#4f453f] rounded">
                            {c}
                          </span>
                        ))}
                        {cat.applicableCategories.length > 4 && (
                          <span className="text-[9px] text-[#81756e]">+{cat.applicableCategories.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenEditCategory(cat)}
                      className="px-2.5 py-1 text-xs font-bold text-[#4f453f] hover:bg-[#f3ecea] border border-[#d2c4bc] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title={`Edit ${cat.name}`}
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDeleteClick(cat)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        count === 0
                          ? 'text-[#ba1a1a] hover:bg-[#ffdad6] border-[#ffdad6]'
                          : 'text-[#ba1a1a]/70 hover:bg-[#ffdad6]/60 border-[#ffdad6]/50'
                      }`}
                      title={count > 0 ? `Cannot delete: ${count} options attached` : `Delete category ${cat.name}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isDeleting ? 'hourglass_empty' : 'delete'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e8e1df] bg-[#f9f2f0] flex justify-between items-center">
          <div className="text-xs text-[#81756e]">
            Total Categories: <span className="font-bold text-[#26170c]">{categories.length}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-xl hover:bg-[#3d2b1f] transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
