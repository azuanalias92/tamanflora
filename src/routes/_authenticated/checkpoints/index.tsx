import { createFileRoute } from "@tanstack/react-router";
import { CheckpointsPage } from '@/features/checkpoints'

export const Route = createFileRoute("/_authenticated/checkpoints/")({
  component: CheckpointsPage,
});
