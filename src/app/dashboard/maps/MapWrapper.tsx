"use client";

import dynamic from "next/dynamic";

const MapWithNoSSR = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Memuat Peta Persebaran...</p>
      </div>
    </div>
  )
});

export default function MapWrapper({ markers }: { markers: any[] }) {
  return <MapWithNoSSR markers={markers} />;
}
