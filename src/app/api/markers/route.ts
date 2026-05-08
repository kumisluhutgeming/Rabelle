import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EXCLUDED_JENIS } from '@/lib/constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const minLat = parseFloat(searchParams.get('minLat') || '-90');
  const maxLat = parseFloat(searchParams.get('maxLat') || '90');
  const minLng = parseFloat(searchParams.get('minLng') || '-180');
  const maxLng = parseFloat(searchParams.get('maxLng') || '180');
  
  const jenis = searchParams.get('jenis');
  const operator = searchParams.get('operator');
  const provinsi = searchParams.get('provinsi');
  const kota = searchParams.get('kota');

  // Filter for both counts and viewport
  const baseWhere: any = {
    stasiun_radio: {
      jenis_komunikasi: { notIn: EXCLUDED_JENIS }
    }
  };
  if (jenis) baseWhere.stasiun_radio.jenis_komunikasi = jenis;
  if (operator) baseWhere.stasiun_radio.nama_penyelenggara = operator;
  if (provinsi) baseWhere.locations = { ...baseWhere.locations, provinsi };
  if (kota) baseWhere.locations = { ...baseWhere.locations, kota };

  // Viewport-specific where
  const viewportWhere = {
    ...baseWhere,
    lokasi_pemancar: {
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLng, lte: maxLng },
    }
  };

  try {
    // 1. Get viewport markers for detail view
    const viewportMarkers = await prisma.pengukuran.findMany({
      where: viewportWhere,
      select: {
        id: true,
        stasiun_radio: { select: { nama_penyelenggara: true, jenis_komunikasi: true } },
        locations: { select: { kota: true, provinsi: true } },
        lokasi_pemancar: { select: { latitude: true, longitude: true } }
      },
      take: 1500,
    });

    // 2. Get global counts for stable clusters (Ignoring viewport bounds)
    // We group by province and kota to get stable totals
    const globalStats = await prisma.pengukuran.groupBy({
      by: ['location_id'],
      where: baseWhere,
      _count: { id: true },
    });

    // Since we need city/province names for the counts, we fetch location names
    const locationInfo = await prisma.locations.findMany({
      where: { id: { in: globalStats.map(s => s.location_id).filter((id): id is bigint => id !== null) } },
      select: { id: true, kota: true, provinsi: true }
    });

    // Build the stats map
    const provinceStats: Record<string, number> = {};
    const kotaStats: Record<string, number> = {};

    globalStats.forEach(stat => {
      const loc = locationInfo.find(l => l.id === stat.location_id);
      if (loc) {
        const pName = loc.provinsi || 'Lainnya';
        const kName = loc.kota || 'Lainnya';
        provinceStats[pName] = (provinceStats[pName] || 0) + stat._count.id;
        kotaStats[kName] = (kotaStats[kName] || 0) + stat._count.id;
      }
    });

    const formattedMarkers = viewportMarkers.map(m => ({
      id: m.id.toString(),
      lat: Number(m.lokasi_pemancar?.latitude),
      lng: Number(m.lokasi_pemancar?.longitude),
      nama: m.stasiun_radio?.nama_penyelenggara || 'Unknown',
      jenis: m.stasiun_radio?.jenis_komunikasi || 'Lainnya',
      kota: m.locations?.kota || 'Unknown',
      provinsi: m.locations?.provinsi || 'Unknown'
    }));

    return NextResponse.json({
      markers: formattedMarkers,
      stats: {
        province: provinceStats,
        kota: kotaStats
      }
    });
  } catch (error) {
    console.error('Marker Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch markers' }, { status: 500 });
  }
}
