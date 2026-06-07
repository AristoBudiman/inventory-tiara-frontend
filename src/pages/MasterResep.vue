<script setup>
import { ref, onMounted } from 'vue'
import { Soup, Plus, Inbox, Pencil, Sparkles, Save } from 'lucide-vue-next'

const listResep = ref([])
const listBahan = ref([])
const isEdit = ref(false)
const formResep = ref({ ID: null, nama_resep: '', target_gramasi: 0, bahan_detail: [{ bahan_id: '', kebutuhan: 0 }] })
const showModalResep = ref(false)

const fetchBahan = async () => { const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }}); if (res.ok) listBahan.value = await res.json() }
const fetchResep = async () => { const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resep`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }}); if (res.ok) listResep.value = await res.json() }

const tambahBarisBahan = () => formResep.value.bahan_detail.push({ bahan_id: '', kebutuhan: 0, _search: '', _isOpen: false })
const hapusBarisBahan = (idx) => formResep.value.bahan_detail.splice(idx, 1)

const getFilteredBahan = (query) => {
  if (!query) return listBahan.value
  return listBahan.value.filter(b => b.nama_bahan.toLowerCase().includes(query.toLowerCase()))
}

const simpanResep = async () => {
  if (formResep.value.bahan_detail.length === 0) return window.$dialog.alert('Resep minimal butuh 1 bahan!')
  const invalid = formResep.value.bahan_detail.find(b => !b.bahan_id || b.kebutuhan <= 0)
  if(invalid) return window.$dialog.alert('Pastikan semua baris bahan dipilih dan gramasinya valid!')

  const method = isEdit.value ? 'PUT' : 'POST'
  const url = isEdit.value ? `${import.meta.env.VITE_API_URL}/api/resep/${formResep.value.ID}` : `${import.meta.env.VITE_API_URL}/api/resep`
  
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
      return window.$dialog.alert('Gagal menyimpan resep: ' + (err.message || res.statusText))
    }

    resetForm(); fetchResep()
  } catch (error) {
    window.$dialog.alert('Terjadi kesalahan jaringan: ' + error.message)
  }
}

const tambahResepBaru = () => {
  resetForm()
  showModalResep.value = true
}

const editResep = (r) => { 
  isEdit.value = true
  formResep.value = { ID: r.ID, nama_resep: r.nama_resep, target_gramasi: r.target_gramasi, bahan_detail: r.bahan_detail.map(d => ({ bahan_id: d.bahan_id, kebutuhan: d.kebutuhan, _search: d.bahan?.nama_bahan || '', _isOpen: false })) } 
  showModalResep.value = true
}

const hapusResep = async (id) => { if(await window.$dialog.confirm('Buang resep ini?')) { await fetch(`${import.meta.env.VITE_API_URL}/api/resep/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` } }); fetchResep() } }
const resetForm = () => { isEdit.value = false; showModalResep.value = false; formResep.value = { ID: null, nama_resep: '', target_gramasi: 0, bahan_detail: [{ bahan_id: '', kebutuhan: 0, _search: '', _isOpen: false }] } }

onMounted(() => { fetchBahan(); fetchResep() })
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-gray-200 pb-4 gap-4">
      <div>
        <h1 class="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2"><Soup :size="32" /> Katalog Resep Dapur</h1>
        <p class="text-sm text-gray-500 font-medium mt-1">Susun komposisi adonan untuk dihubungkan ke produk akhir.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button @click="tambahResepBaru" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2 whitespace-nowrap">
          <Plus :size="18" /> Racik Resep Baru
        </button>
      </div>
    </div>

    <!-- Grid Resep -->
    <div v-if="listResep.length === 0" class="flex flex-col items-center justify-center h-64 bg-white rounded-xl border-2 border-dashed border-gray-300">
        <div class="text-gray-400 mb-3"><Inbox :size="48" /></div>
        <p class="text-gray-500 font-bold">Belum ada resep yang diracik.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="r in listResep" :key="r.ID" class="bg-white rounded-2xl border border-gray-200 border-t-8 border-t-orange-500 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
        
        <div class="bg-gray-50 p-5 border-b border-gray-200 flex justify-between items-start gap-3">
          <div>
              <h3 class="font-black text-lg text-gray-800 leading-tight mb-1.5">{{ r.nama_resep }}</h3>
              <span class="text-[10px] font-black text-orange-700 bg-orange-100 px-2 py-1 rounded-md uppercase tracking-wider">Hasil: {{ r.target_gramasi }} gr</span>
          </div>
          <div class="flex gap-1 shrink-0">
              <button @click="editResep(r)" class="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg font-bold transition-colors" title="Edit Resep">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button @click="hapusResep(r.ID)" class="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg font-bold transition-colors" title="Hapus Resep">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
          </div>
        </div>
        
        <div class="p-5 flex-1 bg-white">
          <div class="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
             <div v-for="bd in r.bahan_detail" :key="bd.ID" class="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                 <div class="flex items-center gap-2">
                   <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                   <span class="text-xs font-bold text-gray-700 truncate pr-2">{{ bd.bahan?.nama_bahan }}</span>
                 </div>
                 <span class="text-xs font-black text-gray-800 shrink-0 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">{{ bd.kebutuhan }} <span class="text-[9px] text-gray-500 font-bold uppercase">{{ bd.bahan?.satuan }}</span></span>
             </div>
          </div>
        </div>

      </div>
    </div>

    <!-- MODAL BUILDER -->
    <div v-if="showModalResep" class="fixed inset-0 z-50 overflow-y-auto custom-scrollbar bg-slate-900/40 backdrop-blur-md">
      <div class="flex items-center justify-center min-h-screen p-4 md:p-8">
        
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-t-8 animate-fade-in relative" :class="isEdit ? 'border-orange-500' : 'border-blue-600'">
          
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
            <div>
              <h2 class="text-xl font-black text-gray-800 flex items-center gap-2">
                <Pencil v-if="isEdit" :size="24" />
                <Sparkles v-else :size="24" />
                {{ isEdit ? 'Update Komposisi Resep' : 'Racik Adonan Baru' }}
              </h2>
              <p class="text-xs text-gray-500 font-medium mt-1">Pastikan takaran gramasi bahan sudah akurat.</p>
            </div>
            <button @click="showModalResep = false" class="text-gray-400 hover:text-red-500 transition-colors p-2 bg-gray-50 rounded-full hover:bg-red-50">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="p-6 space-y-5 bg-gray-50/50">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Nama Resep</label>
                <input v-model="formResep.nama_resep" type="text" required placeholder="Contoh: Roti Manis Dasar" class="w-full border-2 border-gray-200 p-2.5 rounded-xl focus:border-orange-500 font-bold text-gray-800 outline-none bg-white transition-colors">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Total Hasil Matang (Estimasi)</label>
                <div class="relative">
                  <input v-model.number="formResep.target_gramasi" type="number" required min="1" step="any" class="w-full border-2 border-gray-200 p-2.5 rounded-xl pr-12 focus:border-orange-500 font-black text-gray-800 outline-none bg-white transition-colors">
                  <span class="absolute right-4 top-3 text-sm font-bold text-gray-500">gr</span>
                </div>
              </div>
            </div>

            <!-- Area Komposisi -->
            <div class="pt-2 pb-12"> <!-- Added pb-12 so dropdown has room at the bottom -->
              <div class="flex justify-between items-center mb-3">
                  <button type="button" @click="tambahBarisBahan" class="text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><Plus :size="14" /> Tambah Baris</button>
              </div>
              
              <div class="space-y-3">
                <div v-for="(b, idx) in formResep.bahan_detail" :key="idx" class="bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative flex gap-3 items-center">
                  
                  <div class="flex-1 relative">
                    <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bahan Baku</label>
                    <div class="relative w-full">
                      <input 
                        type="text" 
                        v-model="b._search" 
                        @focus="b._isOpen = true" 
                        placeholder="Ketik nama bahan..." 
                        class="w-full text-sm border-2 border-gray-200 rounded-xl p-2.5 font-bold outline-none text-gray-800 focus:border-orange-500 transition-colors bg-white"
                      >
                      
                      <!-- Dropdown Search -->
                      <div v-if="b._isOpen" @click="b._isOpen = false" class="fixed inset-0 z-40 cursor-default"></div>
                      <ul v-if="b._isOpen" class="absolute left-0 right-0 top-full bg-white border border-gray-200 shadow-xl max-h-48 overflow-y-auto rounded-xl mt-1 custom-scrollbar divide-y divide-gray-100 z-50">
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

                  <div class="w-24">
                    <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 text-center">Takaran</label>
                    <input v-model.number="b.kebutuhan" type="number" required min="0.01" step="any" placeholder="Qty" class="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-center font-black text-sm text-gray-800 outline-none focus:border-orange-500 focus:bg-white transition-colors">
                  </div>

                  <button type="button" @click="hapusBarisBahan(idx)" class="mt-4 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 w-8 h-8 rounded-lg flex items-center justify-center transition-colors font-bold text-lg leading-none shrink-0" title="Hapus Baris">×</button>
                </div>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-2xl">
              <button type="button" @click="showModalResep = false" class="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm">Batal</button>
              <button @click="simpanResep" class="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold shadow-md hover:bg-orange-700 transition-colors text-sm flex items-center gap-2">
                <Save v-if="isEdit" :size="18" />
                <Sparkles v-else :size="18" />
                {{ isEdit ? 'Simpan Perubahan' : 'Buat Resep' }}
              </button>
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