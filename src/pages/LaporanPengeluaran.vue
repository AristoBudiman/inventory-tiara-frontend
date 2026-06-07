<script setup>
import { ref, computed, onMounted } from 'vue'
import { Receipt, ClipboardList, Trash2, Calendar, Flag, Inbox, Sparkles, Coins } from 'lucide-vue-next'

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

// 1. STATE BARU: Saklar mode tampilan
const viewMode = ref('aktif') 

const fetchBelanja = async () => {
  isFetching.value = true
  const token = localStorage.getItem('inventory_token')
  
  // 2. SISIPKAN PARAMETER STATUS KE URL BACKEND
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian?start=${startDate.value}&end=${endDate.value}&status=${viewMode.value}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  if (res.ok) listBelanja.value = await res.json() || []
  isFetching.value = false
}

// 3. FUNGSI BARU: MEMULIHKAN NOTA YANG TERHAPUS
const pulihkanPembelian = async (id) => {
  if(confirm('♻️ PULIHKAN NOTA INI?\n\n- Stok bahan akan DITAMBAHKAN kembali ke gudang.\n- Saldo Kas akan DIPOTONG kembali (jika nota ini Lunas).')) {
    const token = localStorage.getItem('inventory_token')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian/${id}/pulihkan`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if(res.ok) {
        alert('Data berhasil dipulihkan dan masuk ke laporan aktif!')
        fetchBelanja() 
      } else {
        alert('Gagal memulihkan nota.')
      }
    } catch (err) {
      alert('Error server.')
    }
  }
}

const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)
const formatTanggal = (tgl) => new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
const grandTotal = computed(() => listBelanja.value.reduce((sum, item) => sum + item.total_biaya, 0))

const toggleStatusBayar = async (b) => {
  const isCurrentlyLunas = b.is_lunas;
  const actionText = isCurrentlyLunas 
    ? 'Membatalkan lunas (mengubah jadi HUTANG)? Uang akan ditarik kembali ke Kas.' 
    : 'Melunasi hutang ini? Kas akan otomatis terpotong.';
    
  if(confirm(`Yakin ingin ${actionText}`)) {
    const token = localStorage.getItem('inventory_token')
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian/${b.ID}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ is_lunas: !isCurrentlyLunas }) // Kirim status kebalikannya
    })
    
    if(res.ok) {
      fetchBelanja() // Refresh data
    }
  }
}

const hapusPembelian = async (id) => {
  if(confirm('HAPUS PERMANEN NOTA INI?\n\n- Stok bahan ini di gudang akan otomatis DIKURANGI.\n- Uang Kas akan DIKEMBALIKAN (Jika statusnya lunas).')) {
    const token = localStorage.getItem('inventory_token')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if(res.ok) {
        alert('Nota pembelian berhasil dihapus & stok disesuaikan!')
        fetchBelanja() // Refresh data otomatis
      } else {
        alert('Gagal menghapus data pembelian.')
      }
    } catch (err) {
      alert('Error server.')
    }
  }
}

onMounted(fetchBelanja)
</script>

<template>
  <div class="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-100 gap-6">
      <div class="flex items-center gap-5">
        <div class="bg-linear-to-br from-rose-400 to-rose-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 shrink-0 text-white">
          <Receipt :size="32" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-slate-800 tracking-tight">Pengeluaran Gudang</h1>
          <p class="text-sm text-slate-500 font-medium mt-1.5 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            Rekapitulasi biaya pembelian bahan baku & kemasan
          </p>
        </div>
      </div>

      <!-- View Mode Tabs (Segmented Control) -->
      <div class="bg-slate-100 p-1.5 rounded-xl flex self-stretch md:self-auto shadow-inner border border-slate-200/60">
        <button @click="viewMode = 'aktif'; fetchBelanja()" 
                :class="viewMode === 'aktif' ? 'bg-white text-slate-800 shadow-sm font-black' : 'text-slate-500 font-bold hover:text-slate-700'" 
                class="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm transition-all duration-300 flex items-center justify-center gap-2">
          <ClipboardList :size="18" /> Aktif
        </button>
        <button @click="viewMode = 'sampah'; fetchBelanja()" 
                :class="viewMode === 'sampah' ? 'bg-rose-500 text-white shadow-md font-black' : 'text-slate-500 font-bold hover:text-slate-700'" 
                class="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm transition-all duration-300 flex items-center justify-center gap-2">
          <Trash2 :size="18" /> Terhapus
        </button>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="bg-white p-2 md:p-3 rounded-2xl shadow-xs border border-slate-100 flex flex-col md:flex-row items-center gap-3">
      <div class="w-full flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-200/60">
        <Calendar :size="20" class="text-slate-400 mr-3" />
        <div class="flex-1 flex items-center">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3 w-12 hidden sm:block">Mulai</span>
          <input type="date" v-model="startDate" @change="fetchBelanja" class="w-full bg-transparent border-none p-2 font-bold text-slate-700 outline-none cursor-pointer focus:ring-0">
        </div>
      </div>
      
      <div class="hidden md:flex items-center justify-center text-slate-300 px-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
      </div>

      <div class="w-full flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-200/60">
        <Flag :size="20" class="text-slate-400 mr-3" />
        <div class="flex-1 flex items-center">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3 w-12 hidden sm:block">Sampai</span>
          <input type="date" v-model="endDate" @change="fetchBelanja" class="w-full bg-transparent border-none p-2 font-bold text-slate-700 outline-none cursor-pointer focus:ring-0">
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-max text-left border-collapse">
          <thead class="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th class="py-5 px-6 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Nota & Tanggal</th>
              <th class="py-5 px-6 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap text-center">Item Belanja</th>
              <th class="py-5 px-6 text-right font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Total Biaya</th>
              <th class="py-5 px-6 text-center font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Status</th>
              <th class="py-5 px-6 text-center font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          
          <tbody v-if="listBelanja.length > 0">
            <template v-for="nota in listBelanja" :key="nota.ID">
              <!-- Header Row -->
              <tr class="group hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
                <td class="py-4 px-6 align-top">
                  <div class="flex items-start gap-3">
                    <div class="bg-rose-50 text-rose-600 p-2 rounded-lg mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                    <div>
                      <p class="font-black text-slate-800 text-sm">#BELI-{{ nota.ID }}</p>
                      <p class="text-xs font-bold text-slate-500 mt-1">{{ formatTanggal(nota.tanggal) }}</p>
                      <p class="text-[10px] font-bold text-slate-400 uppercase mt-2 bg-slate-100 inline-block px-2 py-0.5 rounded-md">{{ nota.keterangan || 'Tanpa catatan' }}</p>
                    </div>
                  </div>
                </td>
                
                <td class="py-4 px-6 align-top">
                  <div class="space-y-3">
                    <div v-for="d in nota.details" :key="d.ID" class="flex justify-between items-center text-sm bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <div class="flex items-center gap-3 pr-4">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        <div>
                          <p class="font-bold text-slate-700">{{ d.bahan?.nama_bahan || 'Bahan Terhapus' }}</p>
                          <p class="text-xs text-slate-400 font-medium mt-0.5">{{ d.qty }} <span class="uppercase text-[10px] font-bold ml-0.5">{{ d.bahan?.satuan || '-' }}</span> &times; Rp {{ formatRp(d.harga_beli_satuan) }}</p>
                        </div>
                      </div>
                      <span class="font-black text-slate-700 text-right shrink-0">Rp {{ formatRp(d.subtotal) }}</span>
                    </div>
                  </div>
                </td>
                
                <td class="py-4 px-6 align-top text-right">
                  <div class="inline-flex flex-col items-end">
                    <span class="text-sm font-bold text-slate-400 mb-1">Grand Total</span>
                    <span class="font-black text-rose-600 text-lg bg-rose-50 px-3 py-1 rounded-lg border border-rose-100/50">Rp {{ formatRp(nota.total_biaya) }}</span>
                  </div>
                </td>
                
                <td class="py-4 px-6 align-top text-center">
                  <div v-if="nota.is_lunas" class="flex flex-col items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-200/50">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> LUNAS
                    </span>
                    <button v-if="viewMode === 'aktif'" @click="toggleStatusBayar(nota)" class="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline decoration-slate-300 underline-offset-2 transition-colors">Batal Lunas</button>
                  </div>
                  <div v-else class="flex flex-col items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-200/50">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> HUTANG
                    </span>
                    <button v-if="viewMode === 'aktif'" @click="toggleStatusBayar(nota)" class="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-transform active:scale-95 shadow-sm">Tandai Lunas</button>
                  </div>
                </td>

                <td class="py-4 px-6 align-top text-center">
                    <button v-if="viewMode === 'aktif'" @click="hapusPembelian(nota.ID)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors group" title="Hapus Permanen">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <button v-if="viewMode === 'sampah'" @click="pulihkanPembelian(nota.ID)" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors group" title="Pulihkan Nota">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </td>
              </tr>
            </template>
          </tbody>
          
          <tbody v-else>
            <tr>
              <td colspan="5" class="py-16 text-center">
                <div class="flex flex-col items-center justify-center">
                  <div class="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <Inbox v-if="viewMode === 'aktif'" :size="40" />
                    <Sparkles v-else :size="40" />
                  </div>
                  <h3 class="text-lg font-black text-slate-700 mb-1">Data Kosong</h3>
                  <p class="text-sm text-slate-400 font-medium max-w-sm">
                    {{ viewMode === 'aktif' ? 'Tidak ada catatan pengeluaran belanja pada rentang tanggal yang dipilih.' : 'Tempat sampah bersih. Tidak ada nota belanja yang terhapus.' }}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>

        </table>
      </div>

      <!-- Grand Total Footer -->
      <div class="bg-slate-900 border-t border-slate-800 p-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <!-- Decorative element -->
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl"></div>
        <div class="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        
        <div class="flex items-center gap-3 relative z-10">
          <div class="bg-slate-800 p-2 rounded-lg text-slate-300"><Coins :size="24" /></div>
          <div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Akumulasi</p>
            <p class="text-sm font-bold text-slate-300">Pengeluaran Gudang</p>
          </div>
        </div>
        <div class="relative z-10 text-center sm:text-right">
          <p class="text-3xl font-black text-white drop-shadow-md">
            Rp {{ formatRp(grandTotal) }}
          </p>
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

.custom-scrollbar::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1; /* slate-300 */
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #94a3b8; /* slate-400 */
}
</style>