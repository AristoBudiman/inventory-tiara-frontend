<script setup>
import { ref, onMounted } from 'vue'

const listBahan = ref([])
const isEdit = ref(false)

const formBahan = ref({ ID: null, nama_bahan: '', satuan: 'gr', batas_minimum: 0 })
const showModalBeli = ref(false)

// UBAH: formBeli sekarang menangkap 'total_biaya' alih-alih 'harga_beli_satuan'
const formBeli = ref({ tanggal: new Date().toISOString().split('T')[0], bahan_id: null, nama_bahan_tampil: '', qty: 0, total_biaya: 0, keterangan: '' })

const fetchBahan = async () => {
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers: { 'Authorization': `Bearer ${token}` } })
  if (res.ok) listBahan.value = await res.json()
}

const simpanBahan = async () => {
  const method = isEdit.value ? 'PUT' : 'POST'
  const url = isEdit.value ? `${import.meta.env.VITE_API_URL}/api/bahan/${formBahan.value.ID}` : `${import.meta.env.VITE_API_URL}/api/bahan`
  const token = localStorage.getItem('inventory_token')
  await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formBahan.value) })
  isEdit.value = false; formBahan.value = { ID: null, nama_bahan: '', satuan: 'gr', batas_minimum: 0 }; fetchBahan()
}

const editBahan = (b) => { isEdit.value = true; formBahan.value = { ID: b.ID, nama_bahan: b.nama_bahan, satuan: b.satuan, batas_minimum: b.batas_minimum } }
const hapusBahan = async (id) => {
  if(confirm('Hapus bahan ini ke tempat sampah?')) {
    const token = localStorage.getItem('inventory_token')
    await fetch(`${import.meta.env.VITE_API_URL}/api/bahan/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
    fetchBahan()
  }
}

// UBAH: Saat buka modal, reset 'total_biaya' ke 0
const bukaModalBeli = (b) => { formBeli.value = { tanggal: new Date().toISOString().split('T')[0], bahan_id: b.ID, nama_bahan_tampil: b.nama_bahan, qty: 0, total_biaya: 0, keterangan: '' }; showModalBeli.value = true }

const simpanPembelian = async () => {
  if(formBeli.value.qty <= 0) return alert('Qty belanja tidak boleh 0!')
  if(formBeli.value.total_biaya < 0) return alert('Total biaya tidak valid!')
  
  // RUMUS AJAIB: Sistem yang hitung HPP otomatisnya!
  const harga_satuan_otomatis = formBeli.value.total_biaya / formBeli.value.qty

  // Susun data untuk dikirim ke Backend persis seperti sebelumnya
  const payload = {
    tanggal: formBeli.value.tanggal,
    bahan_id: formBeli.value.bahan_id,
    qty: formBeli.value.qty,
    harga_beli_satuan: harga_satuan_otomatis, // Ini yang diterima oleh Golang
    keterangan: formBeli.value.keterangan
  }

  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
      body: JSON.stringify(payload) 
  })
  if (res.ok) { alert('Belanja berhasil dicatat! Stok & Harga terupdate.'); showModalBeli.value = false; fetchBahan() }
}
const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)
onMounted(fetchBahan)
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between border-b-2 border-gray-200 pb-4">
      <div>
        <h1 class="text-3xl font-black text-gray-800 tracking-tight">📦 Katalog Bahan & Kemasan</h1>
        <p class="text-sm text-gray-500 font-medium mt-1">Kelola data mentah, stok gudang, dan HPP otomatis.</p>
      </div>
    </div>

    <!-- Panel Form -->
    <div class="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
      <div class="bg-blue-600 px-6 py-4 flex items-center gap-3">
        <h2 class="text-lg font-bold text-white">{{ isEdit ? '✏️ Edit Data Bahan' : '✨ Daftarkan Bahan Baru' }}</h2>
      </div>
      <form @submit.prevent="simpanBahan" class="p-6 bg-blue-50/30">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div class="md:col-span-5">
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Nama Bahan / Kemasan</label>
            <input v-model="formBahan.nama_bahan" type="text" required placeholder="Contoh: Tepung Segitiga Biru" class="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:border-blue-500 font-bold outline-none transition-colors text-gray-800 bg-white">
          </div>
          <div class="md:col-span-3">
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Satuan (UOM)</label>
            <select v-model="formBahan.satuan" class="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:border-blue-500 font-bold outline-none transition-colors text-gray-800 bg-white cursor-pointer">
              <option value="gr">Gram (gr)</option>
              <option value="ml">MiliLiter (ml)</option>
              <option value="pcs">Pieces (pcs)</option>
              <option value="lmbr">Lembar (lmbr)</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Batas Minimum</label>
            <input v-model.number="formBahan.batas_minimum" type="number" required min="0" step="any" class="w-full border-2 border-red-300 bg-white rounded-lg p-2.5 focus:border-red-500 font-black text-red-600 text-center outline-none transition-colors">
          </div>
          <div class="md:col-span-2 flex gap-2">
            <button v-if="isEdit" type="button" @click="isEdit = false; formBahan = {ID:null, nama_bahan:'', satuan:'gr', batas_minimum:0}" class="flex-1 px-4 py-2.5 rounded-lg font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors">Batal</button>
            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-md transition-colors">
              {{ isEdit ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Tabel Data -->
    <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-100 border-b-2 border-gray-200">
          <tr>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs">Nama Bahan</th>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs text-center w-48">Stok Gudang</th>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs text-right">HPP Terakhir</th>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs text-center w-64">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="b in listBahan" :key="b.ID" class="hover:bg-blue-50/50 transition-colors">
            <td class="p-4 font-bold text-gray-800 text-base">{{ b.nama_bahan }}</td>
            <td class="p-4 text-center">
              <div class="inline-flex items-baseline justify-center px-3 py-1 rounded-lg border-2 shadow-sm" :class="b.stok <= b.batas_minimum ? 'bg-red-50 border-red-400 text-red-700 animate-pulse' : 'bg-white border-blue-200 text-blue-800'">
                <span class="font-black text-xl mr-1">{{ b.stok }}</span> 
                <span class="text-xs font-bold uppercase">{{ b.satuan }}</span>
              </div>
              <p v-if="b.stok <= b.batas_minimum" class="text-[10px] text-red-600 font-black mt-1 uppercase tracking-widest">⚠️ Stok Kritis</p>
            </td>
            <td class="p-4 text-right">
              <span class="font-bold text-gray-800 text-base">Rp {{ formatRp(b.harga_saat_ini) }}</span>
              <span class="text-[10px] text-gray-500 font-medium ml-1">/ {{ b.satuan }}</span>
            </td>
            <td class="p-4">
              <!-- Tombol Solid agar awam mudah lihat -->
              <div class="flex justify-center gap-2">
                <button @click="bukaModalBeli(b)" class="bg-green-500 hover:bg-green-600 text-white shadow-sm px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1 transition-colors">
                  🛒 Restok
                </button>
                <button @click="editBahan(b)" class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded font-bold text-xs transition-colors">Edit</button>
                <button @click="hapusBahan(b.ID)" class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded font-bold text-xs transition-colors">Del</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL POPUP BELANJA -->
    <div v-if="showModalBeli" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-8 border-green-500">
        <h2 class="text-xl font-black text-gray-800 mb-1">🛒 Catat Pembelian Bahan</h2>
        <p class="text-sm font-bold text-gray-500 mb-6">Bahan: <span class="text-green-700">{{ formBeli.nama_bahan_tampil }}</span></p>

        <form @submit.prevent="simpanPembelian" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">Tanggal Nota Pembelian</label>
            <input type="date" v-model="formBeli.tanggal" required class="w-full border-2 border-gray-300 rounded p-2 focus:border-green-500 font-bold outline-none">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-600 mb-1">Total Qty Masuk Gudang</label>
              <input type="number" v-model.number="formBeli.qty" required min="1" step="any" class="w-full border-2 border-gray-300 rounded p-2 focus:border-green-500 font-black text-gray-800 outline-none">
            </div>
            <div>
              <!-- UBAH: Text label disesuaikan, v-model diarahkan ke total_biaya -->
              <label class="block text-xs font-bold text-gray-600 mb-1">Total Harga Beli / Nota (Rp)</label>
              <input type="number" v-model.number="formBeli.total_biaya" required min="0" step="any" class="w-full border-2 border-red-200 bg-red-50 rounded p-2 focus:border-red-500 font-black text-red-700 outline-none">
            </div>
          </div>
          
          <!-- UBAH: Tampilan HPP dihitung langsung di layar admin -->
          <div class="bg-blue-50 border border-blue-200 p-3 rounded-lg text-right">
             <p class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">HPP Baru Per Satuan (Otomatis):</p>
             <p class="text-xl font-black text-blue-700">Rp {{ formatRp(formBeli.qty > 0 ? formBeli.total_biaya / formBeli.qty : 0) }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">Keterangan (Opsional)</label>
            <input type="text" v-model="formBeli.keterangan" class="w-full border-2 border-gray-300 rounded p-2 focus:border-green-500 font-medium outline-none">
          </div>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" @click="showModalBeli = false" class="px-5 py-2 font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded transition-colors">Batal</button>
            <button type="submit" class="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 shadow-md transition-colors">Simpan Pembelian</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>