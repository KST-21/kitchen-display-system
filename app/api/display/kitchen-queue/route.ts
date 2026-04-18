import { NextResponse } from "next/server";
import { listChefs, listKitchenQueue } from "@/lib/kitchen-db";
import { ensureWsServer } from "@/lib/ws-server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  ensureWsServer();
  try {
    return NextResponse.json({
      rows: await listKitchenQueue(),
      chefs: await listChefs(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load kitchen queue" },
      { status: 500 },
    );
  }
};
