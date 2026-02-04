import type { EventRole, Permission } from "@prisma/client";
import prisma from "../../integrations/db/db.config.js";
import AppError from "../../errors/AppError.js";

export const RoleCache = {
  roleIdMap: new Map<EventRole, number>(),
  idRoleMap: new Map<number, EventRole>(),
  rolePermissionsMap: new Map<EventRole, Set<Permission>>(),

  getRoleById(id: number): EventRole {
    if (this.idRoleMap.has(id)) {
      return this.idRoleMap.get(id)!;
    }
    throw AppError.internalError();
  },

  getRoleId(role: EventRole): number {
    if (this.roleIdMap.has(role)) {
      return this.roleIdMap.get(role)!;
    }
    throw AppError.internalError();
  },

  getRolePermissions(role: EventRole): Set<Permission> {
    if (this.rolePermissionsMap.has(role)) {
      return this.rolePermissionsMap.get(role)!;
    }
    throw AppError.internalError();
  },
};

export async function initializeCache() {
  const roles = await prisma.role.findMany({
    include: { rolePermissions: true },
  });

  for (const role of roles) {
    RoleCache.roleIdMap.set(role.role, role.id);
    RoleCache.idRoleMap.set(role.id, role.role);
    RoleCache.rolePermissionsMap.set(
      role.role,
      new Set(role.rolePermissions.map((perm) => perm.permission)),
    );
  }

  console.log("Role cache initialized:", RoleCache);
}
