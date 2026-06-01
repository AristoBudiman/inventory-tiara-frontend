<script setup>
import { ref, onMounted } from 'vue'

const listResep = ref([])
const listBahan = ref([])
const isEdit = ref(false)
const formResep = ref({ ID: null, nama_resep: '', target_gramasi: 0, bahan_detail: [{ bahan_id: '', kebutuhan: 0 }] })

const fetchBahan = async () => { const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }}); if (res.ok) listBahan.value = await res.json() }
const fetchResep = async () => { const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resep`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }}); if (res.ok) listResep.value = await res.json() }

const tambahBarisBahan = () => formResep.value.bahan_detail.push({ bahan_id: '', kebutuhan: 0, _search: '', _isOpen: false })
const hapusBarisBahan = (idx) => formResep.value.bahan_detail.splice(idx, 1)

const getFilteredBahan = (query) => {
  if (!query) return listBahan.value
  return listBahan.value.filter(b => b.nama_bahan.toLowerCase().includes(query.toLowerCase()))
}

const simpanResep = async () => {
  if (formResep.value.bahan_detail.length === 0) return alert('Resep minimal butuh 1 bahan!')
  const invalid = formResep.value.bahan_detail.find(b => !b.bahan_id || b.kebutuhan <= 0)
  if(invalid) return alert('Pastikan semua baris bahan dipilih dan gramasinya valid!')

  const method = isEdit.value ? 'PUT' : 'POST'
  const url = isEdit.value ? `${import.meta.env.VITE_API_URL}/api/resep/${formResep.value.ID}` : `${import.meta.env.VITE_API_URL}/api/resep`
  
  // Bersihkan properti state UI (_search, _isOpen) sebelum dikirim ke server
  const payload = {
    ...formResep.value,
    bahan_detail: formResep.value.bahan_detail.map(b => ({
      bahan_id: b.bahan_id,
      kebutuhan: b.kebutuhan
    }))
  }

  try {
    const res = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }, 
      body: JSON.stringify(payload) 
    })
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return alert('Gagal menyimpan resep: ' + (err.message || res.statusText))
    }

    resetForm(); fetchResep()
  } catch (error) {
    alert('Terjadi kesalahan jaringan: ' + error.message)
  }
}

const editResep = (r) => { isEdit.value = true; formResep.value = { ID: r.ID, nama_resep: r.nama_resep, target_gramasi: r.target_gramasi, bahan_detail: r.bahan_detail.map(d => ({ bahan_id: d.bahan_id, kebutuhan: d.kebutuhan, _search: d.bahan?.nama_bahan || '', _isOpen: false })) } }
const hapusResep = async (id) => { if(confirm('Buang resep ini?')) { await fetch(`${import.meta.env.VITE_API_URL}/api/resep/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` } }); fetchResep() } }
const resetForm = () => { isEdit.value = false; formResep.value = { ID: null, nama_resep: '', target_gramasi: 0, bahan_detail: [{ bahan_id: '', kebutuhan: 0, _search: '', _isOpen: false }] } }

onMounted(() => { fetchBahan(); fetchResep() })
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto animate-fade-in">
    <!-- Header -->
    <div class="mb-8 border-b-2 border-gray-200 pb-4">
      <h1 class="text-3xl font-black text-gray-800 tracking-tight">🥣 Buku Resep Dapur</h1>
      <p class="text-sm text-gray-500 font-medium mt-1">Susun komposisi adonan untuk dihubungkan ke produk akhir.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- KIRI: FORM BUILDER -->
      <div class="lg:col-span-4">
        <div class="bg-white rounded-xl shadow-md border border-orange-200 overflow-visible">
          <div class="bg-orange-500 rounded-t-xl p-4 text-white flex items-center gap-2">
            <h2 class="text-lg font-bold">{{ isEdit ? '✏️ Update Komposisi' : '✨ Racik Adonan Baru' }}</h2>
          </div>
          
          <form @submit.prevent="simpanResep" class="p-5 space-y-4 bg-orange-50/30 rounded-b-xl">
            <div>
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Nama Resep</label>
              <input v-model="formResep.nama_resep" type="text" required placeholder="Contoh: Roti Manis Dasar" class="w-full border-2 border-gray-300 p-2.5 rounded-lg focus:border-orange-500 font-bold text-gray-800 outline-none bg-white transition-colors">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Total Hasil Matang</label>
              <div class="relative">
                <input v-model.number="formResep.target_gramasi" type="number" required min="1" step="any" class="w-full border-2 border-gray-300 p-2.5 rounded-lg pr-12 focus:border-orange-500 font-black text-gray-800 outline-none bg-white transition-colors">
                <span class="absolute right-4 top-3 text-sm font-bold text-gray-500">gr</span>
              </div>
            </div>

            <!-- Area Komposisi -->
            <div class="pt-4 border-t-2 border-gray-200">
              <div class="flex justify-between items-center mb-3">
                  <label class="text-xs font-bold text-gray-600 uppercase tracking-wider">Komposisi Bahan</label>
                  <button type="button" @click="tambahBarisBahan" class="text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded transition-colors">+ Tambah</button>
              </div>
              
              <div class="space-y-2 pr-2">
                <div v-for="(b, idx) in formResep.bahan_detail" :key="idx" class="bg-white p-2 rounded-lg border border-gray-300 shadow-sm relative">
                  
                  <div class="flex gap-2 items-center">
                    <div class="flex-1 relative">
                      <input 
                        type="text" 
                        v-model="b._search" 
                        @focus="b._isOpen = true" 
                        placeholder="Cari bahan..." 
                        class="w-full text-sm border-none bg-transparent font-bold outline-none text-gray-800"
                      >
                    </div>

                    <input v-model.number="b.kebutuhan" type="number" required min="0.01" step="any" placeholder="Qty" class="w-20 bg-gray-50 border border-gray-300 rounded p-1.5 text-center font-bold text-sm text-gray-800 outline-none focus:border-orange-500">
                    <button type="button" @click="hapusBarisBahan(idx)" class="text-red-500 hover:text-red-700 p-1 font-bold text-2xl leading-none">×</button>
                  </div>
                  
                  <div v-if="b._isOpen" @click="b._isOpen = false" class="fixed inset-0 z-40 cursor-default"></div>
                  <ul v-if="b._isOpen" class="w-full bg-white border border-gray-200 shadow-inner max-h-48 overflow-y-auto rounded-xl mt-2 custom-scrollbar overflow-hidden divide-y divide-gray-100 relative z-50">
                    <li 
                      v-for="mb in getFilteredBahan(b._search)" 
                      :key="mb.ID" 
                      @mousedown.prevent="b.bahan_id = mb.ID; b._search = mb.nama_bahan; b._isOpen = false"
                      class="px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm font-semibold text-gray-700 transition-colors flex items-center justify-between"
                    >
                      {{ mb.nama_bahan }}
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">{{ mb.satuan }}</span>
                    </li>
                    <li v-if="getFilteredBahan(b._search).length === 0" class="p-4 text-sm text-gray-400 italic text-center">Bahan tidak ditemukan.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="flex gap-2 pt-4 border-t border-gray-200">
               <button v-if="isEdit" type="button" @click="resetForm" class="w-1/3 py-2.5 rounded-lg font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors text-sm">Batal</button>
               <button type="submit" class="flex-1 bg-orange-600 text-white py-2.5 rounded-lg font-bold shadow-md hover:bg-orange-700 transition-colors">
                 {{ isEdit ? 'Simpan Perubahan' : 'Kunci Resep' }}
               </button>
            </div>
          </form>
        </div>
      </div>

      <!-- KANAN: GRID RESEP -->
      <div class="lg:col-span-8">
        <div v-if="listResep.length === 0" class="flex flex-col items-center justify-center h-64 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <p class="text-gray-500 font-bold">Belum ada resep yang diracik.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div v-for="r in listResep" :key="r.ID" class="bg-white rounded-xl border border-gray-200 border-t-4 border-t-orange-400 overflow-hidden shadow-md flex flex-col">
            
            <div class="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-start">
              <div>
                  <h3 class="font-black text-lg text-gray-800 leading-tight mb-1">{{ r.nama_resep }}</h3>
                  <span class="text-[10px] font-black text-orange-700 bg-orange-100 px-2 py-1 rounded uppercase tracking-wider">Hasil: {{ r.target_gramasi }} gr</span>
              </div>
              <div class="flex gap-1">
                  <button @click="editResep(r)" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1.5 rounded font-bold transition-colors">Edit</button>
                  <button @click="hapusResep(r.ID)" class="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1.5 rounded font-bold transition-colors">Del</button>
              </div>
            </div>
            
            <div class="p-4 flex-1 bg-white">
              <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                 <div v-for="bd in r.bahan_detail" :key="bd.ID" class="flex justify-between items-baseline border-b border-dashed border-gray-200 pb-1">
                     <span class="text-xs font-bold text-gray-600 truncate pr-2">{{ bd.bahan.nama_bahan }}</span>
                     <span class="text-xs font-black text-gray-800 shrink-0">{{ bd.kebutuhan }} <span class="text-[9px] text-gray-500 font-bold uppercase">{{ bd.bahan.satuan }}</span></span>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
</style>