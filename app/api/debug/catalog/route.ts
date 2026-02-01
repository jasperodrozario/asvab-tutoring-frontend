import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(
    "https://connect.squareupsandbox.com/v2/catalog/object/GW7VT4ZZ6QME7VDJ23KH7BMY",
    {
      headers: {
        Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-12-18",
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
