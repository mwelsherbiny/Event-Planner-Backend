import cron from "node-cron";
import prisma from "../integrations/db/db.config.js";
import EventService from "../features/event/event.service.js";

const startReminderCron = () => {
  cron.schedule("*/10 * * * *", async () => {
    const now = Date.now();
    const in1Hour = now + 60 * 60 * 1000;

    const events = await prisma.event.findMany({
      where: {
        startAt: {
          gte: new Date(now),
          lt: new Date(in1Hour),
        },
        reminderSent: false,
      },
    });

    for (const event of events) {
      await EventService.notifyEventReminder(event);
      await prisma.event.update({
        where: { id: event.id },
        data: { reminderSent: true },
      });
    }
  });
};

export default startReminderCron;
