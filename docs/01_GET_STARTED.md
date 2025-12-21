# Get Started with FHEVM StarterKit

Selamat datang di panduan "Get Started" untuk FHEVM StarterKit! Di sini, Anda akan menemukan langkah-langkah dasar untuk memulai dengan proyek ini, termasuk instalasi, konfigurasi, dan menjalankan contoh sederhana.

## Prasyarat

Sebelum memulai, pastikan Anda telah menginstal hal-hal berikut di sistem Anda:

- Node.js (versi terbaru direkomendasikan)
- npm atau yarn
- Git

## Langkah 1: Clone Repository

Mulailah dengan meng-clone repository FHEVM StarterKit dari GitHub:

```bash
git clone https://github.com/erzawansyah/fhevm-starterkit.git
cd fhevm-starterkit
```

## Langkah 2: Inisialisasi Template

Jalankan perintah berikut untuk menginisialisasi template dasar ke dalam proyek Anda:

```bash
npm run template:init
```

Perintah ini akan melakukan clone template dasar dari repository yang diatur pada `starterkit.config.json` ke dalam folder `./base`.
Proses insialisasi ini hanya perlu dilakukan sekali.

Di balik layar, proses clone akan mengambil template dari commit tertentu yang sudah ditentukan di `starterkit.config.json` untuk memastikan konsistensi. Jika Anda ingin menggunakan versi terbaru saat inisialisasi, jalankan perintah berikut:

```bash
npm run template:init --latest
```

Atau, jika Anda ingin mengupdate template ke versi terbaru di masa mendatang, gunakan perintah:

```bash
npm run template:update
```

Base template yang sudah di-clone akan digunakan setiap kali Anda menginisialisasi proyek baru menggunakan skrip starter.

## Langkah 3: Hardhat configuration dan variabel lingkungan

Ini adalah langkah yang sebenarnya opsional, namun sangat disarankan apabila Anda belum pernah mengatur konfigurasi Hardhat di sistem Anda.
Anda bisa mengikuti panduan resmi dari [dokumentasi zama](https://docs.zama.org/protocol/solidity-guides/getting-started/setup#set-up-the-hardhat-configuration-variables-optional) untuk mengatur variabel lingkungan yang dibutuhkan, atau menjalankan perintah berikut:

```bash
npm run hardhat:setup

# Di background, perintah ini akan menjalankan skrip
# 1. npx hardhat vars set MNEMONIC
# 2. npx hardhat vars set INFURA_API_KEY
```

Jika Anda berencana menggunakan explorer frontend, yang mana adalah fitur utama dari FHEVM StarterKit, Anda juga perlu mengatur variabel lingkungan tambahan dengan menjalankan perintah berikut:

```bash
npm run frontend:setup

# Di background, perintah ini akan membuat file
# .env.local di dalam folder ./base/fhevm-relayer-template
# dan meminta Anda untuk mengisi variabel lingkungan yang dibutuhkan.
```

Variabel lingkungan yang dibutuhkan adalah Wallet Connect Project ID yang bisa Anda dapatkan dengan mendaftar di [Wallet Connect](https://dashboard.walletconnect.com/).

## Langkah 4: Inisialisasi Proyek Starter

Ada beberapa cara untuk menginisialisasi proyek starter baru. Berikut adalah contoh perintah untuk membuat proyek baru yang umum:

```bash
npm run starter:init <starter-name> --dir <directory-name>
```

Gantilah `<starter-name>` dengan nama starter yang tersedia di dalam folder `./starters`.
Menggunakan opsi `--dir` memungkinkan Anda menentukan nama folder untuk proyek baru Anda. Jika tidak ditentukan, nama folder akan mengikuti nama starter.
Setiap proyek yang diinisialisasi akan ditempatkan di dalam folder `./projects/<directory-name>`

> **Catatan:** Pada saat pertama kali menjalankan perintah ini, proses inisialisasi mungkin memakan waktu lebih lama karena akan terjadi proses build base template untuk frontend relayer.
> Proses build ini hanya perlu dilakukan sekali, dan akan terjadi secara otomatis jika tidak ditemukan folder `dist` di dalam `./base/fhevm-relayer-template`.

Jika kamu ingin melihat lebih lengkap metode inisialisasi proyek starter, silakan merujuk ke [cara menggunakan starter script](02_USING_STARTER_SCRIPT.md).

## Langkah 5: Instalasi Dependensi Proyek

Setelah proyek berhasil diinisialisasi, masuk ke dalam direktori proyek baru Anda dan instal dependensi yang dibutuhkan:

```bash
cd projects/<directory-name>
npm install
```

## Langkah 6: Jalankan Proyek

Sekarang Anda siap untuk menjalankan proyek Anda! Anda bisa melakukan deploy, test, atau menjalankan ui sesuai dengan kebutuhan Anda.

### Compile dan Deploy Kontrak

```bash
npx hardhat compile
npx hardhat deploy

# Jika ingin menentukan jaringan tertentu (sementara yang tersedia adalah sepolia)
# npx hardhat deploy --network <network-name>
```

### Jalankan UI

Eksplorasi kontrak Anda dengan menjalankan UI.

```bash
# Deploy kontrak terlebih dahulu sebelum menjalankan UI
npx hardhat deploy

# Rekomendasi: deploy di jaringan sepolia
npx hardhat deploy --network sepolia

# Jalankan node
npx hardhat node

# Di terminal lain, jalankan UI
npm run dev
```

Anda sekarang dapat mengakses UI di `http://localhost:3000` untuk berinteraksi dengan kontrak yang telah Anda deploy.
