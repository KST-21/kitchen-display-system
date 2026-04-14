import { NextResponse } from "next/server";
import {
  listChefs,
  listKitchenQueue,
  removeServedQueueEntry,
} from "@/lib/kitchen-db";
import { broadcastKitchenState } from "@/lib/ws-server";

export const dynamic = "force-dynamic";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const queueId = Number(body.queue_id);
    if (!Number.isFinite(queueId)) {
      return NextResponse.json({ error: "Invalid queue_id" }, { status: 400 });
    }
    await removeServedQueueEntry(queueId);
    broadcastKitchenState();
    return NextResponse.json({
      rows: await listKitchenQueue(),
      chefs: await listChefs(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to remove queue entry" },
      { status: 500 },
    );
  }
};
