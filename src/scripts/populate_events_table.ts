import { randomUUID } from "crypto";

const numberOfEvents = parseInt(process.argv[3] as string, 10) || 1;

for (let i = 0; i < numberOfEvents; i++) {
  const EGYPT_GOVERNORATES = [
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
  const PAYMENT_METHODS = ["FREE", "ONLINE", "AT_EVENT"];
  const EVENT_VISIBILITIES = ["PUBLIC", "PRIVATE"];

  const name = `Event ${randomUUID().toString()}`;
  const description = `This is a sample description for ${name}. It provides detailed information about the event, including its purpose, activities, and other relevant details. Attendees can expect an engaging and informative experience that highlights the key aspects of ${name}. Join us for an unforgettable event filled with excitement and valuable insights.`;
  const latitude = 30.0444;
  const longitude = 31.2357;
  const governorate =
    EGYPT_GOVERNORATES[Math.floor(Math.random() * EGYPT_GOVERNORATES.length)];
  const startAt = new Date(
    Date.now() + Math.ceil(Math.random() * 7) * 24 * 60 * 60 * 1000,
  );
  const duration = 120;
  const maxAttendees = 100;
  const visibility =
    EVENT_VISIBILITIES[Math.floor(Math.random() * EVENT_VISIBILITIES.length)];
  const paymentMethod =
    PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
  const price =
    paymentMethod === "FREE"
      ? null
      : parseFloat((Math.random() * 100 + 10).toFixed(2));

  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("latitude", latitude.toString());
  formData.append("longitude", longitude.toString());
  formData.append("governorate", governorate);
  formData.append("startAt", startAt.toISOString());
  formData.append("duration", duration.toString());
  formData.append("maxAttendees", maxAttendees.toString());
  formData.append("visibility", visibility);
  formData.append("paymentMethod", paymentMethod);
  if (price !== null) {
    formData.append("price", price.toString());
  }

  const JwtToken = process.argv[2];

  const response = await fetch("http://localhost:3000/api/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JwtToken}`,
    },
    body: formData,
  });

  const jsonResponses = await response.json();
  if (!response.ok) {
    console.error("Error creating event:", jsonResponses);
  } else {
    console.log("Event created successfully:", jsonResponses);
  }
}
