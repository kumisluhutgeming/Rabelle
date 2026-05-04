import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 1) {
    return NextResponse.json([]);
  }

  try {
    const operators = await prisma.stasiun_radio.findMany({
      where: {
        nama_penyelenggara: { contains: q },
      },
      select: { nama_penyelenggara: true },
      distinct: ["nama_penyelenggara"],
      take: 5,
    });

    return NextResponse.json(operators.map((o) => o.nama_penyelenggara));
  } catch (error) {
    console.error("Error fetching operators:", error);
    return NextResponse.json([]);
  }
}
