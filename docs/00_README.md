# FHEVM StarterKit

Dokumen ini akan menjelaskan overview dari proyek FHEVM StarterKit, termasuk fitur-fitur utama, teknologi yang digunakan, dan cara memulai (kunjungi bagian "Getting Started" untuk instruksi lebih lanjut).

## Penjelasan struktur project

Proyek FHEVM StarterKit memiliki struktur direktori sebagai berikut:

```plaintext
fhevm-starterkit/
├── base/
│   ├── fhevm-hardhat-template/
│   ├── fhevm-relayer-template/
│   └── config.json
├── dev/
├── docs/
│   └── starters/
├── lib/
├── scripts/
├── projects/
├── starters/
├── .gitignore
├── package.json
└── README.md
```

### `base/`

Direktori ini berisi template dasar untuk dicopy ke dalam proyek baru. Isinya kosong, sampai user melakukan insialisasi template dengan menjalankan `npm run template:init`.

### `base/fhevm-hardhat-template/`

Template dasar untuk proyek FHEVM Hardhat. Hasil clone dari template resmi dari zama.

### `base/fhevm-relayer-template/`

Template ui relayer (erzawansyah) untuk berinteraksi dengan kontrak FHEVM. Semacam explorer custom yang mendukung fitur FHEVM (enkripsi/dekripsi).

### `base/config.json`

File konfigurasi yang dibutuhkan untuk menggunakan base template ke proyek baru.

### `dev/`

Direktori ini digunakan sebagai **workspace pengembangan internal**.

Isinya bersifat sementara dan **tidak termasuk starter resmi**, misalnya:

- eksperimen kontrak sebelum dijadikan starter
- proof of concept
- uji coba script automation
- sandbox untuk testing CLI dan generator

Folder ini **tidak ikut diproses** oleh generator dokumentasi maupun checker konsistensi.

Tujuannya jelas:
memisahkan **eksperimen** dari **artefak final** yang dipublikasikan.

---

### `docs/`

Direktori dokumentasi utama proyek.

Struktur di dalamnya dirancang agar **mudah digenerate otomatis** dan **siap diintegrasikan ke GitBook atau sistem docs lain**.

#### `docs/starters/`

Berisi dokumentasi hasil generate untuk setiap starter.

Setiap starter akan memiliki satu folder dokumentasi yang:

- dihasilkan dari:

  - komentar NatSpec di kontrak
  - metadata `starter-meta.json`
  - README starter

- disusun secara naratif:

  - tujuan
  - konsep FHEVM
  - alur penggunaan
  - potensi kesalahan umum

Folder ini **tidak ditulis manual**, melainkan dibangun oleh script `npm run docs`.

---

### `lib/`

Berisi **library internal** yang dipakai lintas script dan tooling.

Contoh isi yang direncanakan:

- parser metadata (`starter-meta.json`)
- helper validasi schema
- util untuk scanning folder starter
- formatter output dokumentasi
- helper konsistensi (checker)

Prinsipnya:

> script boleh tipis, logika berat masuk ke `lib/`

Ini penting untuk menjaga maintainability saat project membesar.

---

### `scripts/`

Berisi seluruh **tooling automation** yang menjadi inti nilai proyek ini.

Script yang direncanakan dan fungsinya:

- `template:init`
  Meng-clone dan menyiapkan base template (Hardhat + relayer UI)

- `template:update`
  Menarik update terbaru dari template eksternal (Zama & relayer)

- `starter:init`
  Membuat starter baru dengan struktur konsisten

- `starter:use`
  Menggunakan starter sebagai basis project baru (mode migrate / boilerplate)

- `docs`
  Generate dokumentasi otomatis dari starter dan kontrak

- `check`
  Mengecek konsistensi:

  - metadata ada atau tidak
  - struktur starter valid
  - kontrak punya test dan docs

- `validate:metadata`
  Validasi `starter-meta.json` terhadap schema

Folder ini adalah **jantung inovasi Example Hub**.

---

### `projects/`

Berisi **project hasil generate** atau **project yang sedang digunakan user**.

Fungsinya:

- hasil dari `starter:use`
- project nyata yang:

  - sudah di-migrate dari starter
  - bisa langsung dikembangkan lebih lanjut

Folder ini **bukan template** dan **bukan starter**, tapi **output pemakaian starter**.

Dengan pemisahan ini:

- starter tetap bersih
- user bebas mengotak-atik project tanpa merusak basis starter

---

### `starters/`

Berisi seluruh **starter resmi FHEVM StarterKit**.

Setiap folder di dalamnya adalah **satu unit pembelajaran**, dengan struktur konsisten:

```plaintext
starter-name/
├── contracts/
├── tests/
├── ui/        (opsional)
├── README.md
└── starter-meta.json
```

Starter diklasifikasikan menggunakan:

- **Category**: fundamental, patterns, applied, advanced
- **Tags**: fleksibel
- **Concepts**: konsep FHEVM yang diajarkan

Folder inilah yang:

- dipindai oleh automation
- dijadikan sumber dokumentasi
- dinilai langsung oleh juri bounty
