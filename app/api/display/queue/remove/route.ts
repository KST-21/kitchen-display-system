import { NextResponse } from "next/server";
import { listChefs, listKitchenQueue, removeServedQueueEntry } from "@/lib/kitchen-db";
import { broadcastKitchenState } from "@/lib/ws-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const queueId = Number(body.queue_id);
    if (!Number.isFinite(queueId)) {
      return NextResponse.json({ error: "Invalid queue_id" }, { status: 400 });
    }
    removeServedQueueEntry(queueId);
    broadcastKitchenState();
    return NextResponse.json({
      rows: listKitchenQueue(),
      chefs: listChefs(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to remove queue entry" },
      { status: 500 }
    );
  }
}
