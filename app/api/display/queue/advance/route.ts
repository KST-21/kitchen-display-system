import { NextResponse } from "next/server";
import {
  advanceQueueStatus,
  listChefs,
  listKitchenQueue,
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
    const chefId = body.chef_id != null ? Number(body.chef_id) : undefined;
    advanceQueueStatus(
      queueId,
      chefId !== undefined && Number.isFinite(chefId) ? chefId : undefined,
    );
    broadcastKitchenState();
    return NextResponse.json({
      rows: listKitchenQueue(),
      chefs: listChefs(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to advance queue status" },
      { status: 500 },
    );
  }
};
