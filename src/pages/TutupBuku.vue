<script setup>
import { ref, computed, onMounted } from 'vue'
import { Moon, Settings, TrendingDown, Scale, Package, Truck } from 'lucide-vue-next'

import { getWIBDateString } from '../utils/date'

const filterTanggal = ref(getWIBDateString())

const jurnalEfisiensi = ref([])
const sisaLayakJual = ref([])
const isCalculating = ref(false)

const filteredSisaLayakJual = computed(() => {
  return sisaLayakJual.value.filter(s => s.qty_sisa !== 0)
})

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
  if(!await window.$dialog.confirm(`Eksekusi Tutup Buku untuk tanggal ${filterTanggal.value}? Pastikan semua transaksi hari ini selesai.`)) return
  isCalculating.value = true
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/produksi/tutup-buku`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ tanggal: filterTanggal.value }) })
  if (res.ok) { window.$dialog.alert("Tutup Buku Berhasil!"); fetchJurnal() } else { window.$dialog.alert("Gagal kalkulasi.") }
  isCalculating.value = false
}
onMounted(fetchJurnal)
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
        <div>
          <h1 class="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2"><Moon :size="32" /> Laporan Tutup Buku</h1>
          <p class="text-sm text-gray-500 font-medium mt-1">Audit efisiensi kinerja koki dan inventarisasi sisa layak jual harian.</p>
        </div>
        <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            <div class="bg-gray-50 p-2 rounded-xl border border-gray-200 flex items-center justify-center">
               <input type="date" v-model="filterTanggal" @change="fetchJurnal" class="border-none bg-transparent font-bold focus:ring-0 text-gray-800 outline-none cursor-pointer text-center w-full">
            </div>
            <button @click="eksekusiTutupBuku" :disabled="isCalculating" class="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-md disabled:opacity-50 transition-all active:scale-95 whitespace-nowrap flex justify-center items-center gap-2">
              <Settings v-if="!isCalculating" :size="18" /> {{ isCalculating ? 'Menghitung...' : 'EKSEKUSI' }}
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- KIRI: LAPORAN WASTE (MERAH) -->
      <div class="bg-white rounded-2xl shadow-sm border border-rose-100 flex flex-col overflow-hidden">
        <div class="bg-rose-600 p-5 text-white flex justify-between items-center">
          <div>
            <h2 class="font-black text-lg tracking-wide flex items-center gap-2"><TrendingDown :size="20" /> Jurnal Efisiensi Koki</h2>
            <p class="text-[10px] font-bold text-rose-200 uppercase tracking-wider mt-0.5">Prediksi Modal vs Hasil Fisik Roti</p>
          </div>
          <div class="text-rose-300 opacity-50"><Scale :size="32" /></div>
        </div>
        
        <div class="p-6 bg-gray-50 flex-1">
          <div class="space-y-4">
            <div v-for="j in jurnalEfisiensi" :key="j.ID" class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
              <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="j.selisih_waste > 0 ? 'bg-rose-500' : 'bg-emerald-500'"></div>
              
              <div class="flex justify-between items-start mb-3 pl-3">
                 <h3 class="font-bold text-gray-800">{{ j.resep.nama_resep }}</h3>
                 <span class="text-xl font-black" :class="j.selisih_waste > 0 ? 'text-rose-600' : 'text-emerald-600'">
                    {{ j.selisih_waste > 0 ? '-' : '+' }}{{ Math.abs(j.selisih_waste) }} <span class="text-xs font-bold text-gray-400">gr</span>
                 </span>
              </div>
              
              <div class="grid grid-cols-3 gap-2 text-center pl-3">
                 <div class="bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Modal Adonan</p>
                    <p class="text-sm font-bold text-gray-600">{{ j.modal_adonan }}g</p>
                 </div>
                 <div class="bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cetak Roti</p>
                    <p class="text-sm font-bold text-gray-600">{{ j.hasil_roti }}g</p>
                 </div>
                 <div class="rounded-lg p-2 border" :class="j.kinerja < 95 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'">
                    <p class="text-[9px] font-bold uppercase tracking-wider mb-1" :class="j.kinerja < 95 ? 'text-rose-500' : 'text-emerald-600'">Kinerja</p>
                    <p class="text-sm font-black" :class="j.kinerja < 95 ? 'text-rose-700' : 'text-emerald-700'">{{ j.kinerja.toFixed(1) }}%</p>
                 </div>
              </div>
            </div>
            
            <div v-if="jurnalEfisiensi.length === 0" class="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl">
               <p class="text-sm text-gray-400 font-bold">Belum ada data efisiensi dapur.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- KANAN: SISA LAYAK JUAL (BIRU) -->
      <div class="bg-white rounded-2xl shadow-sm border border-blue-100 flex flex-col overflow-hidden">
        <div class="bg-blue-600 p-5 text-white flex justify-between items-center">
          <div>
            <h2 class="font-black text-lg tracking-wide flex items-center gap-2"><Package :size="20" /> Sisa Kelayakan Jual</h2>
            <p class="text-[10px] font-bold text-blue-200 uppercase tracking-wider mt-0.5">Sisa Fisik Yang Digeser Ke Besok (Carry-Over)</p>
          </div>
          <div class="text-blue-300 opacity-50"><Truck :size="32" /></div>
        </div>
        
        <div class="p-6 bg-gray-50 flex-1">
          <div class="grid grid-cols-2 gap-4">
             <div v-for="s in filteredSisaLayakJual" :key="s.ID" class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <p class="font-bold text-gray-700 text-sm mb-3 leading-tight">{{ s.barang.NamaBarang }}</p>
                <div class="flex items-end justify-between">
                   <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sisa Fisik</span>
                   <p class="text-2xl font-black leading-none" :class="s.qty_sisa < 0 ? 'text-rose-600' : 'text-blue-700'">
                     {{ s.qty_sisa > 0 ? '+' : '' }}{{ s.qty_sisa }} <span class="text-xs font-bold" :class="s.qty_sisa < 0 ? 'text-rose-400' : 'text-blue-400'">Pcs</span>
                   </p>
                </div>
             </div>
          </div>

          <div v-if="filteredSisaLayakJual.length === 0" class="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl mt-4">
             <p class="text-sm text-gray-400 font-bold">Semua produk habis terjual / balance (0 Pcs).</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>