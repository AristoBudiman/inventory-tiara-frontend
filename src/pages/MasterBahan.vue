<script setup>
import { ref, onMounted } from 'vue'

const listBahan = ref([])
const isEdit = ref(false)

// Form Master Bahan (Hanya Nama & Satuan)
const formBahan = ref({ ID: null, nama_bahan: '', satuan: 'gr' })

// Form Pembelian (Restok)
const showModalBeli = ref(false)
const formBeli = ref({
  tanggal: new Date().toISOString().split('T')[0],
  bahan_id: null,
  nama_bahan_tampil: '',
  qty: 0,
  harga_beli_satuan: 0,
  keterangan: ''
})

const fetchBahan = async () => {
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.ok) listBahan.value = await res.json()
}

// SIMPAN MASTER BAHAN
const simpanBahan = async () => {
  const method = isEdit.value ? 'PUT' : 'POST'
  const url = isEdit.value 
    ? `${import.meta.env.VITE_API_URL}/api/bahan/${formBahan.value.ID}` 
    : `${import.meta.env.VITE_API_URL}/api/bahan`
    
  const token = localStorage.getItem('inventory_token')
  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(formBahan.value)
  })
  
  isEdit.value = false
  formBahan.value = { ID: null, nama_bahan: '', satuan: 'gr' }
  fetchBahan()
}

const editBahan = (b) => {
  isEdit.value = true
  formBahan.value = { ID: b.ID, nama_bahan: b.nama_bahan, satuan: b.satuan }
}

const hapusBahan = async (id) => {
  if(confirm('Hapus bahan ini ke tempat sampah?')) {
    const token = localStorage.getItem('inventory_token')
    await fetch(`${import.meta.env.VITE_API_URL}/api/bahan/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchBahan()
  }
}

// BUKA MODAL PEMBELIAN
const bukaModalBeli = (b) => {
  formBeli.value = {
    tanggal: new Date().toISOString().split('T')[0],
    bahan_id: b.ID,
    nama_bahan_tampil: b.nama_bahan, // Hanya untuk display UI
    qty: 0,
    harga_beli_satuan: b.harga_saat_ini || 0, // Suggest harga terakhir
    keterangan: ''
  }
  showModalBeli.value = true
}

// SIMPAN PEMBELIAN (Otomatis nambah stok & ubah harga master)
const simpanPembelian = async () => {
  if(formBeli.value.qty <= 0) return alert('Qty belanja tidak boleh 0!')
  
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(formBeli.value)
  })
  
  if (res.ok) {
    alert('Belanja berhasil dicatat! Stok & Harga otomatis terupdate.')
    showModalBeli.value = false
    fetchBahan() // Refresh tabel untuk lihat stok baru
  }
}

const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)

onMounted(fetchBahan)
</script>

<template>
  <div class="p-8 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Kelola Master Bahan Baku</h1>

    <!-- FORM TAMBAH BAHAN -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
      <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>{{ isEdit ? '✏️ Edit Data Bahan' : '➕ Daftarkan Bahan Baru' }}</span>
      </h2>
      <form @submit.prevent="simpanBahan" class="flex flex-col md:flex-row gap-4 items-end">
        <div class="flex-1 w-full">
          <label class="block text-xs font-bold text-gray-600 mb-1">Nama Bahan (ex: Terigu Cakra)</label>
          <input v-model="formBahan.nama_bahan" type="text" required class="w-full border-2 border-gray-200 rounded p-2 focus:border-blue-500 font-bold outline-none">
        </div>
        <div class="w-full md:w-48">
          <label class="block text-xs font-bold text-gray-600 mb-1">Satuan</label>
          <select v-model="formBahan.satuan" class="w-full border-2 border-gray-200 rounded p-2 focus:border-blue-500 font-bold outline-none">
            <option value="gr">Gram (gr)</option>
            <option value="ml">MiliLiter (ml)</option>
            <option value="pcs">Pieces (pcs)</option>
          </select>
        </div>
        <div class="flex gap-2">
            <button v-if="isEdit" type="button" @click="isEdit = false; formBahan = {ID:null, nama_bahan:'', satuan:'gr'}" class="px-4 py-2 font-bold text-gray-500">Batal</button>
            <button type="submit" class="bg-gray-900 text-white px-6 py-2.5 rounded font-bold shadow hover:bg-black transition">
            {{ isEdit ? 'Simpan Perubahan' : 'Daftarkan Bahan' }}
            </button>
        </div>
      </form>
    </div>

    <!-- TABEL BAHAN BAKU -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-100 text-gray-700">
          <tr>
            <th class="p-4 font-bold">Nama Bahan</th>
            <th class="p-4 font-bold text-center">Stok Gudang</th>
            <th class="p-4 font-bold text-right">Hpp Terakhir / Satuan</th>
            <th class="p-4 font-bold text-center">Aksi Aman</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="b in listBahan" :key="b.ID" class="hover:bg-blue-50 transition">
            <td class="p-4 font-bold text-gray-900">{{ b.nama_bahan }}</td>
            <td class="p-4 text-center">
              <span class="font-black text-lg text-blue-700">{{ b.stok }}</span> <span class="text-xs text-gray-500 font-bold">{{ b.satuan }}</span>
            </td>
            <td class="p-4 text-right font-bold text-gray-700">
              Rp {{ formatRp(b.harga_saat_ini) }} <span class="text-xs text-gray-400">/ {{ b.satuan }}</span>
            </td>
            <td class="p-4 text-center">
              <div class="flex justify-center gap-2">
                <!-- Tombol Beli (Yang bisa ngubah Stok & Harga) -->
                <button @click="bukaModalBeli(b)" class="bg-green-100 text-green-800 border border-green-300 px-3 py-1 rounded font-bold text-xs hover:bg-green-200 transition">
                  🛒 Restok / Catat Beli
                </button>
                <button @click="editBahan(b)" class="text-blue-600 font-bold px-2 hover:underline">Edit Nama</button>
                <button @click="hapusBahan(b.ID)" class="text-red-600 font-bold px-2 hover:underline">Hapus</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL POPUP BELANJA -->
    <div v-if="showModalBeli" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-8 border-green-500">
        <h2 class="text-2xl font-black text-gray-800 mb-1">🛒 Catat Pembelian Bahan</h2>
        <p class="text-sm font-bold text-gray-500 mb-6">Bahan: <span class="text-green-700">{{ formBeli.nama_bahan_tampil }}</span></p>

        <form @submit.prevent="simpanPembelian" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">Tanggal Nota Pembelian</label>
            <input type="date" v-model="formBeli.tanggal" required class="w-full border-2 rounded p-2 focus:border-green-500 font-bold outline-none">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-600 mb-1">Total Qty (gr/ml/pcs)</label>
              <input type="number" v-model.number="formBeli.qty" required min="1" step="any" class="w-full border-2 rounded p-2 focus:border-green-500 font-black text-blue-700 outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 mb-1">Harga Beli PER Satuan (Rp)</label>
              <input type="number" v-model.number="formBeli.harga_beli_satuan" required min="0" step="any" class="w-full border-2 rounded p-2 focus:border-green-500 font-black text-gray-800 outline-none">
            </div>
          </div>
          <div class="bg-gray-100 p-3 rounded text-right">
             <p class="text-xs font-bold text-gray-500">Total Uang Keluar:</p>
             <p class="text-xl font-black text-red-600">Rp {{ formatRp(formBeli.qty * formBeli.harga_beli_satuan) }}</p>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">Keterangan / Beli di mana? (Opsional)</label>
            <input type="text" v-model="formBeli.keterangan" class="w-full border-2 rounded p-2 focus:border-green-500 font-medium outline-none">
          </div>
          <div class="flex justify-end gap-3 pt-4 border-t">
            <button type="button" @click="showModalBeli = false" class="px-5 py-2 font-bold text-gray-500 hover:text-gray-800">Batal</button>
            <button type="submit" class="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 shadow-md transition">Simpan Pembelian</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>