// Daftar provinsi yang didukung aplikasi
export const PROVINSI_LIST = [
  "Banten",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "DI Yogyakarta",
  "Bali",
] as const;

export type Provinsi = (typeof PROVINSI_LIST)[number];

// Jenis komunikasi yang dikecualikan dari filter & tampilan
export const EXCLUDED_JENIS = ["lighting", "Lighting"];

// Path yang perlu di-revalidate setelah mutasi data tower
export const TOWER_REVALIDATE_PATHS = [
  "/dashboard/data-tabel",
  "/dashboard/maps",
  "/dashboard",
] as const;
