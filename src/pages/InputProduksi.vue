<script setup>
import { ref, onMounted, watch } from 'vue'

const getToday = () => new Date().toISOString().split('T')[0]

const filterTanggal = ref(getToday())
const listResep = ref([])
const listBarang = ref([])
const riwayatMasak = ref([])
const riwayatMatang = ref([])

// State Form
const formMasak = ref({ resep_id: '', jumlah_batch: 1 })
const formMatang = ref({ barang_id: '', qty_matang: 0 })

// STATE KERANJANG (DRAFT)
const draftMasak = ref([])
const draftMatang = ref([])
const isSubmitting = ref(false)

// Ambil Master Data
const fetchMasterData = async () => {
  const token = localStorage.getItem('inventory_token')
  const headers = { 'Authorization': `Bearer ${token}` }
  
  const [resResep, resBarang] = await Promise.all([
    fetch(`${import.meta.env.VITE_API_URL}/api/resep`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/barangs`, { headers })
  ])
  
  if (resResep.ok) listResep.value = await resResep.json() || []
  if (resBarang.ok) listBarang.value = await resBarang.json() || []
}

// Ambil Riwayat Hari Ini
const fetchRiwayat = async () => {
  const token = localStorage.getItem('inventory_token')
  const headers = { 'Authorization': `Bearer ${token}` }
  
  const [resMasak, resMatang] = await Promise.all([
    fetch(`${import.meta.env.VITE_API_URL}/api/produksi/masak?tanggal=${filterTanggal.value}`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/produksi/matang?tanggal=${filterTanggal.value}`, { headers })
  ])
  
  if (resMasak.ok) riwayatMasak.value = await resMasak.json() || []
  if (resMatang.ok) riwayatMatang.value = await resMatang.json() || []
}

// ==========================================
// LOGIKA DRAFT MASAK (PREDIKSI DAPUR)
// ==========================================
const tambahDraftMasak = () => {
  if (!formMasak.value.resep_id || formMasak.value.jumlah_batch <= 0) return alert('Pilih resep dan pastikan jumlah lebih dari 0!')
  const resepTerpilih = listResep.value.find(r => r.ID === formMasak.value.resep_id)
  
  draftMasak.value.push({
    resep_id: formMasak.value.resep_id,
    nama_resep: resepTerpilih.nama_resep,
    jumlah_batch: formMasak.value.jumlah_batch
  })
  // Reset form setelah masuk draft
  formMasak.value = { resep_id: '', jumlah_batch: 1 }
}

const hapusDraftMasak = (idx) => {
  draftMasak.value.splice(idx, 1)
}

const finalisasiMasak = async () => {
  if (draftMasak.value.length === 0) return alert('Draft masak masih kosong!')
  if (!confirm('FINALISASI MASAK? Stok bahan baku di gudang akan otomatis terpotong sesuai resep yang ada di draft.')) return

  isSubmitting.value = true
  const token = localStorage.getItem('inventory_token')

  try {
    // Kirim data di draft satu per satu ke backend secara berurutan
    for (const item of draftMasak.value) {
      const payload = {
        tanggal: filterTanggal.value,
        resep_id: item.resep_id,
        jumlah_batch: item.jumlah_batch
      }
      await fetch(`${import.meta.env.VITE_API_URL}/api/produksi/masak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
    }
    alert('Produksi Masak berhasil difinalisasi! Stok bahan terpotong.')
    draftMasak.value = [] // Kosongkan draft
    fetchRiwayat() // Refresh histori
  } catch (err) {
    alert('Terjadi kesalahan saat memproses finalisasi masak.')
  } finally {
    isSubmitting.value = false
  }
}

// ==========================================
// LOGIKA DRAFT MATANG (HASIL FISIK)
// ==========================================
const tambahDraftMatang = () => {
  if (!formMatang.value.barang_id || formMatang.value.qty_matang <= 0) return alert('Pilih produk dan isi jumlah matang!')
  const barangTerpilih = listBarang.value.find(b => b.ID === formMatang.value.barang_id)
  
  draftMatang.value.push({
    barang_id: formMatang.value.barang_id,
    nama_barang: barangTerpilih.NamaBarang,
    qty_matang: formMatang.value.qty_matang
  })
  formMatang.value = { barang_id: '', qty_matang: 0 }
}

const hapusDraftMatang = (idx) => {
  draftMatang.value.splice(idx, 1)
}

const finalisasiMatang = async () => {
  if (draftMatang.value.length === 0) return alert('Draft hasil matang masih kosong!')
  if (!confirm('FINALISASI MATANG? Pastikan semua hasil cetakan roti sudah dihitung dengan benar.')) return

  isSubmitting.value = true
  const token = localStorage.getItem('inventory_token')

  try {
    for (const item of draftMatang.value) {
      const payload = {
        tanggal: filterTanggal.value,
        barang_id: item.barang_id,
        qty_matang: item.qty_matang
      }
      await fetch(`${import.meta.env.VITE_API_URL}/api/produksi/matang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
    }
    alert('Hasil Matang berhasil difinalisasi!')
    draftMatang.value = []
    fetchRiwayat()
  } catch (err) {
    alert('Terjadi kesalahan saat memproses finalisasi matang.')
  } finally {
    isSubmitting.value = false
  }
}

watch(filterTanggal, () => { fetchRiwayat() })
onMounted(() => { fetchMasterData(); fetchRiwayat() })
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    
    <div class="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h1 class="text-2xl font-black text-gray-900">👨‍🍳 Laporan Produksi Harian</h1>
        <div class="flex items-center gap-3">
            <label class="text-sm font-bold text-gray-500">Tanggal Laporan:</label>
            <input type="date" v-model="filterTanggal" class="border-2 border-blue-400 rounded-lg p-2 font-bold focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900">
        </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
      
      <!-- ========================================== -->
      <!-- PANEL KIRI: MASAK (PREDIKSI)               -->
      <!-- ========================================== -->
      <div class="bg-white rounded-xl shadow-sm border-t-8 border-orange-500 flex flex-col">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-black text-orange-700 mb-1">1. Laporan Masak (Adonan)</h2>
          <p class="text-xs font-bold text-gray-500 mb-5">Input resep yang dimasak ke dalam draft sebelum difinalisasi.</p>
          
          <form @submit.prevent="tambahDraftMasak" class="flex flex-col sm:flex-row gap-3 items-end mb-6">
            <div class="flex-1 w-full">
              <label class="block text-xs font-bold text-gray-600 mb-1">Pilih Resep</label>
              <select v-model="formMasak.resep_id" required class="w-full border-2 rounded p-2 focus:border-orange-500 font-bold outline-none bg-gray-50">
                <option value="" disabled>-- Pilih Resep --</option>
                <option v-for="r in listResep" :key="r.ID" :value="r.ID">{{ r.nama_resep }}</option>
              </select>
            </div>
            <div class="w-full sm:w-28">
              <label class="block text-xs font-bold text-gray-600 mb-1">Jml Batch</label>
              <input v-model.number="formMasak.jumlah_batch" type="number" required min="0.1" step="any" class="w-full border-2 rounded p-2 focus:border-orange-500 font-black text-center outline-none">
            </div>
            <button type="submit" class="bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-400 font-bold px-4 py-2.5 rounded shadow-sm transition">
              ➕ Masukkan Draft
            </button>
          </form>

          <!-- DRAFT MASAK -->
          <div class="bg-orange-50 border-2 border-dashed border-orange-300 rounded-lg p-4">
            <h3 class="text-xs font-black text-orange-800 uppercase tracking-widest mb-3 flex items-center gap-2">🛒 Draft Keranjang Masak</h3>
            <div class="space-y-2 mb-4">
              <div v-for="(draft, idx) in draftMasak" :key="idx" class="bg-white p-2 rounded border shadow-sm flex justify-between items-center">
                <p class="font-bold text-gray-800 text-sm">{{ draft.nama_resep }}</p>
                <div class="flex items-center gap-3">
                  <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-black">{{ draft.jumlah_batch }}x Batch</span>
                  <button @click="hapusDraftMasak(idx)" class="text-red-500 hover:text-red-700 font-black text-xl leading-none px-1">×</button>
                </div>
              </div>
              <p v-if="draftMasak.length === 0" class="text-xs text-center text-orange-400 font-bold italic py-2">Keranjang masak kosong.</p>
            </div>
            <button @click="finalisasiMasak" :disabled="draftMasak.length === 0 || isSubmitting" class="w-full bg-orange-600 text-white font-black py-3 rounded-lg shadow-md hover:bg-orange-700 disabled:opacity-50 transition">
              {{ isSubmitting ? 'MEMPROSES...' : '🚀 FINALISASI MASAK & POTONG STOK' }}
            </button>
          </div>
        </div>

        <!-- HISTORI MASAK -->
        <div class="p-6 flex-1 rounded-b-xl bg-gray-50">
           <h3 class="font-bold text-gray-400 text-xs uppercase mb-3">Histori Finalisasi Hari Ini:</h3>
           <div class="space-y-2 max-h-48 overflow-y-auto">
             <div v-for="m in riwayatMasak" :key="m.ID" class="bg-white border p-3 rounded shadow-sm flex justify-between items-center">
                <div>
                   <p class="font-bold text-gray-800 text-sm">{{ m.resep?.nama_resep }}</p>
                   <p class="text-[10px] text-gray-500 font-medium">Prediksi Adonan: <span class="font-bold">{{ m.total_adonan }} gr</span></p>
                </div>
                <div class="bg-gray-200 text-gray-800 px-3 py-1 rounded font-black border text-xs">
                   {{ m.jumlah_batch }}x
                </div>
             </div>
             <p v-if="riwayatMasak.length === 0" class="text-xs text-gray-400 italic text-center py-4">Belum ada histori produksi.</p>
           </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- PANEL KANAN: MATANG (FISIK)                -->
      <!-- ========================================== -->
      <div class="bg-white rounded-xl shadow-sm border-t-8 border-green-500 flex flex-col">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-black text-green-700 mb-1">2. Laporan Hasil Matang</h2>
          <p class="text-xs font-bold text-gray-500 mb-5">Input jumlah fisik produk (pcs) yang berhasil matang ke dalam draft.</p>
          
          <form @submit.prevent="tambahDraftMatang" class="flex flex-col sm:flex-row gap-3 items-end mb-6">
            <div class="flex-1 w-full">
              <label class="block text-xs font-bold text-gray-600 mb-1">Pilih Produk (Matang)</label>
              <select v-model="formMatang.barang_id" required class="w-full border-2 rounded p-2 focus:border-green-500 font-bold outline-none bg-gray-50">
                <option value="" disabled>-- Pilih Produk Jadi --</option>
                <option v-for="b in listBarang" :key="b.ID" :value="b.ID">{{ b.NamaBarang }}</option>
              </select>
            </div>
            <div class="w-full sm:w-28">
              <label class="block text-xs font-bold text-gray-600 mb-1">Qty (Pcs)</label>
              <input v-model.number="formMatang.qty_matang" type="number" required min="1" class="w-full border-2 rounded p-2 focus:border-green-500 font-black text-center outline-none">
            </div>
            <button type="submit" class="bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-400 font-bold px-4 py-2.5 rounded shadow-sm transition">
              ➕ Masukkan Draft
            </button>
          </form>

          <!-- DRAFT MATANG -->
          <div class="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-4">
            <h3 class="text-xs font-black text-green-800 uppercase tracking-widest mb-3 flex items-center gap-2">🛒 Draft Keranjang Matang</h3>
            <div class="space-y-2 mb-4">
              <div v-for="(draft, idx) in draftMatang" :key="idx" class="bg-white p-2 rounded border shadow-sm flex justify-between items-center">
                <p class="font-bold text-gray-800 text-sm">{{ draft.nama_barang }}</p>
                <div class="flex items-center gap-3">
                  <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-black">{{ draft.qty_matang }} Pcs</span>
                  <button @click="hapusDraftMatang(idx)" class="text-red-500 hover:text-red-700 font-black text-xl leading-none px-1">×</button>
                </div>
              </div>
              <p v-if="draftMatang.length === 0" class="text-xs text-center text-green-400 font-bold italic py-2">Keranjang matang kosong.</p>
            </div>
            <button @click="finalisasiMatang" :disabled="draftMatang.length === 0 || isSubmitting" class="w-full bg-green-600 text-white font-black py-3 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50 transition">
              {{ isSubmitting ? 'MEMPROSES...' : '✅ FINALISASI HASIL MATANG' }}
            </button>
          </div>
        </div>

        <!-- HISTORI MATANG -->
        <div class="p-6 flex-1 rounded-b-xl bg-gray-50">
           <h3 class="font-bold text-gray-400 text-xs uppercase mb-3">Histori Finalisasi Hari Ini:</h3>
           <div class="space-y-2 max-h-48 overflow-y-auto">
             <div v-for="m in riwayatMatang" :key="m.ID" class="bg-white border p-3 rounded shadow-sm flex justify-between items-center">
                <p class="font-bold text-gray-800 text-sm">{{ m.barang?.NamaBarang }}</p>
                <div class="bg-gray-200 text-gray-800 px-3 py-1 rounded font-black border text-xs">
                   {{ m.qty_matang }} Pcs
                </div>
             </div>
             <p v-if="riwayatMatang.length === 0" class="text-xs text-gray-400 italic text-center py-4">Belum ada histori matang.</p>
           </div>
        </div>
      </div>

    </div>
  </div>
</template>