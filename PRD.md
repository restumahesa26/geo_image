**Nama Proyek:** GeoTag Pro (atau nama lain yang Anda inginkan)
Tujuan: Menyediakan aplikasi berbasis web yang memungkinkan pengguna menyematkan informasi lokasi lengkap (visual dan EXIF metadata) pada sebuah foto dengan antarmuka yang mudah digunakan.

## Fitur Utama
- **Pengunggahan Gambar:** Mendukung format standar (JPG, PNG).

- **Pencarian Lokasi Cepat:** Integrasi fitur pencarian (Search Box) menggunakan Google Maps API atau OpenStreetMap (Nominatim). Pengguna cukup mengetik nama tempat tanpa harus menggeser koordinat manual.

- **Geotag Visual Terpadu:** Sistem secara otomatis menempelkan kotak informasi (tag) pada gambar yang berisi:

   - Nama Lokasi
   - Alamat Lengkap
   - Koordinat (Latitude & Longitude)
   - Thumbnail / Screenshot peta mini dari lokasi tersebut.
   - Kustomisasi Desain Tag:
   - Pilihan warna latar belakang (background) kotak tag.
   - Pilihan warna teks.
   - Beberapa variasi tata letak (template/desain) tag lokasi (misal: minimalis, detail, transparan).
   - Injeksi Metadata (EXIF): Selain tampilan visual, koordinat lokasi (Lat/Long) disematkan secara digital ke dalam metadata EXIF gambar hasil unduhan.
   - Live Preview & Download: Pratinjau gambar secara real-time sebelum diunduh.

**Alur Pengguna (User Flow)**
- Pengguna mengunggah foto.

- Pengguna mengetikkan nama lokasi di kolom pencarian. Sistem menampilkan titik di peta dan mengambil data nama lokasi, alamat, dan Lat/Long.

- Kanvas di sebelah kiri langsung memperbarui foto dengan overlay tag lokasi dan thumbnail peta.

- Pengguna menyesuaikan warna dan template tag jika diperlukan.

- Pengguna menekan unduh. Sistem menggunakan kanvas untuk membuat gambar baru dan menyuntikkan data EXIF GPS, lalu menyimpannya ke perangkat.