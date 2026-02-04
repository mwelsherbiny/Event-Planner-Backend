import { EventRole } from "@prisma/client";

export const EGYPT_GOVERNORATES = [
  "cairo",
  "giza",
  "alexandria",
  "dakahlia",
  "red sea",
  "beheira",
  "faiyum",
  "gharbia",
  "ismailia",
  "monufia",
  "minya",
  "qalyubia",
  "new valley",
  "suez",
  "aswan",
  "asyut",
  "beni suef",
  "port said",
  "damietta",
  "sharqia",
  "south sinai",
  "kafr el sheikh",
  "matrouh",
  "luxor",
  "qena",
  "north sinai",
  "sohag",
];

export const eventOmitFields = {
  description: true,
  createdAt: true,
  latitude: true,
  longitude: true,
  visibility: true,
  paymentMethod: true,
};

export const userOmitFields = {
  passwordHash: true,
  createdAt: true,
  isVerified: true,
};

export const attendeeCountInclude = {
  _count: {
    select: {
      userRoles: {
        where: {
          role: {
            role: EventRole.ATTENDEE,
          },
        },
      },
    },
  },
};
