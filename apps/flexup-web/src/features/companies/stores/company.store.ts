import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompanyState {
  activeCompanyId: string | null;
  setActiveCompanyId: (companyId: string | null) => void;
  clearActiveCompany: () => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      activeCompanyId: null,
      setActiveCompanyId: (companyId) => set({ activeCompanyId: companyId }),
      clearActiveCompany: () => set({ activeCompanyId: null }),
    }),
    {
      name: 'flexup.activeCompanyId',
      partialize: (state) => ({ activeCompanyId: state.activeCompanyId }),
    },
  ),
);

export const getActiveCompanyId = () => useCompanyStore.getState().activeCompanyId;
export const clearActiveCompany = () => useCompanyStore.getState().clearActiveCompany();
