-- CreateTable
CREATE TABLE `locations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `kota` VARCHAR(255) NOT NULL,
    `provinsi` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `kode_wilayah` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `locations_kota_unique`(`kota`),
    INDEX `locations_provinsi_index`(`provinsi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lokasi_pemancar` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `alamat` TEXT NOT NULL,
    `kelurahan` VARCHAR(255) NULL,
    `kecamatan` VARCHAR(255) NULL,
    `telp_fax` VARCHAR(255) NULL,
    `tinggi_lokasi_mdpl` DECIMAL(8, 2) NULL,
    `tinggi_gedung_m` DECIMAL(8, 2) NULL,
    `tinggi_menara_m` DECIMAL(8, 2) NULL,
    `frekuensi` INTEGER NULL,
    `azimuths` VARCHAR(255) NULL,
    `location_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `lokasi_pemancar_location_id_foreign`(`location_id`),
    INDEX `lokasi_pemancar_lat_lng_index`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengukuran` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `stasiun_radio_id` BIGINT UNSIGNED NULL,
    `lokasi_pemancar_id` BIGINT UNSIGNED NULL,
    `tanggal_pengukuran` DATE NULL,
    `location_id` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `pengukuran_location_id_foreign`(`location_id`),
    INDEX `pengukuran_lokasi_pemancar_id_foreign`(`lokasi_pemancar_id`),
    INDEX `pengukuran_stasiun_radio_id_foreign`(`stasiun_radio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stasiun_radio` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nama_penyelenggara` VARCHAR(255) NOT NULL,
    `jenis_komunikasi` VARCHAR(255) NULL,
    `alamat` VARCHAR(255) NULL,
    `kelurahan` VARCHAR(255) NULL,
    `kecamatan` VARCHAR(255) NULL,
    `kota_madya` VARCHAR(255) NULL,
    `telp_fax` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `location_id` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `stasiun_radio_location_id_foreign`(`location_id`),
    INDEX `stasiun_radio_nama_penyelenggara_index`(`nama_penyelenggara`),
    INDEX `stasiun_radio_jenis_komunikasi_index`(`jenis_komunikasi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` TIMESTAMP(0) NULL,
    `password` VARCHAR(255) NOT NULL,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `role` ENUM('admin', 'viewers') NOT NULL DEFAULT 'viewers',
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `users_username_unique`(`username`),
    UNIQUE INDEX `users_email_unique`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(255) NOT NULL,
    `details` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lokasi_pemancar` ADD CONSTRAINT `lokasi_pemancar_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pengukuran` ADD CONSTRAINT `pengukuran_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pengukuran` ADD CONSTRAINT `pengukuran_lokasi_pemancar_id_foreign` FOREIGN KEY (`lokasi_pemancar_id`) REFERENCES `lokasi_pemancar`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pengukuran` ADD CONSTRAINT `pengukuran_stasiun_radio_id_foreign` FOREIGN KEY (`stasiun_radio_id`) REFERENCES `stasiun_radio`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stasiun_radio` ADD CONSTRAINT `stasiun_radio_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

