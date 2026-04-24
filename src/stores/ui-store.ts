import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  breadcrumbOverrides: Record<string, string>;
  setBreadcrumbLabel: (segment: string, label: string) => void;
  clearBreadcrumbLabel: (segment: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  breadcrumbOverrides: {},
  setBreadcrumbLabel: (segment, label) =>
    set((state) => ({ breadcrumbOverrides: { ...state.breadcrumbOverrides, [segment]: label } })),
  clearBreadcrumbLabel: (segment) =>
    set((state) => {
      const next = { ...state.breadcrumbOverrides };
      delete next[segment];
      return { breadcrumbOverrides: next };
    }),
}));
