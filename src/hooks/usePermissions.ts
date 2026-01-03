import { useAuthStore } from '@/store/authStore';

export const usePermissions = () => {
  const { user } = useAuthStore();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;

    // Check role-based permissions (original logic)
    if (user.roles?.some(role =>
      role.permissions?.some(
        (perm: any) => perm.resource === resource && perm.action === action
      )
    )) return true;

    // Fallback: check top-level permissions array (from login response)
    if (user.permissions?.some(
      (perm: any) => perm.resource === resource && perm.action === action
    )) return true;

    return false;
  };

  const canView = (resource: string) => hasPermission(resource, 'read');
  const canCreate = (resource: string) => hasPermission(resource, 'create');
  const canUpdate = (resource: string) => hasPermission(resource, 'update');
  const canDelete = (resource: string) => hasPermission(resource, 'delete');
  const canApprove = (resource: string) => hasPermission(resource, 'approve');

  return {
    hasPermission,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canApprove,
  };
};
