# E-Loto IoT Management System

Sistem manajemen E-Loto berbasis IoT menggunakan ESP32 dengan GPS tracking dan RFID integration.

## Fitur Utama

### Dashboard
- **Menu Dashboard**: Menampilkan daftar box E-Loto yang aktif dengan posisi GPS real-time
- **GPS Location**: Klik icon lokasi untuk melihat detail E-Loto pada peta interaktif
- **Real-time Status**: Update status unit secara real-time

### Machine Management
- **Input E-Loto**: Registrasi unit E-Loto baru
- **Notification System**: Notifikasi otomatis ketika E-Loto perlu registrasi/maintenance
- **Maintenance Register**: Form registrasi kerusakan dengan informasi:
  - Tipe kerusakan
  - Unit yang terdampak
  - Estimasi waktu pengerjaan
  - Foto/dokumentasi kerusakan

## Struktur Folder

```
E-loto/
├── backend/          # API Server (Node.js/Express)
├── frontend/         # Dashboard (React)
├── firmware/         # ESP32 Arduino Code
├── database/         # Database scripts & schemas
└── docs/            # Documentation
```

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React, Redux, Leaflet Maps
- **IoT Device**: ESP32, RFID Reader
- **Communication**: HTTP REST API, MQTT (optional)

## Getting Started

Lihat README di setiap folder untuk instruksi setup.

## Kontribusi

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Create Pull Request
