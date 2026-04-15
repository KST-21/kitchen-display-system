import { QueueStatus } from "@prisma/client";

export const QUEUE_FLOW: QueueStatus[] = [
  QueueStatus.Queued,
  QueueStatus.Preparing,
  QueueStatus.Ready,
  QueueStatus.Served,
];

export const getNextQueueStatus = (status: QueueStatus): QueueStatus | null => {
  const idx = QUEUE_FLOW.indexOf(status);
  return idx >= 0 && idx < QUEUE_FLOW.length - 1 ? QUEUE_FLOW[idx + 1] : null;
};
