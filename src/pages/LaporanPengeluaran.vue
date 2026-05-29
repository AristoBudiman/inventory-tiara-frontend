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
    <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-x-auto">
      <table class="w-full min-w-max text-sm text-left">
        <thead class="bg-gray-100 border-b-2 border-gray-200">
          <tr>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-[10px] w-32 whitespace-nowrap">Tgl Nota</th>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-[10px] whitespace-nowrap">Keterangan / Item Belanja</th>
            <th class="p-4 text-center font-black text-gray-600 uppercase tracking-wider text-[10px] border-x border-gray-200 w-32 whitespace-nowrap">Qty Masuk</th>
            <th class="p-4 text-right font-black text-gray-600 uppercase tracking-wider text-[10px] w-40 whitespace-nowrap">Harga / Satuan</th>
            <th class="p-4 text-right font-black text-red-700 uppercase tracking-wider text-[10px] border-l border-gray-200 bg-red-50/50 w-48 whitespace-nowrap">Subtotal Biaya</th>
            <th class="p-4 text-center font-black text-gray-600 uppercase tracking-wider text-[10px] w-36 whitespace-nowrap">Status Bayar</th>
            <th class="p-4 text-center font-black text-gray-600 uppercase tracking-wider text-[10px] w-24 whitespace-nowrap">Aksi</th>
          </tr>
        </thead>
        <tbody v-for="nota in listBelanja" :key="nota.ID" class="border-b-[3px] border-gray-300 bg-white">
          
          <tr class="bg-gray-50/80 hover:bg-gray-100 transition-colors">
            <td class="p-4 font-bold text-gray-800 whitespace-nowrap">{{ formatTanggal(nota.tanggal) }}</td>
            <td class="p-4 whitespace-nowrap">
               <p class="font-black text-gray-900 text-sm mb-0.5">Nota #BELI-{{ nota.ID }}</p>
               <p class="text-[10px] font-bold text-gray-500 uppercase">{{ nota.keterangan || 'Tanpa catatan' }}</p>
            </td>
            <td class="p-4 text-center border-x border-gray-200 bg-gray-100/50 whitespace-nowrap">
               <span class="font-bold text-gray-500 text-xs">{{ nota.details ? nota.details.length : 0 }} Macam Item</span>
            </td>
            <td class="p-4 text-right font-bold text-gray-400 text-xs whitespace-nowrap">Grand Total ➡️</td>
            <td class="p-4 text-right font-black text-red-700 border-l border-gray-200 bg-red-50/50 text-base whitespace-nowrap">
               Rp {{ formatRp(nota.total_biaya) }}
            </td>
            <td class="p-4 text-center border-l border-gray-200 whitespace-nowrap">
              <div v-if="nota.is_lunas" class="flex flex-col gap-2">
                <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm border border-green-200">LUNAS</span>
                <button @click="toggleStatusBayar(nota)" class="bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 text-[9px] font-bold px-2 py-1.5 rounded shadow-sm transition-all active:scale-95">Batal Lunas ↩</button>
              </div>
              <div v-else class="flex flex-col gap-2">
                <span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm border border-red-200">HUTANG</span>
                <button @click="toggleStatusBayar(nota)" class="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-2 py-1.5 rounded shadow transition-all active:scale-95">Tandai Lunas ✔</button>
              </div>
            </td>
            <td class="p-4 text-center border-l border-gray-200 whitespace-nowrap">
                <button @click="hapusPembelian(nota.ID)" title="Batalkan & Hapus Belanja" class="w-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-black px-2 py-2 rounded shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5">
                  ❌ Hapus
                </button>
            </td>
          </tr>

          <tr v-for="d in nota.details" :key="d.ID" class="hover:bg-blue-50/30 transition-colors border-t border-gray-100">
            <td class="p-3"></td>
            <td class="p-3 pl-8 whitespace-nowrap">
               <p class="font-bold text-gray-700 text-sm flex items-center gap-2">
                 <span class="text-gray-300">↳</span> {{ d.bahan?.nama_bahan || 'Bahan Terhapus' }}
               </p>
            </td>
            <td class="p-3 text-center border-x border-gray-100 whitespace-nowrap">
               <span class="font-black text-blue-700 text-sm">{{ d.qty }}</span>
               <span v-if="d.bahan" class="text-[9px] font-bold text-gray-500 uppercase ml-1">{{ d.bahan.satuan }}</span>
            </td>
            <td class="p-3 text-right font-semibold text-gray-600 whitespace-nowrap">
               Rp {{ formatRp(d.harga_beli_satuan) }}
            </td>
            <td class="p-3 text-right font-black text-gray-800 border-l border-gray-100 whitespace-nowrap">
               Rp {{ formatRp(d.subtotal) }}
            </td>
            <td colspan="2" class="border-l border-gray-100 bg-gray-50/30"></td>
          </tr>
        </tbody>

        <tbody v-if="listBelanja.length === 0">
          <tr>
            <td colspan="7" class="p-12 text-center text-gray-400 font-bold bg-gray-50">Tidak ada pengeluaran di rentang tanggal ini.</td>
          </tr>
        </tbody>
        <!-- GRAND TOTAL -->
        <tfoot class="bg-gray-800 text-white border-t-4 border-red-500">
            <tr>
                <td colspan="5" class="p-4 text-right font-black uppercase tracking-widest text-xs">Grand Total Pengeluaran:</td>
                <td colspan="2" class="p-4 text-right font-black text-xl text-red-400">Rp {{ formatRp(grandTotal) }}</td>
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