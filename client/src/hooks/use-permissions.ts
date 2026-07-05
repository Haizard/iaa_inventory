import { useAuthStore } from '@/store/auth.store';

type Role = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface Permissions {
  // Navigation visibility
  canViewReports: boolean;
  canViewUsers: boolean;
  canViewPurchases: boolean;

  // Action permissions
  canCreateProduct: boolean;
  canEditProduct: boolean;
  canDeleteProduct: boolean;

  canCreateCategory: boolean;
  canEditCategory: boolean;
  canDeleteCategory: boolean;

  canCreateSupplier: boolean;
  canEditSupplier: boolean;
  canDeleteSupplier: boolean;

  canCreateSale: boolean;

  canCreatePurchase: boolean;

  canCreateCustomer: boolean;
  canEditCustomer: boolean;
  canDeleteCustomer: boolean;

  canManageUsers: boolean;

  // Dashboard detail level
  dashboardLevel: 'full' | 'limited';

  role: Role;
}

const PERMISSIONS: Record<Role, Permissions> = {
  ADMIN: {
    canViewReports: true,
    canViewUsers: true,
    canViewPurchases: true,

    canCreateProduct: true,
    canEditProduct: true,
    canDeleteProduct: true,

    canCreateCategory: true,
    canEditCategory: true,
    canDeleteCategory: true,

    canCreateSupplier: true,
    canEditSupplier: true,
    canDeleteSupplier: true,

    canCreateSale: true,
    canCreatePurchase: true,

    canCreateCustomer: true,
    canEditCustomer: true,
    canDeleteCustomer: true,

    canManageUsers: true,
    dashboardLevel: 'full',
    role: 'ADMIN',
  },

  MANAGER: {
    canViewReports: true,
    canViewUsers: false,
    canViewPurchases: true,

    canCreateProduct: true,
    canEditProduct: true,
    canDeleteProduct: true,

    canCreateCategory: true,
    canEditCategory: true,
    canDeleteCategory: true,

    canCreateSupplier: true,
    canEditSupplier: true,
    canDeleteSupplier: true,

    canCreateSale: true,
    canCreatePurchase: true,

    canCreateCustomer: true,
    canEditCustomer: true,
    canDeleteCustomer: true,

    canManageUsers: false,
    dashboardLevel: 'full',
    role: 'MANAGER',
  },

  STAFF: {
    canViewReports: false,
    canViewUsers: false,
    canViewPurchases: false,

    canCreateProduct: false,
    canEditProduct: false,
    canDeleteProduct: false,

    canCreateCategory: false,
    canEditCategory: false,
    canDeleteCategory: false,

    canCreateSupplier: false,
    canEditSupplier: false,
    canDeleteSupplier: false,

    canCreateSale: true,    // staff CAN record sales
    canCreatePurchase: false,

    canCreateCustomer: false,
    canEditCustomer: false,
    canDeleteCustomer: false,

    canManageUsers: false,
    dashboardLevel: 'limited',
    role: 'STAFF',
  },
};

export function usePermissions(): Permissions {
  const role = (useAuthStore((s) => s.user?.role) ?? 'STAFF') as Role;
  return PERMISSIONS[role];
}
