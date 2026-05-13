import { NextResponse } from "next/server";

import { getUrlMetadataTitle } from "@/lib/url-metadata";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim();

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter." },
      { status: 400 }
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  const metadata = await getUrlMetadataTitle(url);

  return NextResponse.json(metadata);
}
