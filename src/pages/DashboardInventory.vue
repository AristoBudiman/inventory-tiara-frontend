<script setup>
import { ref, onMounted } from 'vue'
import { LayoutDashboard, Package, ShoppingBag, ShoppingCart, AlertTriangle, TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-vue-next'

const jumlahBahan = ref(0)
const nilaiAsetBahan = ref(0)

const jumlahBarang = ref(0)
const nilaiAsetBarang = ref(0)

const totalBelanjaHariIni = ref(0)
const totalBelanjaBulanIni = ref(0)

const bahanKritis = ref([])
const recentPembelian = ref([])
const isFetching = ref(false)

const getLocalDateString = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
const todayStr = getLocalDateString(new Date())
const monthStr = todayStr.substring(0, 7)

const fetchDashboardData = async () => {
  isFetching.value = true
  try {
    const token = localStorage.getItem('inventory_token') || localStorage.getItem('admin_token')
    const headers = { 'Authorization': `Bearer ${token}` }
    
    const [resBahan, resBarang, resBeli] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers }),
      fetch(`${import.meta.env.VITE_API_URL}/api/barangs`, { headers }),
      fetch(`${import.meta.env.VITE_API_URL}/api/pembelian`, { headers })
    ])
    
    if (resBahan.ok) {
       const data = await resBahan.json() || []
       jumlahBahan.value = data.length
       nilaiAsetBahan.value = data.reduce((sum, b) => sum + (b.stok * b.harga_saat_ini), 0)
       // Bahan Kritis (Stok <= Batas Minimum)
       bahanKritis.value = data.filter(b => b.stok <= b.batas_minimum).sort((a,b) => a.stok - b.stok)
    }
    
    if (resBarang.ok) {
       const data = await resBarang.json() || []
       jumlahBarang.value = data.length
       nilaiAsetBarang.value = 0 // Roti tidak memiliki stok persisten di tabel Barang
    }

    if (resBeli.ok) {
       const data = await resBeli.json() || []
       
       const beliBulanIni = data.filter(p => p.tanggal && p.tanggal.startsWith(monthStr))
       const beliHariIni = data.filter(p => p.tanggal && p.tanggal.startsWith(todayStr))
       
       totalBelanjaBulanIni.value = beliBulanIni.reduce((sum, p) => sum + p.total_biaya, 0)
       totalBelanjaHariIni.value = beliHariIni.reduce((sum, p) => sum + p.total_biaya, 0)
       
       recentPembelian.value = beliHariIni.sort((a,b) => b.ID - a.ID).slice(0, 5)
    }
  } catch (err) {
    console.error(err)
  } finally {
    isFetching.value = false
  }
}

const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 animate-fade-in">
    
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 gap-6">
      <div class="flex items-center gap-5">
        <div class="bg-linear-to-br from-amber-400 to-amber-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 shrink-0 text-white">
          <LayoutDashboard :size="32" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-slate-800 tracking-tight">Dashboard Inventory</h1>
          <p class="text-sm text-slate-500 font-medium mt-1.5 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            Pantau ketersediaan bahan dan nilai taksiran aset gudang
          </p>
        </div>
      </div>
      <div class="text-right hidden md:block">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Laporan</p>
        <p class="text-sm font-bold text-slate-700 mt-0.5">{{ new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isFetching" class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mb-4"></div>
      <p class="text-slate-500 font-medium">Memuat data gudang...</p>
    </div>

    <div v-else class="space-y-6">
      
      <!-- Highlight Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <!-- Total Belanja Bulan Ini (Besar) -->
        <div class="bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-800 flex flex-col justify-center relative overflow-hidden shadow-xl lg:col-span-2">
          <div class="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"></div>
          <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl"></div>
          <div class="relative z-10 flex justify-between items-start">
            <div>
              <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Pengeluaran Belanja Bulan Ini</p>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-2xl font-black text-amber-400/80">Rp</span>
                <span class="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                  {{ formatRp(totalBelanjaBulanIni) }}
                </span>
              </div>
            </div>
            <div class="p-3 bg-white/10 rounded-2xl backdrop-blur-md hidden sm:block">
              <ShoppingCart :size="32" class="text-amber-300" />
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <div class="flex items-center justify-between mb-4">
             <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <Package :size="20" />
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aset Bahan</p>
             </div>
             <span class="text-xs font-bold text-slate-400">{{ jumlahBahan }} item</span>
          </div>
          <div>
            <p class="text-2xl font-black text-slate-800">Rp {{ formatRp(nilaiAsetBahan) }}</p>
            <p class="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-wider">Taksiran Nilai (HPP)</p>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingBag :size="20" />
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Katalog Produk</p>
          </div>
          <div>
            <p class="text-3xl font-black text-slate-800">{{ jumlahBarang }} <span class="text-sm font-bold text-slate-400">varian</span></p>
            <p class="text-[10px] font-bold text-sky-500 mt-1 uppercase tracking-wider">Katalog Tersedia</p>
          </div>
        </div>

      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Out of Stock Warnings -->
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col">
          <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <AlertTriangle :size="18" class="text-rose-500" />
              Peringatan Stok Kritis (&le; Minimum)
            </h3>
            <router-link to="/bahan" class="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider">
              Master Bahan
            </router-link>
          </div>
          
          <div class="overflow-x-auto flex-1">
            <table class="w-full text-left text-sm whitespace-nowrap h-full">
              <thead class="bg-white border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <tr>
                  <th class="px-6 py-4 w-12">No</th>
                  <th class="px-6 py-4">Nama Bahan</th>
                  <th class="px-6 py-4 text-center">Sisa Stok</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-if="bahanKritis.length === 0">
                  <td colspan="3" class="px-6 py-12 text-center h-full">
                    <div class="flex flex-col items-center justify-center h-full text-slate-400">
                      <Package :size="32" class="mb-3 opacity-50" />
                      <p class="font-medium text-emerald-600">Aman! Stok seluruh bahan di atas batas kritis.</p>
                    </div>
                  </td>
                </tr>
                <tr v-for="(b, idx) in bahanKritis" :key="b.ID" class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 font-bold text-slate-400">{{ idx + 1 }}</td>
                  <td class="px-6 py-4 font-bold text-slate-700">{{ b.nama_bahan }}</td>
                  <td class="px-6 py-4 text-center">
                    <span :class="b.stok <= 0 ? 'bg-rose-50 text-rose-600 border-rose-200/50' : 'bg-orange-50 text-orange-600 border-orange-200/50'" class="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border">
                      {{ b.stok <= 0 ? `Habis (${b.stok})` : `${b.stok} ${b.satuan}` }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Purchases -->
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col">
          <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Clock :size="18" class="text-slate-400" />
              5 Belanja Terakhir (Hari Ini)
            </h3>
            <span class="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              Total Rp {{ formatRp(totalBelanjaHariIni) }}
            </span>
          </div>
          
          <div class="overflow-x-auto flex-1">
            <table class="w-full text-left text-sm whitespace-nowrap h-full">
              <thead class="bg-white border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <tr>
                  <th class="px-6 py-4">No. Transaksi</th>
                  <th class="px-6 py-4">Keterangan</th>
                  <th class="px-6 py-4 text-right">Nilai Belanja</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-if="recentPembelian.length === 0">
                  <td colspan="3" class="px-6 py-12 text-center h-full">
                    <div class="flex flex-col items-center justify-center h-full text-slate-400">
                      <AlertCircle :size="32" class="mb-3 opacity-50" />
                      <p class="font-medium">Belum ada pengeluaran belanja hari ini.</p>
                    </div>
                  </td>
                </tr>
                <tr v-for="beli in recentPembelian" :key="beli.ID" class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 font-bold text-slate-700">#BLJ-{{ beli.ID }}</td>
                  <td class="px-6 py-4 font-medium text-slate-600">{{ beli.keterangan || 'Belanja Rutin' }}</td>
                  <td class="px-6 py-4 text-right font-black text-slate-800">Rp {{ formatRp(beli.total_biaya) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeIn { 
  from { opacity: 0; transform: translateY(10px); } 
  to { opacity: 1; transform: translateY(0); } 
}
</style>
