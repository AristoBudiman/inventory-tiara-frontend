<script setup>
import { ref, computed, onMounted } from 'vue'

const listBelanja = ref([])

const fetchBelanja = async () => {
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.ok) listBelanja.value = await res.json()
}

const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)

const formatTanggal = (tgl) => {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

// Menghitung Total Rupiah dari semua data di tabel
const grandTotal = computed(() => {
  return listBelanja.value.reduce((sum, item) => sum + item.total_biaya, 0)
})

onMounted(fetchBelanja)
</script>

<template>
  <div class="p-8 max-w-5xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
       <span>💸</span> Laporan Pengeluaran Bahan Baku
    </h1>

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
            <td colspan="6" class="p-10 text-center text-gray-400 italic font-bold">Belum ada riwayat pembelanjaan bahan.</td>
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