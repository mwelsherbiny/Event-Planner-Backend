import { EventRole, Permission } from "@prisma/client";
import prisma from "../integrations/db/db.config.js";

const roles = await prisma.role.findMany();

const rolesMap = roles.reduce(
  (acc, role) => {
    acc[role.role] = role.id;
    return acc;
  },
  {} as Record<EventRole, number>,
);

await prisma.rolePermission.createMany({
  data: [
    { roleId: rolesMap[EventRole.ATTENDEE], permission: Permission.VIEW_EVENT },
    { roleId: rolesMap[EventRole.MANAGER], permission: Permission.VIEW_EVENT },
    {
      roleId: rolesMap[EventRole.MANAGER],
      permission: Permission.VIEW_ATTENDEES,
    },
    { roleId: rolesMap[EventRole.MANAGER], permission: Permission.SCAN_CODE },
  ],
});
