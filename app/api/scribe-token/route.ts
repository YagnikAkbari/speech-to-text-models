import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});
async function checkAuth(req: NextRequest) {
  const token = req.headers.get("authorization");
  return Boolean(token); // customize
}

export async function GET(req: NextRequest) {
  try {

    console.log("Creating scribe token...");
    const token = await elevenlabs.tokens.singleUse.create(
      "realtime_scribe"
    );
    console.log("Token created successfully");

    return NextResponse.json(token);

  } catch (error: any) {
    console.error("scribe-token error:", error);

    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
