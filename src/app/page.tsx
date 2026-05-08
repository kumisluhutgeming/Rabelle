import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import LandingPageClient from "./LandingPageClient";

export const revalidate = 60; // Cache for 60 seconds

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  // Fetch dynamic stats
  const [totalTowers, btsCount, tvCount, radioCount] = await Promise.all([
    prisma.pengukuran.count(),
    prisma.pengukuran.count({ where: { stasiun_radio: { jenis_komunikasi: 'Telekomunikasi/Seluler' } } }),
    prisma.pengukuran.count({ where: { stasiun_radio: { jenis_komunikasi: 'TV' } } }),
    prisma.pengukuran.count({ where: { stasiun_radio: { jenis_komunikasi: 'Radio' } } })
  ]);

  const stats = {
    total: totalTowers,
    bts: btsCount,
    tv: tvCount,
    radio: radioCount
  };

  return <LandingPageClient session={session} stats={stats} />;
}
