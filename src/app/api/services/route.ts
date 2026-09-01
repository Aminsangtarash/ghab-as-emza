import { NextResponse } from "next/server";

import { services } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    items: services.map((service) => ({
      slug: service.slug,
      title: service.title,
      short: service.short,
    })),
  });
}
