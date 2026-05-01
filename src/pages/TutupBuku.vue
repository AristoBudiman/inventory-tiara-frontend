<script setup>
import { ref, onMounted } from 'vue'

const getToday = () => new Date().toISOString().split('T')[0]
const filterTanggal = ref(getToday())

const jurnalEfisiensi = ref([])
const sisaLayakJual = ref([])
const isCalculating = ref(false)

const fetchJurnal = async () => {
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/produksi/jurnal?tanggal=${filterTanggal.value}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.ok) {
    const data = await res.json()
    jurnalEfisiensi.value = data.jurnal || []
    sisaLayakJual.value = data.sisa || []
  }
}

const eksekusiTutupBuku = async () => {
  if(!confirm(`Lakukan Tutup Buku untuk tanggal ${filterTanggal.value}? Sistem akan membandingkan data masak, matang, dan kiriman.`)) return

  isCalculating.value = true
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/produksi/tutup-buku`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ tanggal: filterTanggal.value })
  })

  if (res.ok) {
    alert("Kalkulasi Selesai! Data Efisiensi & Sisa Layak Jual telah diperbarui.")
    fetchJurnal()
  } else {
    alert("Gagal melakukan kalkulasi.")
  }
  isCalculating.value = false
}

onMounted(fetchJurnal)
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h1 class="text-2xl font-black text-gray-900">🌙 Tutup Buku & Laporan Efisiensi</h1>
        <div class="flex items-center gap-3">
            <input type="date" v-model="filterTanggal" @change="fetchJurnal" class="border-2 rounded-lg p-2 font-bold focus:outline-none focus:border-green-500">
            <button @click="eksekusiTutupBuku" :disabled="isCalculating" class="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold shadow hover:bg-green-700 disabled:opacity-50">
              {{ isCalculating ? 'Sedang Menghitung...' : '⚙️ EKSEKUSI TUTUP BUKU' }}
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- LAPORAN WASTE -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-red-800 p-4 text-white">
          <h2 class="font-black text-lg">📉 Jurnal Efisiensi Resep (Waste)</h2>
          <p class="text-xs text-red-200">Perbandingan Prediksi Modal Adonan vs Hasil Nyata</p>
        </div>
        <table class="w-full text-sm text-left">
          <thead class="bg-red-50 text-red-900 border-b border-red-100">
            <tr>
              <th class="p-3">Resep Dapur</th>
              <th class="p-3 text-center">Prediksi Sistem</th>
              <th class="p-3 text-center">Hasil Matang</th>
              <th class="p-3 text-center">Selisih/Waste</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="j in jurnalEfisiensi" :key="j.ID" class="border-b">
              <td class="p-3 font-bold">{{ j.resep.nama_resep }}</td>
              <td class="p-3 text-center text-gray-500">{{ j.modal_adonan }} gr</td>
              <td class="p-3 text-center font-bold">{{ j.hasil_roti }} gr</td>
              <td class="p-3 text-center font-black" :class="j.selisih_waste > 0 ? 'text-red-600' : 'text-green-600'">
                {{ j.selisih_waste > 0 ? '-' : '+' }}{{ Math.abs(j.selisih_waste) }} gr <br>
                <span class="text-[10px] bg-gray-100 px-1 rounded text-black">{{ j.kinerja.toFixed(1) }}%</span>
              </td>
            </tr>
            <tr v-if="jurnalEfisiensi.length === 0"><td colspan="4" class="p-8 text-center text-gray-400 italic">Belum ada kalkulasi di tanggal ini.</td></tr>
          </tbody>
        </table>
      </div>

      <!-- SISA LAYAK JUAL -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-blue-800 p-4 text-white">
          <h2 class="font-black text-lg">📦 Sisa Layak Jual (Carry-Over)</h2>
          <p class="text-xs text-blue-200">Sisa roti matang yang belum terbawa oleh Nota hari ini</p>
        </div>
        <table class="w-full text-sm text-left">
          <thead class="bg-blue-50 text-blue-900 border-b border-blue-100">
            <tr>
              <th class="p-3">Nama Produk Jual</th>
              <th class="p-3 text-center font-black text-lg">Qty Sisa Pabrik</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sisaLayakJual" :key="s.ID" class="border-b">
              <td class="p-3 font-bold">{{ s.barang.NamaBarang }}</td>
              <td class="p-3 text-center font-black text-blue-700 bg-blue-50 text-xl">{{ s.qty_sisa }} Pcs</td>
            </tr>
            <tr v-if="sisaLayakJual.length === 0"><td colspan="2" class="p-8 text-center text-gray-400 italic">Belum ada kalkulasi sisa di tanggal ini.</td></tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>