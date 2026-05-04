<script setup>
import { ref, onMounted } from 'vue'

const listBarang = ref([])
const listResep = ref([])
const isEdit = ref(false)
const listBahan = ref([])

const form = ref({
  ID: null,
  NamaBarang: '',
  HargaDefault: 0,
  resep_id: '',
  metode_konversi: 'Gram',
  kebutuhan_adonan: 0,
  masa_simpan: 2, // Default 2 Hari
  kemasan_detail: [],
})

const tambahKemasan = () => form.value.kemasan_detail.push({ bahan_id: '', kebutuhan: 1 })
const hapusKemasan = (idx) => form.value.kemasan_detail.splice(idx, 1)

const fetchMasterData = async () => {
  try {
    const token = localStorage.getItem('inventory_token')
    const headers = { 'Authorization': `Bearer ${token}` }

    // BARU: Tambahkan panggilan API ke /api/bahan
    const [resBarang, resResep, resBahan] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/barangs`, { headers }),
      fetch(`${import.meta.env.VITE_API_URL}/api/resep`, { headers }),
      fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers }) 
    ])
    
    if (resBarang.ok) listBarang.value = await resBarang.json()
    if (resResep.ok) listResep.value = await resResep.json()
    if (resBahan.ok) listBahan.value = await resBahan.json() 
  } catch (err) {
    console.error("Gagal load data:", err)
  }
}

const handleSubmit = async () => {
  const method = isEdit.value ? 'PUT' : 'POST'
  const url = isEdit.value 
    ? `${import.meta.env.VITE_API_URL}/api/barangs/${form.value.ID}` 
    : `${import.meta.env.VITE_API_URL}/api/barangs`

  const payload = {
    NamaBarang: form.value.NamaBarang,
    HargaDefault: Number(form.value.HargaDefault),
    resep_id: form.value.resep_id ? Number(form.value.resep_id) : null,
    metode_konversi: form.value.metode_konversi,
    kebutuhan_adonan: Number(form.value.kebutuhan_adonan),
    masa_simpan: Number(form.value.masa_simpan),
    kemasan_detail: form.value.kemasan_detail
  }

  const token = localStorage.getItem('inventory_token')
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    })

    if (!res.ok) throw new Error("Gagal menyimpan data")

    resetForm()
    fetchMasterData()
  } catch (err) {
    alert("Gagal simpan barang: " + err.message)
  }
}

const editBarang = (b) => {
  isEdit.value = true
  form.value = {
    ID: b.ID,
    NamaBarang: b.NamaBarang,
    HargaDefault: b.HargaDefault,
    resep_id: b.resep_id || '',
    metode_konversi: b.metode_konversi || 'Gram',
    kebutuhan_adonan: b.kebutuhan_adonan || 0,
    masa_simpan: b.masa_simpan || 2,
    kemasan_detail: b.kemasan_detail || []
  }
}

const hapusBarang = async (id) => {
  if (confirm('Yakin membuang produk ini ke tempat sampah?')) {
    const token = localStorage.getItem('inventory_token')
    await fetch(`${import.meta.env.VITE_API_URL}/api/barangs/${id}`, { 
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchMasterData()
  }
}

const resetForm = () => {
  isEdit.value = false
  form.value = { ID: null, NamaBarang: '', HargaDefault: 0, resep_id: '', metode_konversi: 'Gram', kebutuhan_adonan: 0, masa_simpan: 2 }
}

const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)

// FITUR ATUR URUTAN (Sama seperti sebelumnya)
const geserAtas = (idx) => { if (idx > 0) [listBarang.value[idx], listBarang.value[idx-1]] = [listBarang.value[idx-1], listBarang.value[idx]] }
const geserBawah = (idx) => { if (idx < listBarang.value.length - 1) [listBarang.value[idx], listBarang.value[idx+1]] = [listBarang.value[idx+1], listBarang.value[idx]] }

const simpanUrutan = async () => {
  const payload = listBarang.value.map((b, index) => ({ id: b.ID, urutan: index }))
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/barangs/reorder`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  if (res.ok) alert("Urutan barang berhasil dikunci!")
}

onMounted(fetchMasterData)
</script>

<template>
  <div class="p-8 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Kelola Katalog Produk (Master Barang)</h1>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
      <h2 class="text-lg font-bold text-gray-800 mb-4">
        {{ isEdit ? '✏️ Edit Data Produk' : '➕ Daftarkan Produk Baru' }}
      </h2>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">Nama Produk Final</label>
            <input v-model="form.NamaBarang" type="text" required class="w-full border-2 rounded p-2 focus:border-blue-500 font-bold outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">Harga Jual (Rp)</label>
            <input v-model.number="form.HargaDefault" type="number" required min="0" class="w-full border-2 rounded p-2 focus:border-blue-500 font-black outline-none text-green-700">
          </div>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
          <label class="block text-xs font-black text-blue-900 mb-2 uppercase">Koneksi Modul Dapur (Resep)</label>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label class="block text-xs font-bold text-gray-600 mb-1">Dibuat dari Resep Apa?</label>
              <select v-model="form.resep_id" class="w-full border-2 rounded p-2 focus:border-blue-500 font-bold outline-none bg-white">
                <option value="">-- Tidak Terikat Resep / Barang Titipan --</option>
                <option v-for="r in listResep" :key="r.ID" :value="r.ID">{{ r.nama_resep }}</option>
              </select>
            </div>
            
            <template v-if="form.resep_id">
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">Metode Konversi</label>
                <select v-model="form.metode_konversi" class="w-full border-2 rounded p-2 focus:border-blue-500 font-bold outline-none bg-white">
                  <option value="Gram">Gram (Berat Adonan)</option>
                  <option value="Pcs">Pcs / Fraksi (Loyang)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">Kebutuhan Adonan / Pcs</label>
                <input v-model.number="form.kebutuhan_adonan" type="number" step="any" min="0" required class="w-full border-2 rounded p-2 focus:border-blue-500 font-black outline-none" :placeholder="form.metode_konversi === 'Gram' ? 'Misal: 60 (gr)' : 'Misal: 0.25 (Pcs)'">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">Expired Date (Masa Simpan)</label>
                <div class="relative">
                   <input v-model.number="form.masa_simpan" type="number" min="1" required class="w-full border-2 border-red-300 bg-red-50 rounded p-2 focus:border-red-500 font-black text-red-900 outline-none pr-12">
                   <span class="absolute right-3 top-2 text-xs font-bold text-red-500">Hari</span>
                </div>
              </div>
            </template>
          </div>
          <p v-if="form.resep_id" class="text-[10px] text-gray-500 mt-2 font-bold italic">
            *Artinya: 1 buah "{{ form.NamaBarang || 'Produk Ini' }}" membutuhkan {{ form.kebutuhan_adonan || 0 }} {{ form.metode_konversi }} dari resep terpilih.
          </p>
        </div>
        <!-- UI BARU KEMASAN -->
        <div class="bg-purple-50 p-4 rounded-lg border border-purple-100 mt-4">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-xs font-black text-purple-900 uppercase">Koneksi Kemasan (Dus/Plastik/Tataan)</label>
            <button type="button" @click="tambahKemasan" class="text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded shadow transition">+ Tambah Kemasan</button>
          </div>
          
          <div v-for="(k, idx) in form.kemasan_detail" :key="idx" class="flex gap-2 items-center mb-2">
            <select v-model="k.bahan_id" required class="flex-1 border-2 border-white rounded p-1.5 focus:border-purple-500 font-bold text-sm outline-none shadow-sm">
              <option value="" disabled>Pilih Kemasan...</option>
              <option v-for="mb in listBahan" :key="mb.ID" :value="mb.ID">{{ mb.nama_bahan }} ({{ mb.satuan }})</option>
            </select>
            <input v-model.number="k.kebutuhan" type="number" step="any" min="0.01" class="w-20 border-2 border-white rounded p-1.5 text-center font-black text-sm outline-none focus:border-purple-500 shadow-sm" placeholder="Qty">
            <button type="button" @click="hapusKemasan(idx)" class="text-red-500 font-black text-2xl hover:text-red-700 px-1 leading-none">×</button>
          </div>
          <p class="text-[10px] text-gray-500 font-bold italic mt-1">
            *Berapa banyak kemasan (lembar/pcs) yang dipotong otomatis saat roti ini dimasukkan ke Laporan Matang.
          </p>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button v-if="isEdit" type="button" @click="resetForm" class="px-5 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded">Batal</button>
          <button type="submit" class="bg-blue-600 text-white px-8 py-2.5 rounded font-black shadow hover:bg-blue-700 transition">
            {{ isEdit ? 'Simpan Perubahan' : 'Daftarkan Produk' }}
          </button>
        </div>
      </form>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div class="bg-gray-100 p-3 flex justify-end border-b">
          <button @click="simpanUrutan" class="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded shadow font-bold text-sm transition">
              💾 Simpan Posisi Urutan
          </button>
      </div>

      <table class="w-full text-sm text-left">
          <thead class="bg-gray-800 text-white">
              <tr>
                  <th class="p-3 w-16 text-center">Urutan</th>
                  <th class="p-3">Nama Produk</th>
                  <th class="p-3 text-right">Harga Jual</th>
                  <th class="p-3">Koneksi Dapur</th>
                  <th class="p-3 text-center">Aksi</th>
              </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
              <tr v-for="(b, index) in listBarang" :key="b.ID" class="hover:bg-blue-50 transition">
                  <td class="p-3 text-center bg-gray-50">
                      <div class="flex flex-col items-center">
                          <button @click="geserAtas(index)" :disabled="index === 0" class="text-gray-400 hover:text-blue-600 disabled:opacity-20 font-black leading-none">▲</button>
                          <span class="text-xs font-bold text-gray-500 my-1">{{ index + 1 }}</span>
                          <button @click="geserBawah(index)" :disabled="index === listBarang.length - 1" class="text-gray-400 hover:text-blue-600 disabled:opacity-20 font-black leading-none">▼</button>
                      </div>
                  </td>
                  <td class="p-3 font-bold text-gray-900">{{ b.NamaBarang }}</td>
                  <td class="p-3 text-right font-black text-green-700">Rp {{ formatRp(b.HargaDefault) }}</td>
                  <td class="p-3">
                    <div v-if="b.resep_id" class="bg-blue-100 border border-blue-200 px-2 py-1 rounded inline-block">
                      <p class="text-xs font-bold text-blue-900">🥣 {{ b.resep?.nama_resep || 'Resep Terhapus' }}</p>
                      <p class="text-[10px] text-blue-700 font-medium">Beban: {{ b.kebutuhan_adonan }} {{ b.metode_konversi }}</p>
                      <!-- TAMPILAN MASA SIMPAN -->
                      <p class="text-[10px] text-red-600 font-black mt-1">⏳ Expired: {{ b.masa_simpan }} Hari</p>
                    </div>
                    <span v-else class="text-xs text-gray-400 italic font-bold">Barang Titipan (No Resep)</span>
                  </td>
                  <td class="p-3 text-center">
                      <div class="flex justify-center gap-3">
                          <button @click="editBarang(b)" class="text-blue-600 hover:text-blue-800 font-bold px-2 py-1 bg-white border rounded shadow-sm">Edit</button>
                          <button @click="hapusBarang(b.ID)" class="text-red-600 hover:text-red-800 font-bold px-2 py-1 bg-white border rounded shadow-sm">Hapus</button>
                      </div>
                  </td>
              </tr>
          </tbody>
      </table>
    </div>
  </div>
</template>