<script setup>
import { ref, onMounted } from 'vue'

const listBahan = ref([])
const listOpname = ref([])
const form = ref({ bahan_id: '', stok_fisik: 0, keterangan: '' })
const bahanTerpilih = ref(null)

const fetchData = async () => {
  const token = localStorage.getItem('inventory_token')
  const headers = { 'Authorization': `Bearer ${token}` }
  
  const [resB, resO] = await Promise.all([
    fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/opname`, { headers })
  ])
  if(resB.ok) listBahan.value = await resB.json()
  if(resO.ok) listOpname.value = await resO.json()
}

const onBahanChange = () => {
  bahanTerpilih.value = listBahan.value.find(b => b.ID === form.value.bahan_id)
  form.value.stok_fisik = 0 // Reset input
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
    fetchData()
  }
}

const formatTgl = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  }) + ' WIB'
}

onMounted(fetchData)
</script>

<template>
  <div class="p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
    
    <div class="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border-t-8 border-purple-500 self-start">
      <h2 class="text-xl font-black text-purple-900 mb-6">⚖️ Input Sidak Gudang</h2>
      
      <form @submit.prevent="simpanOpname" class="space-y-4">
        <div>
           <label class="block text-xs font-bold text-gray-600 mb-1">Pilih Bahan Baku</label>
           <select v-model="form.bahan_id" @change="onBahanChange" required class="w-full border-2 border-gray-300 rounded p-2 font-bold outline-none">
             <option value="" disabled>-- Katalog Bahan --</option>
             <option v-for="b in listBahan" :key="b.ID" :value="b.ID">{{ b.nama_bahan }}</option>
           </select>
        </div>
        
        <div v-if="bahanTerpilih" class="bg-gray-100 p-3 rounded text-center border">
           <p class="text-xs font-bold text-gray-500">Stok Di Komputer Saat Ini:</p>
           <p class="text-2xl font-black text-gray-800">{{ bahanTerpilih.stok }} <span class="text-sm">{{ bahanTerpilih.satuan }}</span></p>
        </div>

        <div>
           <label class="block text-xs font-bold text-gray-600 mb-1">Timbangan Nyata (Fisik)</label>
           <input v-model.number="form.stok_fisik" type="number" step="any" min="0" required class="w-full border-2 border-purple-400 bg-purple-50 rounded p-2 font-black text-center text-purple-900 outline-none">
        </div>

        <div>
           <label class="block text-xs font-bold text-gray-600 mb-1">Keterangan / Alasan Selisih</label>
           <input v-model="form.keterangan" type="text" placeholder="ex: Tepung tumpah dimakan tikus" class="w-full border-2 rounded p-2 font-medium outline-none">
        </div>

        <button type="submit" class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-black shadow hover:bg-purple-700">
          CATAT OPNAME
        </button>
      </form>
    </div>

    <div class="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Riwayat Stock Opname (Efisiensi Gudang)</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-100 text-gray-700">
            <tr>
              <th class="p-3 font-bold">Waktu</th>
              <th class="p-3 font-bold">Bahan</th>
              <th class="p-3 text-center font-bold">Stok Komputer</th>
              <th class="p-3 text-center font-bold text-purple-700">Fisik Nyata</th>
              <th class="p-3 text-center font-bold">Selisih/Hilang</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in listOpname" :key="o.ID" class="border-b hover:bg-gray-50">
              <td class="p-3 text-xs text-gray-500 font-bold">{{ formatTgl(o.tanggal) }}</td>
              <td class="p-3 font-black text-gray-800">{{ o.bahan.nama_bahan }}</td>
              <td class="p-3 text-center font-medium">{{ o.stok_sistem }}</td>
              <td class="p-3 text-center font-black text-purple-700 bg-purple-50">{{ o.stok_fisik }}</td>
              <td class="p-3 text-center font-black" :class="o.selisih < 0 ? 'text-red-600' : 'text-green-600'">
                {{ o.selisih }}
              </td>
            </tr>
            <tr v-if="listOpname.length === 0"><td colspan="5" class="p-6 text-center text-gray-400 italic">Belum ada riwayat opname.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>