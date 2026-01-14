import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true
      }),

      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),

      getToken: () => get().token
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Cart Store (for guest users)
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discount: 0,

      addItem: (item) => set((state) => {
        const existingIndex = state.items.findIndex(
          i => i.productId === item.productId &&
            i.ageRange === item.ageRange &&
            i.color?.name === item.color?.name
        );

        if (existingIndex > -1) {
          const newItems = state.items.map((cartItem, index) => {
            if (index === existingIndex) {
              return { ...cartItem, quantity: cartItem.quantity + item.quantity };
            }
            return cartItem;
          });
          return { items: newItems };
        }

        return { items: [...state.items, item] };
      }),

      updateQuantity: (itemId, quantity) => set((state) => ({
        items: state.items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      })),

      removeItem: (itemId) => set((state) => ({
        items: state.items.filter(item => item.id !== itemId)
      })),

      clearCart: () => set({ items: [], couponCode: null, discount: 0 }),

      setCoupon: (code, discount) => set({ couponCode: code, discount }),

      removeCoupon: () => set({ couponCode: null, discount: 0 }),

      getSubtotal: () => get().items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      ),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        return subtotal - get().discount;
      },

      getItemCount: () => get().items.reduce(
        (count, item) => count + item.quantity, 0
      )
    }),
    {
      name: 'cart-storage'
    }
  )
);

// UI Store
export const useUIStore = create((set) => ({
  isMobileMenuOpen: false,
  isCartDrawerOpen: false,
  isSearchOpen: false,
  isLoginModalOpen: false,

  toggleMobileMenu: () => set((state) => ({
    isMobileMenuOpen: !state.isMobileMenuOpen
  })),

  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toggleCartDrawer: () => set((state) => ({
    isCartDrawerOpen: !state.isCartDrawerOpen
  })),

  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),

  toggleSearch: () => set((state) => ({
    isSearchOpen: !state.isSearchOpen
  })),

  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),

  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false })
}));

// Language Store
export const useLanguageStore = create(
  persist(
    (set) => ({
      language: 'en',
      direction: 'ltr',

      setLanguage: (lang) => set({
        language: lang,
        direction: lang === 'ur' ? 'rtl' : 'ltr'
      })
    }),
    {
      name: 'language-storage'
    }
  )
);
