<script setup>
import { ref, onMounted, watch } from 'vue'

const getToday = () => new Date().toISOString().split('T')[0]

const filterTanggal = ref(getToday())
const listResep = ref([])
const listBarang = ref([])
const riwayatMasak = ref([])
const riwayatMatang = ref([])

const formMasak = ref({ resep_id: '', jumlah_batch: 1 })
const formMatang = ref({ barang_id: '', qty_matang: 0 })

const draftMasak = ref([])
const draftMatang = ref([])
const isSubmitting = ref(false)

const fetchMasterData = async () => {
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }
  const [resResep, resBarang] = await Promise.all([
    fetch(`${import.meta.env.VITE_API_URL}/api/resep`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/barangs`, { headers })
  ])
  if (resResep.ok) listResep.value = await resResep.json() || []
  if (resBarang.ok) listBarang.value = await resBarang.json() || []
}

const fetchRiwayat = async () => {
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }
  const [resMasak, resMatang] = await Promise.all([
    fetch(`${import.meta.env.VITE_API_URL}/api/produksi/masak?tanggal=${filterTanggal.value}`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/produksi/matang?tanggal=${filterTanggal.value}`, { headers })
  ])
  if (resMasak.ok) riwayatMasak.value = await resMasak.json() || []
  if (resMatang.ok) riwayatMatang.value = await resMatang.json() || []
}

const tambahDraftMasak = () => {
  if (!formMasak.value.resep_id || formMasak.value.jumlah_batch <= 0) return alert('Input tidak valid!')
  const resepTerpilih = listResep.value.find(r => r.ID === formMasak.value.resep_id)
  draftMasak.value.push({ resep_id: formMasak.value.resep_id, nama_resep: resepTerpilih.nama_resep, jumlah_batch: formMasak.value.jumlah_batch })
  formMasak.value = { resep_id: '', jumlah_batch: 1 }
}
const hapusDraftMasak = (idx) => draftMasak.value.splice(idx, 1)

const finalisasiMasak = async () => {
  if (draftMasak.value.length === 0) return
  if (!confirm('Eksekusi Masak? Stok bahan baku akan terpotong!')) return
  isSubmitting.value = true
  const token = localStorage.getItem('inventory_token')
  try {
    for (const item of draftMasak.value) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/produksi/masak`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ tanggal: filterTanggal.value, resep_id: item.resep_id, jumlah_batch: item.jumlah_batch }) })
    }
    draftMasak.value = []; fetchRiwayat()
  } catch (err) { alert('Gagal memproses.') } finally { isSubmitting.value = false }
}

const tambahDraftMatang = () => {
  if (!formMatang.value.barang_id || formMatang.value.qty_matang <= 0) return alert('Input tidak valid!')
  const barangTerpilih = listBarang.value.find(b => b.ID === formMatang.value.barang_id)
  draftMatang.value.push({ barang_id: formMatang.value.barang_id, nama_barang: barangTerpilih.NamaBarang, qty_matang: formMatang.value.qty_matang })
  formMatang.value = { barang_id: '', qty_matang: 0 }
}
const hapusDraftMatang = (idx) => draftMatang.value.splice(idx, 1)

const finalisasiMatang = async () => {
  if (draftMatang.value.length === 0) return
  if (!confirm('Eksekusi Matang? Pastikan jumlah fisik sudah benar.')) return
  isSubmitting.value = true
  const token = localStorage.getItem('inventory_token')
  try {
    for (const item of draftMatang.value) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/produksi/matang`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ tanggal: filterTanggal.value, barang_id: item.barang_id, qty_matang: item.qty_matang }) })
    }
    draftMatang.value = []; fetchRiwayat()
  } catch (err) { alert('Gagal memproses.') } finally { isSubmitting.value = false }
}

watch(filterTanggal, fetchRiwayat)
onMounted(() => { fetchMasterData(); fetchRiwayat() })
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    
    <!-- HEADER TANGGAL -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
        <div>
          <h1 class="text-3xl font-black text-gray-800 tracking-tight">👨‍🍳 Eksekusi Dapur</h1>
          <p class="text-sm text-gray-500 font-medium mt-1">Laporan harian adonan yang dimasak & barang jadi yang matang.</p>
        </div>
        <div class="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">Tanggal:</label>
            <input type="date" v-model="filterTanggal" class="border-none bg-white rounded-lg p-2 font-bold focus:ring-2 focus:ring-blue-500 text-gray-800 outline-none shadow-sm cursor-pointer">
        </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
      
      <!-- KIRI: PANEL MASAK (ORANGE) -->
      <div class="bg-white rounded-2xl shadow-md border border-orange-100 flex flex-col overflow-hidden">
        <div class="bg-orange-500 p-5 text-white flex items-center gap-3">
          <span class="text-2xl">🔥</span>
          <div>
             <h2 class="text-lg font-black tracking-wide">Langkah 1: Laporan Masak</h2>
             <p class="text-[10px] font-bold text-orange-200 uppercase tracking-wider">Potong Stok Bahan Mentah</p>
          </div>
        </div>

        <div class="p-6 border-b border-gray-100 bg-orange-50/20">
          <form @submit.prevent="tambahDraftMasak" class="flex gap-3 items-end mb-6">
            <div class="flex-1">
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pilih Resep Adonan</label>
              <select v-model="formMasak.resep_id" required class="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-orange-500 font-bold outline-none text-gray-800 cursor-pointer bg-white">
                <option value="" disabled>-- Katalog Resep --</option>
                <option v-for="r in listResep" :key="r.ID" :value="r.ID">{{ r.nama_resep }}</option>
              </select>
            </div>
            <div class="w-24">
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Batch</label>
              <input v-model.number="formMasak.jumlah_batch" type="number" required min="0.1" step="any" class="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-orange-500 font-black text-center outline-none text-orange-600 bg-white">
            </div>
            <button type="submit" class="bg-white border-2 border-orange-200 hover:border-orange-500 text-orange-600 font-black p-2.5 rounded-lg shadow-sm transition-colors text-xl leading-none">+</button>
          </form>

          <!-- DRAFT MASAK -->
          <div class="bg-white border-2 border-dashed border-orange-200 rounded-xl p-4">
            <h3 class="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-3">🛒 Draft Tunggu Eksekusi</h3>
            <div class="space-y-2 mb-4">
              <div v-for="(draft, idx) in draftMasak" :key="idx" class="bg-orange-50 p-2.5 rounded-lg border border-orange-100 flex justify-between items-center">
                <p class="font-bold text-gray-800 text-sm">{{ draft.nama_resep }}</p>
                <div class="flex items-center gap-3">
                  <span class="font-black text-orange-600 text-sm">{{ draft.jumlah_batch }}<span class="text-[10px] text-orange-400">x</span></span>
                  <button @click="hapusDraftMasak(idx)" class="text-red-400 hover:text-red-600 font-black text-lg leading-none px-1">×</button>
                </div>
              </div>
              <p v-if="draftMasak.length === 0" class="text-xs text-center text-gray-400 font-bold italic py-4">Keranjang kosong.</p>
            </div>
            <button @click="finalisasiMasak" :disabled="draftMasak.length === 0 || isSubmitting" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3.5 rounded-lg shadow-md disabled:opacity-50 transition-all active:scale-95">
              {{ isSubmitting ? 'MEMPROSES...' : '🔥 EKSEKUSI MASAK' }}
            </button>
          </div>
        </div>

        <div class="p-6 bg-gray-50 flex-1">
           <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Histori Masak Hari Ini</h3>
           <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
             <div v-for="m in riwayatMasak" :key="m.ID" class="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex justify-between items-center">
                <div>
                   <p class="font-bold text-gray-800 text-sm">{{ m.resep?.nama_resep }}</p>
                   <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Est. Adonan: {{ m.total_adonan }} gr</p>
                </div>
                <div class="bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm font-black border border-orange-200">
                   {{ m.jumlah_batch }}x
                </div>
             </div>
             <p v-if="riwayatMasak.length === 0" class="text-xs text-gray-400 font-bold italic text-center py-4">Belum ada histori.</p>
           </div>
        </div>
      </div>

      <!-- KANAN: PANEL MATANG (HIJAU) -->
      <div class="bg-white rounded-2xl shadow-md border border-emerald-100 flex flex-col overflow-hidden">
        <div class="bg-emerald-600 p-5 text-white flex items-center gap-3">
          <span class="text-2xl">🍞</span>
          <div>
             <h2 class="text-lg font-black tracking-wide">Langkah 2: Laporan Matang</h2>
             <p class="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Catat Fisik Kue Siap Jual</p>
          </div>
        </div>

        <div class="p-6 border-b border-gray-100 bg-emerald-50/20">
          <form @submit.prevent="tambahDraftMatang" class="flex gap-3 items-end mb-6">
            <div class="flex-1">
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pilih Produk Jadi</label>
              <select v-model="formMatang.barang_id" required class="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-emerald-500 font-bold outline-none text-gray-800 cursor-pointer bg-white">
                <option value="" disabled>-- Katalog Produk --</option>
                <option v-for="b in listBarang" :key="b.ID" :value="b.ID">{{ b.NamaBarang }}</option>
              </select>
            </div>
            <div class="w-24">
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Fisik (Pcs)</label>
              <input v-model.number="formMatang.qty_matang" type="number" required min="1" class="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-emerald-500 font-black text-center outline-none text-emerald-600 bg-white">
            </div>
            <button type="submit" class="bg-white border-2 border-emerald-200 hover:border-emerald-500 text-emerald-600 font-black p-2.5 rounded-lg shadow-sm transition-colors text-xl leading-none">+</button>
          </form>

          <!-- DRAFT MATANG -->
          <div class="bg-white border-2 border-dashed border-emerald-200 rounded-xl p-4">
            <h3 class="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-3">🛒 Draft Tunggu Eksekusi</h3>
            <div class="space-y-2 mb-4">
              <div v-for="(draft, idx) in draftMatang" :key="idx" class="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex justify-between items-center">
                <p class="font-bold text-gray-800 text-sm">{{ draft.nama_barang }}</p>
                <div class="flex items-center gap-3">
                  <span class="font-black text-emerald-700 text-sm">{{ draft.qty_matang }}<span class="text-[10px] text-emerald-500 ml-1">Pcs</span></span>
                  <button @click="hapusDraftMatang(idx)" class="text-red-400 hover:text-red-600 font-black text-lg leading-none px-1">×</button>
                </div>
              </div>
              <p v-if="draftMatang.length === 0" class="text-xs text-center text-gray-400 font-bold italic py-4">Keranjang kosong.</p>
            </div>
            <button @click="finalisasiMatang" :disabled="draftMatang.length === 0 || isSubmitting" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-lg shadow-md disabled:opacity-50 transition-all active:scale-95">
              {{ isSubmitting ? 'MEMPROSES...' : '🍞 EKSEKUSI MATANG' }}
            </button>
          </div>
        </div>

        <div class="p-6 bg-gray-50 flex-1">
           <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Histori Matang Hari Ini</h3>
           <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
             <div v-for="m in riwayatMatang" :key="m.ID" class="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex justify-between items-center">
                <p class="font-bold text-gray-800 text-sm">{{ m.barang?.NamaBarang }}</p>
                <div class="bg-emerald-100 text-emerald-800 px-3 py-1 rounded text-sm font-black border border-emerald-200">
                   {{ m.qty_matang }} <span class="text-[10px] text-emerald-600">Pcs</span>
                </div>
             </div>
             <p v-if="riwayatMatang.length === 0" class="text-xs text-gray-400 font-bold italic text-center py-4">Belum ada histori.</p>
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