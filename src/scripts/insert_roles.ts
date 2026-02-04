import { EventRole } from "@prisma/client";
import prisma from "../integrations/db/db.config.js";

await prisma.role.createMany({
  data: [{ role: EventRole.ATTENDEE }, { role: EventRole.MANAGER }],
});
