<script setup>
import { ref, computed, onMounted } from 'vue'

const today = new Date()
const year = today.getFullYear()
const month = String(today.getMonth() + 1).padStart(2, '0')
const day = String(today.getDate()).padStart(2, '0')

// 2 bulan ke belakang
const twoMonthsAgo = new Date(today)
twoMonthsAgo.setMonth(today.getMonth() - 2)
const startYear = twoMonthsAgo.getFullYear()
const startMonth = String(twoMonthsAgo.getMonth() + 1).padStart(2, '0')
const startDay = String(twoMonthsAgo.getDate()).padStart(2, '0')

const startDate = ref(`${startYear}-${startMonth}-${startDay}`)
const endDate = ref(`${year}-${month}-${day}`)

const listBahan = ref([])
const listOpname = ref([])
const form = ref({ bahan_id: '', stok_fisik: 0, keterangan: '' })
const bahanTerpilih = ref(null)

const searchQuery = ref('')
const isDropdownOpen = ref(false)

// Logika filter otomatis berdasarkan ketikan
const filteredBahan = computed(() => {
  if (!searchQuery.value) return listBahan.value
  return listBahan.value.filter(b => 
    b.nama_bahan.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Logika saat item di klik dari dropdown
const selectBahan = (b) => {
  form.value.bahan_id = b.ID
  searchQuery.value = b.nama_bahan // Tampilkan nama bahan di kotak input
  bahanTerpilih.value = b
  isDropdownOpen.value = false     // Tutup dropdown
  onBahanChange()                  // Panggil fungsi bawaanmu
}

// Fungsi pintar untuk mengembalikan nama bahan jika user batal memilih
const tutupDropdown = () => {
  setTimeout(() => {
    isDropdownOpen.value = false
    
    // Cek: Apakah sebelumnya sudah ada bahan yang dipilih?
    if (bahanTerpilih.value) {
      // Kembalikan tulisannya ke nama bahan yang dipilih tadi
      searchQuery.value = bahanTerpilih.value.nama_bahan
    } else {
      // Jika dari awal belum milih apa-apa, kosongkan saja
      searchQuery.value = ''
    }
  }, 200) // Jeda 200ms agar klik di list tidak kalah cepat dengan blur
}

const fetchData = async () => {
  const token = localStorage.getItem('inventory_token')
  const headers = { 'Authorization': `Bearer ${token}` }
  
  const [resB, resO] = await Promise.all([
    fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/opname?start=${startDate.value}&end=${endDate.value}`, { headers })
  ])
  if(resB.ok) listBahan.value = await resB.json()
  if(resO.ok) listOpname.value = await resO.json()
}

const onBahanChange = () => {
  bahanTerpilih.value = listBahan.value.find(b => b.ID === form.value.bahan_id)
  form.value.stok_fisik = 0 
}

const simpanOpname = async () => {
  if(!form.value.bahan_id) return alert('Pilih bahan!')
  if(!confirm(`Catat penyesuaian fisik gudang? Stok di sistem akan ditimpa dengan angka ini.`)) return

  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/opname`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(form.value)
  })

  if(res.ok) {
    alert("Opname berhasil! Stok bahan telah disesuaikan.")
    form.value = { bahan_id: '', stok_fisik: 0, keterangan: '' }
    bahanTerpilih.value = null
    searchQuery.value = ''
    fetchData()
  }
}

// PERBAIKAN: Memisahkan tanggal dan jam dengan elegan
const formatDateTime = (d) => {
  if (!d) return { date: '-', time: '-' }
  const dateObj = new Date(d);
  return {
    date: dateObj.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' }),
    time: dateObj.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB'
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    
    <!-- HEADER -->
    <div class="border-b-2 border-gray-200 pb-4">
      <h1 class="text-3xl font-black text-gray-800 tracking-tight">⚖️ Stock Opname Gudang</h1>
      <p class="text-sm text-gray-500 font-medium mt-1">Sidak fisik bahan baku dan kemasan untuk menyesuaikan selisih sistem.</p>
    </div>

    <!-- FILTER TANGGAL -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-purple-100 flex flex-col md:flex-row items-end gap-5">
      <div class="flex-1 w-full">
        <label class="block text-[10px] font-black text-purple-800 uppercase tracking-wider mb-2">Periode Mulai</label>
        <input type="date" v-model="startDate" @change="fetchData" class="w-full border-2 border-gray-300 rounded-lg p-2.5 font-bold outline-none focus:border-purple-500 text-gray-700 bg-gray-50 focus:bg-white transition-colors cursor-pointer">
      </div>
      <div class="flex-1 w-full">
        <label class="block text-[10px] font-black text-purple-800 uppercase tracking-wider mb-2">Periode Sampai</label>
        <input type="date" v-model="endDate" @change="fetchData" class="w-full border-2 border-gray-300 rounded-lg p-2.5 font-bold outline-none focus:border-purple-500 text-gray-700 bg-gray-50 focus:bg-white transition-colors cursor-pointer">
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- FORM INPUT (KIRI) -->
      <div class="lg:col-span-4">
        <div class="bg-white rounded-xl shadow-md border border-purple-200 overflow-hidden sticky top-24">
          <div class="bg-purple-600 p-4 text-white flex items-center gap-2">
            <h2 class="text-lg font-bold tracking-wide">📝 Input Timbangan Fisik</h2>
          </div>
          
          <form @submit.prevent="simpanOpname" class="p-5 space-y-4 bg-purple-50/30">
            <div class="relative">
               <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Pilih Bahan Baku (Ketik Nama)</label>
               
               <input 
                 type="text" 
                 v-model="searchQuery" 
                 @focus="isDropdownOpen = true; searchQuery = ''" 
                 @blur="tutupDropdown"
                 placeholder="🔍 Ketik nama tepung, gula..." 
                 required
                 class="w-full border-2 border-gray-300 rounded-lg p-2.5 font-bold outline-none focus:border-purple-500 bg-white text-gray-800 transition-colors"
               >
               
               <ul v-if="isDropdownOpen" class="absolute z-50 w-full bg-white border-2 border-purple-300 mt-1 rounded-lg shadow-xl max-h-56 overflow-y-auto custom-scrollbar">
                 <li 
                   v-for="b in filteredBahan" 
                   :key="b.ID" 
                   @mousedown.prevent="selectBahan(b)"
                   class="p-3 hover:bg-purple-100 cursor-pointer font-bold text-sm text-gray-700 border-b border-gray-100 last:border-0 transition-colors"
                 >
                   {{ b.nama_bahan }}
                 </li>
                 <li v-if="filteredBahan.length === 0" class="p-4 text-center text-xs font-bold text-red-400 italic bg-red-50">
                   Bahan tidak ditemukan!
                 </li>
               </ul>
            </div>
            
            <div v-if="bahanTerpilih" class="bg-purple-100/50 p-3 rounded-lg border border-purple-200 text-center animate-fade-in">
               <p class="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Stok Komputer Saat Ini</p>
               <p class="text-2xl font-black text-purple-900 leading-none">{{ bahanTerpilih.stok }} <span class="text-xs font-bold text-purple-600 uppercase">{{ bahanTerpilih.satuan }}</span></p>
            </div>

            <div class="pt-2">
               <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Hasil Timbangan Nyata</label>
               <input v-model.number="form.stok_fisik" type="number" step="any" min="0" required class="w-full border-2 border-gray-300 bg-white rounded-lg p-3 font-black text-center text-gray-900 outline-none focus:border-purple-500 transition-colors text-lg">
            </div>

            <div>
               <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Alasan Selisih (Opsional)</label>
               <input v-model="form.keterangan" type="text" placeholder="Contoh: Tepung tumpah dimakan tikus" class="w-full border-2 border-gray-300 rounded-lg p-2.5 font-bold outline-none focus:border-purple-500 bg-white text-gray-700 transition-colors">
            </div>

            <div class="pt-4 border-t border-gray-200">
               <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3.5 rounded-lg font-black shadow-md transition-all active:scale-95">
                 KUNCI OPNAME
               </button>
            </div>
          </form>
        </div>
      </div>

      <!-- TABEL RIWAYAT (KANAN) -->
      <div class="lg:col-span-8">
        <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
            <h2 class="font-bold text-gray-800 text-sm md:text-base">Riwayat Stock Opname (Efisiensi Gudang)</h2>
          </div>
          <div class="overflow-x-auto w-full">
            <table class="w-full min-w-max text-sm text-left">
              <thead class="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-[10px] whitespace-nowrap">Waktu Opname</th>
                  <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-[10px] whitespace-nowrap">Nama Bahan</th>
                  <th class="p-4 text-center font-black text-gray-600 uppercase tracking-wider text-[10px] whitespace-nowrap">Stok Komputer</th>
                  <th class="p-4 text-center font-black text-purple-700 uppercase tracking-wider text-[10px] whitespace-nowrap">Fisik Nyata</th>
                  <th class="p-4 text-center font-black text-gray-600 uppercase tracking-wider text-[10px] border-l border-gray-200 whitespace-nowrap">Selisih</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="o in listOpname" :key="o.ID" class="hover:bg-purple-50/30 transition-colors group">
                  <td class="p-4 whitespace-nowrap">
                    <!-- PERBAIKAN: Tanggal dan Jam tampil cantik -->
                    <span class="text-xs font-bold text-gray-800 block">{{ formatDateTime(o.tanggal).date }}</span>
                    <span class="text-[10px] font-black text-purple-600 block mt-0.5">{{ formatDateTime(o.tanggal).time }}</span>
                  </td>
                  <td class="p-4 font-bold text-gray-800 text-base whitespace-nowrap">
                    {{ o.bahan.nama_bahan }}
                    <span class="block text-[10px] font-bold text-gray-400 italic mt-0.5">{{ o.keterangan || 'Tidak ada catatan' }}</span>
                  </td>
                  <td class="p-4 text-center font-bold text-gray-500 whitespace-nowrap">{{ o.stok_sistem }} <span class="text-[9px] uppercase">{{ o.bahan.satuan }}</span></td>
                  <td class="p-4 text-center whitespace-nowrap">
                    <span class="font-black text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">{{ o.stok_fisik }} <span class="text-[9px] uppercase text-purple-500">{{ o.bahan.satuan }}</span></span>
                  </td>
                  <td class="p-4 text-center border-l border-gray-100 whitespace-nowrap">
                    <span class="font-black text-sm px-2 py-1 rounded-md" :class="o.selisih < 0 ? 'bg-red-50 text-red-600' : (o.selisih > 0 ? 'bg-green-50 text-green-600' : 'text-gray-400')">
                      {{ o.selisih > 0 ? '+' : '' }}{{ o.selisih }}
                    </span>
                  </td>
                </tr>
                <tr v-if="listOpname.length === 0"><td colspan="5" class="p-8 text-center text-gray-400 font-bold italic">Belum ada riwayat opname di gudang.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
/* Membuat tampilan scrollbar menjadi lebih tipis dan elegan */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

/* Warna jalur/trek scrollbar (Abu-abu sangat muda) */
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f9fafb; 
  border-radius: 8px;
}

/* Warna batang scroll yang bisa ditarik (Ungu muda menyesuaikan border dropdown) */
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d8b4fe; 
  border-radius: 8px;
}

/* Warna batang saat disorot/di-hover mouse (Ungu tua) */
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a855f7; 
}
</style>