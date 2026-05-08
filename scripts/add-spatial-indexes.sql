-- Add indexes to improve coordinate-based range queries (Spatial Query Filtering)
ALTER TABLE lokasi_pemancar ADD INDEX idx_lat_lng (latitude, longitude);
ALTER TABLE lokasi_pemancar ADD INDEX idx_lat (latitude);
ALTER TABLE lokasi_pemancar ADD INDEX idx_lng (longitude);
