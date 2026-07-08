<script setup>
import { ref, onMounted, watch } from 'vue'
import { ChefHat, Flame, ShoppingCart, Croissant, Trash2 } from 'lucide-vue-next'
import { hasPermission } from '../utils/permission'
import { getWIBDateString } from '../utils/date'

const filterTanggal = ref(getWIBDateString())
const listResep = ref([])
const listBarang = ref([])
const riwayatMasak = ref([])
const riwayatMatang = ref([])
const riwayatRusak = ref([]) // <--- BARU: Histori Rusak

const formMasak = ref({ resep_id: '', jumlah_batch: 1 })
// const formMatang = ref({ barang_id: '', qty_matang: 0 })
const formRusak = ref({ barang_id: '', qty: 0, keterangan: '' }) // <--- BARU: Form Rusak

const draftMasak = ref([])
// const draftMatang = ref([])
const draftRusak = ref([]) // <--- BARU: Draft Rusak
const isSubmitting = ref(false)

const fetchMasterData = async () => {
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }
  const [resResep, resBarang] = await Promise.all([
    fetch(`${import.meta.env.VITE_API_URL}/api/resep`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/barangs`, { headers })
  ])
  if (resResep.ok) listResep.value = await resResep.json() || []
  if (resBarang.ok) {
    listBarang.value = await resBarang.json() || []
    listBarang.value.forEach(b => {
      inputMatangBanyak.value[b.ID] = 0
    })
  }
}

const fetchRiwayat = async () => {
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }
  const [resMasak, resMatang, resRusak] = await Promise.all([
    fetch(`${import.meta.env.VITE_API_URL}/api/produksi/masak?tanggal=${filterTanggal.value}`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/produksi/matang?tanggal=${filterTanggal.value}`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/inventory/rusak?tanggal=${filterTanggal.value}`, { headers }) // <--- FETCH RUSAK
  ])
  if (resMasak.ok) riwayatMasak.value = await resMasak.json() || []
  if (resMatang.ok) riwayatMatang.value = await resMatang.json() || []
  if (resRusak.ok) riwayatRusak.value = await resRusak.json() || []
}

// LOGIKA MASAK
const tambahDraftMasak = () => {
  if (!formMasak.value.resep_id || formMasak.value.jumlah_batch <= 0) return window.$dialog.alert('Input tidak valid!')
  const resepTerpilih = listResep.value.find(r => r.ID === formMasak.value.resep_id)
  draftMasak.value.push({ resep_id: formMasak.value.resep_id, nama_resep: resepTerpilih.nama_resep, jumlah_batch: formMasak.value.jumlah_batch })
  formMasak.value = { resep_id: '', jumlah_batch: 1 }
}
const hapusDraftMasak = (idx) => draftMasak.value.splice(idx, 1)

const finalisasiMasak = async () => {
  if (draftMasak.value.length === 0) return
  if (!await window.$dialog.confirm('Eksekusi Masak? Stok bahan baku akan terpotong!')) return
  isSubmitting.value = true
  const token = localStorage.getItem('inventory_token')
  try {
    for (const item of draftMasak.value) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/produksi/masak`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ tanggal: filterTanggal.value, resep_id: item.resep_id, jumlah_batch: item.jumlah_batch }) })
    }
    draftMasak.value = []; fetchRiwayat()
  } catch (err) { window.$dialog.alert('Gagal memproses.') } finally { isSubmitting.value = false }
}

// LOGIKA MATANG MASAL
const inputMatangBanyak = ref({})

const finalisasiMatangMasal = async () => {
  const itemsToSubmit = Object.keys(inputMatangBanyak.value)
    .filter(id => inputMatangBanyak.value[id] > 0)
    .map(id => ({ barang_id: parseInt(id), qty_matang: inputMatangBanyak.value[id] }))

  if (itemsToSubmit.length === 0) return window.$dialog.alert('Belum ada Qty matang yang diisi!')
  if (!await window.$dialog.confirm(`Eksekusi Matang untuk ${itemsToSubmit.length} macam produk?`)) return
  
  isSubmitting.value = true
  const token = localStorage.getItem('inventory_token')
  try {
    for (const item of itemsToSubmit) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/produksi/matang`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ tanggal: filterTanggal.value, barang_id: item.barang_id, qty_matang: item.qty_matang }) 
      })
    }
    listBarang.value.forEach(b => {
      inputMatangBanyak.value[b.ID] = 0
    })
    fetchRiwayat()
  } catch (err) { window.$dialog.alert('Gagal memproses.') } finally { isSubmitting.value = false }
}

// LOGIKA RUSAK/AFKIR
const tambahDraftRusak = () => {
  if (!formRusak.value.barang_id || formRusak.value.qty <= 0) return window.$dialog.alert('Input tidak valid!')
  const barangTerpilih = listBarang.value.find(b => b.ID === formRusak.value.barang_id)
  draftRusak.value.push({ barang_id: formRusak.value.barang_id, nama_barang: barangTerpilih.NamaBarang, qty: formRusak.value.qty, keterangan: formRusak.value.keterangan || 'Afkir' })
  formRusak.value = { barang_id: '', qty: 0, keterangan: '' }
}
const hapusDraftRusak = (idx) => draftRusak.value.splice(idx, 1)

const finalisasiRusak = async () => {
  if (draftRusak.value.length === 0) return
  if (!await window.$dialog.confirm('Catat barang rusak/afkir ke sistem? Data ini akan mengurangi sisa kelayakan jual.')) return
  isSubmitting.value = true
  const token = localStorage.getItem('inventory_token')
  try {
    for (const item of draftRusak.value) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/rusak`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ tanggal: filterTanggal.value, barang_id: item.barang_id, qty: item.qty, keterangan: item.keterangan }) })
    }
    draftRusak.value = []; fetchRiwayat()
  } catch (err) { window.$dialog.alert('Gagal memproses.') } finally { isSubmitting.value = false }
}

// --- TAMBAHAN LOGIKA BATAL MASAK ---
const batalMasak = async (id) => {
  if (!await window.$dialog.confirm('Batalkan produksi masak ini? Bahan mentah akan dikembalikan otomatis ke gudang!')) return
  const token = localStorage.getItem('inventory_token')
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/produksi/masak/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if(res.ok) fetchRiwayat() // Langsung refresh data setelah dihapus
    else window.$dialog.alert('Gagal membatalkan.')
  } catch (err) { window.$dialog.alert('Error saat menghubungi server.') }
}

// --- TAMBAHAN LOGIKA BATAL MATANG ---
const batalMatang = async (id) => {
  if (!await window.$dialog.confirm('Batalkan hasil matang ini? Seluruh akumulasi di baris ini akan dihapus & kemasan dikembalikan. Pastikan Anda menginput ulang angka yang benar!')) return
  const token = localStorage.getItem('inventory_token')
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/produksi/matang/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if(res.ok) fetchRiwayat() // Langsung refresh data setelah dihapus
    else window.$dialog.alert('Gagal membatalkan.')
  } catch (err) { window.$dialog.alert('Error saat menghubungi server.') }
}

// --- TAMBAHAN LOGIKA BATAL RUSAK/AFKIR ---
const batalRusak = async (id) => {
  if (!await window.$dialog.confirm('Batalkan pencatatan afkir ini? Data akan dihapus dari sistem.')) return
  const token = localStorage.getItem('inventory_token')
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/rusak/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if(res.ok) fetchRiwayat() // Refresh riwayat setelah dihapus
    else window.$dialog.alert('Gagal membatalkan.')
  } catch (err) { window.$dialog.alert('Error saat menghubungi server.') }
}

watch(filterTanggal, fetchRiwayat)
onMounted(() => { fetchMasterData(); fetchRiwayat() })
</script>

<template>
  <div class="p-8 max-w-350 mx-auto space-y-8 animate-fade-in">
    
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
        <div>
          <h1 class="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2"><ChefHat :size="32" /> Eksekusi Dapur</h1>
          <p class="text-sm text-gray-500 font-medium mt-1">Laporan harian adonan dimasak, barang matang, & barang afkir.</p>
        </div>
        <div class="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">Tanggal:</label>
            <input type="date" v-model="filterTanggal" class="border-none bg-white rounded-lg p-2 font-bold focus:ring-2 focus:ring-blue-500 text-gray-800 outline-none shadow-sm cursor-pointer">
        </div>
    </div>

    <!-- DIUBAH MENJADI 3 KOLOM GRID -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      <!-- KIRI: PANEL MASAK (ORANGE) -->
      <div v-if="hasPermission('manage_produksi_masak')" class="bg-white rounded-2xl shadow-md border border-orange-100 flex flex-col overflow-hidden">
        <div class="bg-orange-500 p-5 text-white flex items-center gap-3">
          <Flame :size="28" />
          <div>
             <h2 class="text-lg font-black tracking-wide">Langkah 1: Masak</h2>
             <p class="text-[10px] font-bold text-orange-200 uppercase tracking-wider">Potong Stok Bahan Mentah</p>
          </div>
        </div>

        <div class="p-6 border-b border-gray-100 bg-orange-50/20">
          <form @submit.prevent="tambahDraftMasak" class="flex flex-col gap-3 mb-6">
            <div class="flex gap-3 items-end">
              <div class="flex-1">
                <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Resep Adonan</label>
                <select v-model="formMasak.resep_id" required class="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-orange-500 font-bold outline-none text-gray-800 cursor-pointer bg-white">
                  <option value="" disabled>-- Katalog Resep --</option>
                  <option v-for="r in listResep" :key="r.ID" :value="r.ID">{{ r.nama_resep }}</option>
                </select>
              </div>
              <div class="w-20">
                <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Batch</label>
                <input v-model.number="formMasak.jumlah_batch" type="number" @wheel="$event.target.blur()" required min="0.1" step="any" class="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-orange-500 font-black text-center outline-none text-orange-600 bg-white">
              </div>
              <button type="submit" class="bg-white border-2 border-orange-200 hover:border-orange-500 text-orange-600 font-black p-2.5 rounded-lg shadow-sm transition-colors text-xl leading-none px-4">+</button>
            </div>
          </form>

          <div class="bg-white border-2 border-dashed border-orange-200 rounded-xl p-4">
            <h3 class="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-3 flex items-center gap-1"><ShoppingCart :size="14" /> Draft Tunggu Eksekusi</h3>
            <div class="space-y-2 mb-4">
              <div v-for="(draft, idx) in draftMasak" :key="idx" class="bg-orange-50 p-2.5 rounded-lg border border-orange-100 flex justify-between items-center">
                <p class="font-bold text-gray-800 text-sm truncate pr-2">{{ draft.nama_resep }}</p>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="font-black text-orange-600 text-sm">{{ draft.jumlah_batch }}<span class="text-[10px] text-orange-400">x</span></span>
                  <button @click="hapusDraftMasak(idx)" class="text-red-400 hover:text-red-600 font-black text-lg leading-none px-1">×</button>
                </div>
              </div>
              <p v-if="draftMasak.length === 0" class="text-xs text-center text-gray-400 font-bold italic py-4">Keranjang kosong.</p>
            </div>
            <button @click="finalisasiMasak" :disabled="draftMasak.length === 0 || isSubmitting" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3.5 rounded-lg shadow-md disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2">
              <Flame v-if="!isSubmitting" :size="20" /> {{ isSubmitting ? 'MEMPROSES...' : 'EKSEKUSI' }}
            </button>
          </div>
        </div>

        <div class="p-6 bg-gray-50 flex-1">
           <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Histori Masak Hari Ini</h3>
           <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
             <div v-for="m in riwayatMasak" :key="m.ID" class="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex justify-between items-center">
                <div class="overflow-hidden">
                   <p class="font-bold text-gray-800 text-sm truncate">{{ m.resep?.nama_resep }}</p>
                   <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Est: {{ m.total_adonan }} gr</p>
                </div>
                <div class="flex items-center gap-2 shrink-0 ml-2">
                  <div class="bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm font-black border border-orange-200">
                      {{ m.jumlah_batch }}x
                  </div>
                  <button @click="batalMasak(m.ID)" title="Batalkan & Refund Bahan" class="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded p-1.5 transition-colors border border-red-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
             </div>
             <p v-if="riwayatMasak.length === 0" class="text-xs text-gray-400 font-bold italic text-center py-4">Belum ada histori.</p>
           </div>
        </div>
      </div>

      <!-- TENGAH: PANEL MATANG (HIJAU) -->
      <div v-if="hasPermission('manage_produksi_matang')" class="bg-white rounded-2xl shadow-md border border-emerald-100 flex flex-col overflow-hidden">
        <div class="bg-emerald-600 p-5 text-white flex items-center gap-3">
          <Croissant :size="28" />
          <div>
             <h2 class="text-lg font-black tracking-wide">Langkah 2: Matang</h2>
             <p class="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Catat Fisik Kue Siap Jual</p>
          </div>
        </div>

        <div class="p-6 border-b border-gray-100 bg-emerald-50/20">
          
          <div class="bg-white border-2 border-emerald-200 rounded-xl p-3 mb-4 max-h-72 overflow-y-auto custom-scrollbar shadow-inner">
            <div v-for="b in listBarang" :key="b.ID" class="flex justify-between items-center border-b border-gray-100 last:border-0 py-2.5">
              <span class="text-xs font-bold text-gray-700 truncate pr-2">{{ b.NamaBarang }}</span>
              <div class="w-20 shrink-0">
                <input v-model.number="inputMatangBanyak[b.ID]" type="number" @wheel="$event.target.blur()" min="0" step="any" placeholder="0" class="w-full border-2 border-emerald-100 rounded-lg p-1.5 text-center font-black text-emerald-700 outline-none focus:border-emerald-500 transition-colors bg-emerald-50/30">
              </div>
            </div>
            <p v-if="listBarang.length === 0" class="text-xs text-center text-gray-400 font-bold italic py-4">Loading produk...</p>
          </div>

          <button @click="finalisasiMatangMasal" :disabled="isSubmitting" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-lg shadow-md disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2">
            <Croissant v-if="!isSubmitting" :size="20" /> {{ isSubmitting ? 'MEMPROSES...' : 'EKSEKUSI SEMUA' }}
          </button>
        </div>

        <div class="p-6 bg-gray-50 flex-1">
           <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Histori Matang Hari Ini</h3>
           <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
             <div v-for="m in riwayatMatang" :key="m.ID" class="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex justify-between items-center">
                <p class="font-bold text-gray-800 text-sm truncate pr-2">{{ m.barang?.NamaBarang }}</p>
                <div class="flex items-center gap-2 shrink-0">
                  <div class="bg-emerald-100 text-emerald-800 px-3 py-1 rounded text-sm font-black border border-emerald-200">
                      {{ m.qty_matang }} <span class="text-[10px] text-emerald-600">Pcs</span>
                  </div>
                  <button @click="batalMatang(m.ID)" title="Batalkan & Refund Kemasan" class="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded p-1.5 transition-colors border border-red-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
             </div>
             <p v-if="riwayatMatang.length === 0" class="text-xs text-gray-400 font-bold italic text-center py-4">Belum ada histori.</p>
           </div>
        </div>
      </div>

      <!-- KANAN: PANEL RUSAK/AFKIR (MERAH) -->
      <div v-if="hasPermission('manage_barang_rusak')" class="bg-white rounded-2xl shadow-md border border-red-100 flex flex-col overflow-hidden">
        <div class="bg-red-600 p-5 text-white flex items-center gap-3">
          <Trash2 :size="28" />
          <div>
             <h2 class="text-lg font-black tracking-wide">Langkah 3: Afkir</h2>
             <p class="text-[10px] font-bold text-red-200 uppercase tracking-wider">Catat Rusak / Basi / Gratis</p>
          </div>
        </div>

        <div class="p-6 border-b border-gray-100 bg-red-50/20">
          <form @submit.prevent="tambahDraftRusak" class="flex flex-col gap-3 mb-6">
            <div class="flex gap-3 items-end">
              <div class="flex-1">
                <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Produk Afkir</label>
                <select v-model="formRusak.barang_id" required class="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-red-500 font-bold outline-none text-gray-800 cursor-pointer bg-white">
                  <option value="" disabled>-- Katalog Produk --</option>
                  <option v-for="b in listBarang" :key="b.ID" :value="b.ID">{{ b.NamaBarang }}</option>
                </select>
              </div>
              <div class="w-20">
                <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Pcs</label>
                <input v-model.number="formRusak.qty" type="number" @wheel="$event.target.blur()" required min="0.01" step="any" class="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-red-500 font-black text-center outline-none text-red-600 bg-white">
              </div>
            </div>
            <div class="flex gap-3 items-end">
              <div class="flex-1">
                <input v-model="formRusak.keterangan" type="text" placeholder="Keterangan (Dimakan Tikus/Basi)" required class="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-red-500 font-bold outline-none text-gray-800 bg-white text-xs">
              </div>
              <button type="submit" class="bg-white border-2 border-red-200 hover:border-red-500 text-red-600 font-black p-2 rounded-lg shadow-sm transition-colors text-xl leading-none px-4">+</button>
            </div>
          </form>

          <div class="bg-white border-2 border-dashed border-red-200 rounded-xl p-4">
            <h3 class="text-[10px] font-black text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1"><ShoppingCart :size="14" /> Draft Tunggu Eksekusi</h3>
            <div class="space-y-2 mb-4">
              <div v-for="(draft, idx) in draftRusak" :key="idx" class="bg-red-50 p-2.5 rounded-lg border border-red-100 flex justify-between items-center">
                <div class="overflow-hidden pr-2">
                    <p class="font-bold text-gray-800 text-sm truncate">{{ draft.nama_barang }}</p>
                    <p class="text-[10px] text-red-600 italic font-medium truncate">{{ draft.keterangan }}</p>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="font-black text-red-700 text-sm">{{ draft.qty }}<span class="text-[10px] text-red-500 ml-1">Pcs</span></span>
                  <button @click="hapusDraftRusak(idx)" class="text-red-400 hover:text-red-600 font-black text-lg leading-none px-1">×</button>
                </div>
              </div>
              <p v-if="draftRusak.length === 0" class="text-xs text-center text-gray-400 font-bold italic py-4">Keranjang kosong.</p>
            </div>
            <button @click="finalisasiRusak" :disabled="draftRusak.length === 0 || isSubmitting" class="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-lg shadow-md disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2">
              <Trash2 v-if="!isSubmitting" :size="20" /> {{ isSubmitting ? 'MEMPROSES...' : 'EKSEKUSI AFKIR' }}
            </button>
          </div>
        </div>

        <div class="p-6 bg-gray-50 flex-1">
           <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Histori Afkir Hari Ini</h3>
           <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
             <div v-for="r in riwayatRusak" :key="r.ID" class="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex justify-between items-center">
                <div class="overflow-hidden pr-2">
                    <p class="font-bold text-gray-800 text-sm truncate">{{ r.barang?.NamaBarang }}</p>
                    <p class="text-[10px] text-gray-500 italic truncate">{{ r.keterangan }}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div class="bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-black border border-red-200">
                      {{ r.qty }} <span class="text-[10px] text-red-600">Pcs</span>
                  </div>
                  <button @click="batalRusak(r.ID)" title="Batalkan Afkir" class="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded p-1.5 transition-colors border border-red-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
             </div>
             <p v-if="riwayatRusak.length === 0" class="text-xs text-gray-400 font-bold italic text-center py-4">Belum ada histori.</p>
           </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
</style>