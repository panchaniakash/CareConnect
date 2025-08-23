import { useEffect, useState } from 'react';
import { Plus, Shield, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoleWithPermissions extends Role {
  rolePermissions: {
    id: string;
    permission: Permission;
  }[];
}

export default function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, RoleWithPermissions>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [rolesRes, permissionsRes] = await Promise.all([
        fetch('/api/admin/roles', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/permissions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (rolesRes.ok && permissionsRes.ok) {
        const rolesData = await rolesRes.json();
        const permissionsData = await permissionsRes.json();
        setRoles(rolesData);
        setPermissions(permissionsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/roles/${roleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const roleWithPermissions: RoleWithPermissions = await response.json();
        setRolePermissions(prev => ({
          ...prev,
          [roleId]: roleWithPermissions
        }));
      }
    } catch (error) {
      console.error('Failed to load role permissions:', error);
    }
  };

  const handleToggleRole = async (roleId: string) => {
    if (expandedRole === roleId) {
      setExpandedRole(null);
    } else {
      setExpandedRole(roleId);
      if (!rolePermissions[roleId]) {
        await loadRolePermissions(roleId);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getRolePermissions = (roleId: string): Permission[] => {
    return rolePermissions[roleId]?.rolePermissions.map(rp => rp.permission) || [];
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
          <p className="text-gray-600">Configure user roles and their associated permissions.</p>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          disabled
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Role</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading roles and permissions...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50"
                onClick={() => handleToggleRole(role.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {expandedRole === role.id ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <Shield className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                        <span>{role.name}</span>
                        {role.isSystemRole && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            System Role
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {getRolePermissions(role.id).length} permissions
                    </span>
                    {!role.isSystemRole && (
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {expandedRole === role.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Permissions</h4>
                  
                  {rolePermissions[role.id] ? (
                    <div className="space-y-6">
                      {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
                        const rolePermissionsList = getRolePermissions(role.id);
                        const categoryRolePermissions = categoryPermissions.filter(p => 
                          rolePermissionsList.some(rp => rp.id === p.id)
                        );
                        
                        if (categoryRolePermissions.length === 0) return null;
                        
                        return (
                          <div key={category}>
                            <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                              {category}
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {categoryRolePermissions.map((permission) => (
                                <div
                                  key={permission.id}
                                  className="flex items-center space-x-2 p-2 bg-white rounded border"
                                >
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {permission.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {permission.description}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading permissions...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && roles.length === 0 && (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first custom role.
          </p>
        </div>
      )}
    </div>
  );
}