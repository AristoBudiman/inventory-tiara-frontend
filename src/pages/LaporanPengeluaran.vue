<script setup>
import { ref, computed, onMounted } from 'vue'

const today = new Date()
const year = today.getFullYear()
const month = String(today.getMonth() + 1).padStart(2, '0')
const day = String(today.getDate()).padStart(2, '0')

const defaultStart = `${year}-${month}-01`
const defaultEnd = `${year}-${month}-${day}`

const startDate = ref(defaultStart)
const endDate = ref(defaultEnd)

const listBelanja = ref([])
const isFetching = ref(false)

const fetchBelanja = async () => {
  isFetching.value = true
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian?start=${startDate.value}&end=${endDate.value}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.ok) listBelanja.value = await res.json() || []
  isFetching.value = false
}

const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)
const formatTanggal = (tgl) => new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
const grandTotal = computed(() => listBelanja.value.reduce((sum, item) => sum + item.total_biaya, 0))

onMounted(fetchBelanja)
</script>

<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="border-b-2 border-gray-200 pb-4">
      <h1 class="text-3xl font-black text-gray-800 tracking-tight">💸 Pengeluaran Belanja Gudang</h1>
      <p class="text-sm text-gray-500 font-medium mt-1">Rekapitulasi biaya pembelian bahan baku dan kemasan.</p>
    </div>

    <!-- FILTER TANGGAL (Desain Merah) -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-red-100 flex flex-wrap items-end gap-5">
      <div class="flex-1 min-w-50">
        <label class="block text-[10px] font-black text-red-800 uppercase tracking-wider mb-2">Periode Mulai</label>
        <input type="date" v-model="startDate" class="w-full border-2 border-gray-300 rounded-lg p-2.5 font-bold outline-none focus:border-red-500 text-gray-700 bg-gray-50 focus:bg-white transition-colors cursor-pointer">
      </div>
      <div class="flex-1 min-w-50">
        <label class="block text-[10px] font-black text-red-800 uppercase tracking-wider mb-2">Periode Sampai</label>
        <input type="date" v-model="endDate" class="w-full border-2 border-gray-300 rounded-lg p-2.5 font-bold outline-none focus:border-red-500 text-gray-700 bg-gray-50 focus:bg-white transition-colors cursor-pointer">
      </div>
      <div class="w-full md:w-auto">
        <button @click="fetchBelanja" :disabled="isFetching" class="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-black px-8 py-3 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2">
          {{ isFetching ? '⏳ Memuat...' : '🔍 Tampilkan Data' }}
        </button>
      </div>
    </div>

    <!-- TABEL LAPORAN -->
    <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-100 border-b-2 border-gray-200">
          <tr>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-[10px] w-32">Tgl Nota</th>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-[10px]">Nama Bahan</th>
            <th class="p-4 text-center font-black text-gray-600 uppercase tracking-wider text-[10px] border-x border-gray-200 w-32">Qty Masuk</th>
            <th class="p-4 text-right font-black text-gray-600 uppercase tracking-wider text-[10px] w-40">Harga Beli/Satuan</th>
            <th class="p-4 text-right font-black text-red-700 uppercase tracking-wider text-[10px] border-l border-gray-200 bg-red-50/50 w-48">Total Biaya (Rp)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="b in listBelanja" :key="b.ID" class="hover:bg-red-50/30 transition-colors group">
            <td class="p-4 font-bold text-gray-600">{{ formatTanggal(b.tanggal) }}</td>
            <td class="p-4">
               <p class="font-bold text-gray-900 text-base mb-0.5">{{ b.bahan.nama_bahan }}</p>
               <p class="text-[10px] font-bold text-gray-400 italic">{{ b.keterangan || 'Tanpa catatan' }}</p>
            </td>
            <td class="p-4 text-center border-x border-gray-100 bg-gray-50/50">
               <span class="font-black text-blue-700 text-base">{{ b.qty }} <span class="text-[10px] font-bold text-gray-500 uppercase">{{ b.bahan.satuan }}</span></span>
            </td>
            <td class="p-4 text-right font-bold text-gray-600">Rp {{ formatRp(b.harga_beli_satuan) }}</td>
            <td class="p-4 text-right font-black text-red-700 border-l border-gray-100 bg-red-50/30 text-base">
               Rp {{ formatRp(b.total_biaya) }}
            </td>
          </tr>
          <tr v-if="listBelanja.length === 0">
            <td colspan="5" class="p-12 text-center text-gray-400 font-bold bg-gray-50">Tidak ada pengeluaran di rentang tanggal ini.</td>
          </tr>
        </tbody>
        <!-- GRAND TOTAL -->
        <tfoot class="bg-gray-800 text-white border-t-4 border-red-500">
            <tr>
                <td colspan="4" class="p-4 text-right font-black uppercase tracking-widest text-xs">Grand Total Pengeluaran:</td>
                <td class="p-4 text-right font-black text-xl text-red-400">Rp {{ formatRp(grandTotal) }}</td>
            </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>