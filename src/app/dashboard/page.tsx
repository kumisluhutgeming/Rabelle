import prisma from "@/lib/prisma";
import DashboardPageClient from "./DashboardPageClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    btsCount,
    tvCount,
    radioCount,
    totalCount,
    topOperatorsRaw,
    topProvinsisRaw
  ] = await Promise.all([
    prisma.pengukuran.count({ where: { stasiun_radio: { jenis_komunikasi: 'Telekomunikasi/Seluler' } } }),
    prisma.pengukuran.count({ where: { stasiun_radio: { jenis_komunikasi: 'TV' } } }),
    prisma.pengukuran.count({ where: { stasiun_radio: { jenis_komunikasi: 'Radio' } } }),
    prisma.pengukuran.count(),
    prisma.stasiun_radio.groupBy({
      by: ['nama_penyelenggara'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    }),
    prisma.locations.findMany({
      include: { _count: { select: { pengukurans: true } } },
      orderBy: { pengukurans: { _count: 'desc' } },
      take: 10
    })
  ]);

  const stats = {
    total: totalCount,
    bts: btsCount,
    tv: tvCount,
    radio: radioCount,
    operators: topOperatorsRaw.map(op => ({
      name: op.nama_penyelenggara || 'Lainnya',
      count: op._count.id
    })),
    provinsi: topProvinsisRaw.map(p => ({
      name: p.provinsi,
      count: p._count.pengukurans
    }))
  };

  return <DashboardPageClient stats={stats} />;
}
