import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const p = searchParams.get('p'); // Provinsi optional filter

  if (!q || q.length < 1) {
    return NextResponse.json([]);
  }

  const whereClause: any = {
    kota: { contains: q }
  };
  
  if (p) {
    whereClause.provinsi = p;
  }

  try {
    const locations = await prisma.locations.findMany({
      where: whereClause,
      select: {
        kota: true
      },
      distinct: ['kota'],
      take: 5
    });

    return NextResponse.json(locations.map(l => l.kota));
  } catch (error) {
    console.error("Error fetching kota:", error);
    return NextResponse.json([]);
  }
}
