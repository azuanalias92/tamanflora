import { createFileRoute } from "@tanstack/react-router";
import { HomestayCheckinList } from "@/features/homestay-booking/components/homestay-checkin-list";

export const Route = createFileRoute("/_authenticated/homestay-list/$homestayId")({
  component: HomestayCheckinList,
});
