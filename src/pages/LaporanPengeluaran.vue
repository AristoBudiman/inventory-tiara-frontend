<script setup>
import { ref, computed, onMounted } from 'vue'

// --- LOGIKA DEFAULT TANGGAL (Tgl 1 Bulan Ini - Hari Ini) ---
const today = new Date()
const year = today.getFullYear()
const month = String(today.getMonth() + 1).padStart(2, '0')
const day = String(today.getDate()).padStart(2, '0')

const defaultStart = `${year}-${month}-01`
const defaultEnd = `${year}-${month}-${day}`

const startDate = ref(defaultStart)
const endDate = ref(defaultEnd)
// ------------------------------------------------------------

const listBelanja = ref([])

const fetchBelanja = async () => {
  const token = localStorage.getItem('inventory_token')
  
  // Kirim parameter tanggal ke backend
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian?start=${startDate.value}&end=${endDate.value}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  if (res.ok) listBelanja.value = await res.json() || []
}

const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)

const formatTanggal = (tgl) => {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

// Menghitung Total Rupiah dari hasil filter yang tampil di tabel
const grandTotal = computed(() => {
  return listBelanja.value.reduce((sum, item) => sum + item.total_biaya, 0)
})

onMounted(fetchBelanja)
</script>

<template>
  <div class="p-8 max-w-5xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
       <span>💸</span> Laporan Pengeluaran Bahan Baku
    </h1>

    <!-- FILTER TANGGAL -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap items-end gap-4">
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Mulai Tanggal:</label>
        <input type="date" v-model="startDate" class="border-2 border-gray-300 rounded-lg p-2 font-bold outline-none focus:border-red-500 text-gray-700">
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Sampai Tanggal:</label>
        <input type="date" v-model="endDate" class="border-2 border-gray-300 rounded-lg p-2 font-bold outline-none focus:border-red-500 text-gray-700">
      </div>
      <button @click="fetchBelanja" class="bg-red-700 hover:bg-red-800 text-white font-black px-8 py-2.5 rounded-lg shadow-md transition flex items-center gap-2">
        🔍 Tampilkan Data
      </button>
    </div>

    <!-- TABEL LAPORAN -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <table class="w-full text-sm text-left">
        <thead class="bg-red-800 text-white uppercase text-xs tracking-wider">
          <tr>
            <th class="p-4 font-bold border-r border-red-700">Tanggal Nota</th>
            <th class="p-4 font-bold border-r border-red-700">Nama Bahan</th>
            <th class="p-4 font-bold border-r border-red-700 text-center">Qty Masuk</th>
            <th class="p-4 font-bold border-r border-red-700 text-right">Harga Beli / Satuan</th>
            <th class="p-4 font-bold border-r border-red-700 text-right text-yellow-300">Total Biaya (Rp)</th>
            <th class="p-4 font-bold">Keterangan / Supplier</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="b in listBelanja" :key="b.ID" class="hover:bg-red-50 transition">
            <td class="p-4 font-bold text-gray-600 border-r">{{ formatTanggal(b.tanggal) }}</td>
            <td class="p-4 font-black text-gray-900 border-r">{{ b.bahan.nama_bahan }}</td>
            <td class="p-4 text-center font-bold text-blue-700 border-r">{{ b.qty }} <span class="text-[10px] text-gray-500">{{ b.bahan.satuan }}</span></td>
            <td class="p-4 text-right font-medium text-gray-600 border-r">Rp {{ formatRp(b.harga_beli_satuan) }}</td>
            <td class="p-4 text-right font-black text-red-700 border-r bg-red-50">Rp {{ formatRp(b.total_biaya) }}</td>
            <td class="p-4 text-xs font-bold text-gray-500 italic">{{ b.keterangan || '-' }}</td>
          </tr>
          <tr v-if="listBelanja.length === 0">
            <td colspan="6" class="p-10 text-center text-gray-400 italic font-bold">Tidak ada pengeluaran di rentang tanggal ini.</td>
          </tr>
        </tbody>
        <tfoot class="bg-gray-100 border-t-4 border-gray-300">
            <tr>
                <td colspan="4" class="p-4 text-right font-black text-gray-700">GRAND TOTAL PENGELUARAN:</td>
                <td class="p-4 text-right font-black text-2xl text-red-800 bg-red-100 border-x border-red-200">Rp {{ formatRp(grandTotal) }}</td>
                <td></td>
            </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>