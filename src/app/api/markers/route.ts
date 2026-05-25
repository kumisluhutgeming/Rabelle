import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { EXCLUDED_JENIS } from '@/lib/constants';
import { rateLimit } from '@/lib/rate-limit';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.isAdmin || false;

  // Rate Limiting
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = rateLimit(ip, 50); // 50 requests per minute

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

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
        lokasi_pemancar: { select: { latitude: true, longitude: true, tinggi_menara_m: true, frekuensi: true, azimuths: true } }
      },
      take: 1500,
    });

    // 2. Get global counts for stable clusters (Ignoring viewport bounds)
    // We use a raw query to join locations and group directly in the database
    const queryRawParams = Prisma.sql`
      SELECT 
        l.provinsi, 
        l.kota, 
        CAST(COUNT(p.id) AS UNSIGNED) as total 
      FROM pengukuran p
      LEFT JOIN locations l ON p.location_id = l.id
      LEFT JOIN stasiun_radio s ON p.stasiun_radio_id = s.id
      WHERE 
        s.jenis_komunikasi NOT IN (${Prisma.join(EXCLUDED_JENIS)})
        ${jenis ? Prisma.sql`AND s.jenis_komunikasi = ${jenis}` : Prisma.empty}
        ${operator ? Prisma.sql`AND s.nama_penyelenggara = ${operator}` : Prisma.empty}
        ${provinsi ? Prisma.sql`AND l.provinsi = ${provinsi}` : Prisma.empty}
        ${kota ? Prisma.sql`AND l.kota = ${kota}` : Prisma.empty}
      GROUP BY l.provinsi, l.kota
    `;

    const rawStats: any[] = await prisma.$queryRaw(queryRawParams);

    // Build the stats map
    const provinceStats: Record<string, number> = {};
    const kotaStats: Record<string, number> = {};

    rawStats.forEach(stat => {
      const pName = stat.provinsi || 'Lainnya';
      const kName = stat.kota || 'Lainnya';
      const count = Number(stat.total);
      provinceStats[pName] = (provinceStats[pName] || 0) + count;
      kotaStats[kName] = (kotaStats[kName] || 0) + count;
    });

    const formattedMarkers = viewportMarkers.map(m => {
      const lat = Number(m.lokasi_pemancar?.latitude);
      const lng = Number(m.lokasi_pemancar?.longitude);

      let parsedAzimuths = null;
      if (m.lokasi_pemancar?.azimuths) {
        try {
          parsedAzimuths = JSON.parse(m.lokasi_pemancar.azimuths);
        } catch (e) {}
      }

      return {
        id: m.id.toString(),
        lat: lat,
        lng: lng,
        latStr: m.lokasi_pemancar?.latitude?.toString(),
        lngStr: m.lokasi_pemancar?.longitude?.toString(),
        nama: m.stasiun_radio?.nama_penyelenggara || 'Unknown',
        jenis: m.stasiun_radio?.jenis_komunikasi || 'Lainnya',
        kota: m.locations?.kota || 'Unknown',
        provinsi: m.locations?.provinsi || 'Unknown',
        hTower: m.lokasi_pemancar?.tinggi_menara_m ? Number(m.lokasi_pemancar.tinggi_menara_m) : undefined,
        freq: m.lokasi_pemancar?.frekuensi || undefined,
        azimuths: parsedAzimuths
      };
    });

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
