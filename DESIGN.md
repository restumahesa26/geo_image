## Rekomendasi Tech Stack
- **Framework Frontend**: Next.js (React) atau Laravel (sesuai kenyamanan Anda).

- **Styling**: Tailwind CSS untuk antarmuka yang cepat dan rapi.

- **Peta & Pencarian**: 
  - Google Maps API (Maps JavaScript API + Places API untuk pencarian + Static Maps API untuk thumbnail peta di dalam gambar).
  - Alternatif gratis: Leaflet.js + OpenStreetMap + Nominatim API.

 - **Manipulasi Gambar (Visual)**: HTML5 <canvas> API untuk menggabungkan gambar asli, teks, dan thumbnail peta.

 - **Manipulasi Metadata (EXIF)**: Library piexifjs atau exifr untuk menyuntikkan data GPS ke file JPG saat diunduh.

## Tata Letak Antarmuka (UI Layout)
Tampilan layar dibagi menjadi dua kolom utama (Split View) pada layar desktop:
- Kolom Kiri (Area Pratinjau / Canvas):
  - Tombol "Upload Foto".
  - Kanvas yang menampilkan foto ukuran besar dengan overlay Tag Lokasi yang bisa dilihat secara real-time.
- Kolom Kanan (Area Kontrol & Peta):
  - Bilah Pencarian (Search): Input teks untuk mencari lokasi.
  - Peta Interaktif: Menampilkan titik lokasi hasil pencarian.

Pengaturan Desain:
- Dropdown pilihan Template Desain.
- Color picker untuk Warna Background Tag.
- Color picker untuk Warna Teks.

Tombol Aksi Utama: Tombol "Generate & Download Image".**Nama Proyek:** GeoTag Pro (atau nama lain yang Anda inginkan)
Tujuan: Menyediakan aplikasi berbasis web yang memungkinkan pengguna menyematkan informasi lokasi lengkap (visual dan EXIF metadata) pada sebuah foto dengan antarmuka yang mudah digunakan.