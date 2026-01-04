# 🖥️ Panduan Setup Virtual Machine (VM) untuk CloudKu

Panduan ini akan membantu Anda membuat lingkungan "Production-like" menggunakan VirtualBox di komputer lokal Anda. Ini memungkinkan Anda menguji fitur-fitur sistem CloudKu (Nginx Auto-config, SSL, DNS) dengan aman sebelum deploy ke VPS berbayar.

---

## 🛠️ 1. Persiapan

### Bahan yang Diperlukan:
1.  **VirtualBox**: Download dan install dari [virtualbox.org](https://www.virtualbox.org/).
2.  **Ubuntu Server 22.04 LTS ISO**: Download dari website resmi Ubuntu. (Pilih versi Server, tanpa GUI biar ringan).

---

## ⚙️ 2. Membuat VM di VirtualBox

1.  Buka VirtualBox → Klik **New**.
2.  **Name**: `CloudKu-Server`
    *   **Type**: Linux
    *   **Version**: Ubuntu (64-bit)
3.  **Memory (RAM)**: Minimal `2048 MB` (2GB). Kalau PC kuat, kasih `4096 MB`.
4.  **Hard Disk**: Create virtual hard disk → VDI → Dynamically allocated → Size minimal `20 GB`.
5.  **PENTING - Network Setting**:
    *   Klik Kanan VM → **Settings** → **Network**.
    *   Adapter 1: Ganti dari "NAT" menjadi **Bridged Adapter**.
    *   Pilih network card PC Anda (WiFi atau Ethernet Controller yang tersambung internet).
    *   *Kenapa Bridged? Agar VM dapat IP sendiri yang satu jaringan dengan PC Anda, jadi bisa diakses langsung.*

---

## 💿 3. Instalasi Ubuntu Server

1.  Start VM, pilih file ISO Ubuntu Server yang sudah didownload.
2.  Ikuti wizard instalasi:
    *   Bahasa: English
    *   Network: Pastikan dapat IP (misal `192.168.1.xxx`). Catat IP ini!
    *   Proxy: Kosongkan.
    *   Storage: Use entire disk.
    *   Profile: Isi username (misal: `cloudku`) dan password.
    *   **SSH Setup**: Centang `[x] Install OpenSSH server` (Penting buat copy file nanti).
3.  Tunggu selesai, lalu **Reboot**.

---

## 🚀 4. Setup Environment Server

Login ke VM (via terminal langsung atau via SSH/Putty dari Windows).

### A. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### B. Install Node.js (v18+)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v # Cek versi, harus v18+
```

### C. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Buat User Database & DB
sudo -u postgres psql
# Di dalam PSQL:
CREATE DATABASE hostmodern;
CREATE USER postgres WITH ENCRYPTED PASSWORD '1234'; -- Sesuaikan dengan .env
GRANT ALL PRIVILEGES ON DATABASE hostmodern TO postgres;
\q
```

### D. Install Nginx & Certbot
```bash
sudo apt install -y nginx certbot
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📦 5. Deploy CloudKu ke VM

### A. Pindahkan Code
Cara paling gampang pakai Git.

1.  **Di Windows (Project CloudKu):**
    *   Push code Anda ke GitHub repository (Private/Public).
2.  **Di VM:**
    *   Clone repo tersebut.
    ```bash
    git clone https://github.com/username/cloudku.git
    cd cloudku
    ```

### B. Install Dependencies
```bash
npm install
```

### C. Setup Environment Variables
Buat file `.env.local` di VM.
```bash
nano .env.local
```
Isi sesuaikan dengan database VM:
```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostmodern
DB_USER=postgres
DB_PASSWORD=1234
SERVER_IP=192.168.1.50  # Ganti dengan IP VM Anda!
JWT_SECRET=rahasia_anda_disini
```

### D. Setup Database Tables
Jalankan migrasi manual atau via tool (karena kita belum setup migration runner production, cara cepatnya):
```bash
# Install client pg jika belum
sudo apt install postgresql-client

# Import SQL files
psql -U postgres -d hostmodern -f server/db/migrations/001_initial_schema.sql
psql -U postgres -d hostmodern -f server/db/migrations/002_files_storage.sql
psql -U postgres -d hostmodern -f server/db/migrations/003_domain_management.sql
psql -U postgres -d hostmodern -f server/db/migrations/004_powerdns_schema.sql
```

### E. Jalankan Aplikasi
```bash
# Build frontend
npm run build

# Start Backend
npm run start
# Atau pakai PM2 biar jalan terus di background
sudo npm install -g pm2
pm2 start server/index.ts --interpreter ./node_modules/.bin/ts-node --name cloudku
```

---

## 🌐 6. Testing dari Windows

Misalkan IP VM adalah `192.168.1.50`.

### A. Akses Panel
Buka browser di Windows: `http://192.168.1.50:3000`
Login dan coba fitur-fiturnya.

### B. Test Domain (Nginx Magic)
1.  Di CloudKu Panel (VM), Add Domain: `nazxf.my.id`.
2.  Tunggu sukses.
3.  **Di Windows**, edit hosts file agar domain itu pointing ke VM.
    *   Buka Notepad as Administrator.
    *   Open `C:\Windows\System32\drivers\etc\hosts`.
    *   Tambah baris:
        ```
        192.168.1.50  nazxf.my.id
        192.168.1.50  www.nazxf.my.id
        ```
    *   Save.
4.  Buka browser Windows, akses: `http://nazxf.my.id`.
5.  **BOOM!** Anda harusnya melihat halaman default (atau 403 Forbidden Nginx default) yang dilayani oleh Nginx di dalam VM. Ini membuktikan Nginx auto-config bekerja.

---

## ⚠️ Catatan tentang SSL
Untuk SSL (Let's Encrypt), **Certbot butuh Public IP** dan domain asli. Karena VM ada di jaringan lokal (Local LAN), Certbot akan **gagal memverifikasi**.

Untuk testing SSL di Local VM:
1.  Gunakan **Self-Signed Certificate** (CloudKu perlu dimodif dikit support generate self-signed).
2.  Atau cukup puas dengan HTTP verified via Nginx config, dan test SSL nanti saat deploy ke VPS asli.
