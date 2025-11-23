import { createFileRoute } from "@tanstack/react-router";
import { HomestayBookingForm } from "@/features/homestay-booking";

export const Route = createFileRoute("/homestay/$homestayId")({
  component: HomestayBookingForm,
});
