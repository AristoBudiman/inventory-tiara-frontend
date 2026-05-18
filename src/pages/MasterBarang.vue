<script setup>
import { ref, onMounted } from 'vue'

const listBarang = ref([])
const listResep = ref([])
const isEdit = ref(false)
const listBahan = ref([])

const form = ref({ ID: null, NamaBarang: '', HargaDefault: 0, resep_id: '', metode_konversi: 'Gram', kebutuhan_adonan: 0, masa_simpan: 2, kemasan_detail: [] })

const tambahKemasan = () => form.value.kemasan_detail.push({ bahan_id: '', kebutuhan: 1 })
const hapusKemasan = (idx) => form.value.kemasan_detail.splice(idx, 1)

const fetchMasterData = async () => {
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }
  const [resBarang, resResep, resBahan] = await Promise.all([
    fetch(`${import.meta.env.VITE_API_URL}/api/barangs`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/resep`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers }) 
  ])
  if (resBarang.ok) listBarang.value = await resBarang.json()
  if (resResep.ok) listResep.value = await resResep.json()
  if (resBahan.ok) listBahan.value = await resBahan.json() 
}

const handleSubmit = async () => {
  const method = isEdit.value ? 'PUT' : 'POST'
  const url = isEdit.value ? `${import.meta.env.VITE_API_URL}/api/barangs/${form.value.ID}` : `${import.meta.env.VITE_API_URL}/api/barangs`
  const payload = { NamaBarang: form.value.NamaBarang, HargaDefault: Number(form.value.HargaDefault), resep_id: form.value.resep_id ? Number(form.value.resep_id) : null, metode_konversi: form.value.metode_konversi, kebutuhan_adonan: Number(form.value.kebutuhan_adonan), masa_simpan: Number(form.value.masa_simpan), kemasan_detail: form.value.kemasan_detail }
  await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }, body: JSON.stringify(payload) })
  resetForm(); fetchMasterData()
}

const editBarang = (b) => { isEdit.value = true; form.value = { ID: b.ID, NamaBarang: b.NamaBarang, HargaDefault: b.HargaDefault, resep_id: b.resep_id || '', metode_konversi: b.metode_konversi || 'Gram', kebutuhan_adonan: b.kebutuhan_adonan || 0, masa_simpan: b.masa_simpan || 2, kemasan_detail: b.kemasan_detail || [] } }
const hapusBarang = async (id) => { if (confirm('Buang produk ini ke tempat sampah?')) { await fetch(`${import.meta.env.VITE_API_URL}/api/barangs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` } }); fetchMasterData() } }
const resetForm = () => { isEdit.value = false; form.value = { ID: null, NamaBarang: '', HargaDefault: 0, resep_id: '', metode_konversi: 'Gram', kebutuhan_adonan: 0, masa_simpan: 2, kemasan_detail: [] } }
const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)

const geserAtas = (idx) => { if (idx > 0) [listBarang.value[idx], listBarang.value[idx-1]] = [listBarang.value[idx-1], listBarang.value[idx]] }
const geserBawah = (idx) => { if (idx < listBarang.value.length - 1) [listBarang.value[idx], listBarang.value[idx+1]] = [listBarang.value[idx+1], listBarang.value[idx]] }
const simpanUrutan = async () => {
  const payload = listBarang.value.map((b, index) => ({ id: b.ID, urutan: index }))
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/barangs/reorder`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('inventory_token')}` }, body: JSON.stringify(payload) })
  if (res.ok) alert("Urutan display nota berhasil dikunci!")
}

onMounted(fetchMasterData)
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto animate-fade-in">
    <!-- Header Utama -->
    <div class="flex items-center justify-between mb-6 border-b-2 border-gray-200 pb-4">
      <div>
        <h1 class="text-3xl font-black text-gray-800 tracking-tight">🍞 Katalog Produk Jual</h1>
        <p class="text-sm text-gray-500 font-medium mt-1">Daftarkan barang jadi dan hubungkan dengan resep serta kemasan.</p>
      </div>
      <button @click="simpanUrutan" class="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-lg shadow-md font-bold text-sm transition-colors flex items-center gap-2">
        💾 Kunci Urutan Tampilan
      </button>
    </div>

    <!-- FORM BUILDER PRODUK -->
    <div class="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden mb-8">
      <div class="bg-blue-600 px-6 py-4 flex items-center gap-2">
        <h2 class="text-lg font-bold text-white tracking-tight">{{ isEdit ? '✏️ Edit Data Produk' : '✨ Buat Produk Baru' }}</h2>
      </div>
      
      <form @submit.prevent="handleSubmit" class="p-6 bg-gray-50/50">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          <!-- Informasi Barang (Biru Lembut) -->
          <div class="p-5 rounded-xl border border-blue-200 bg-blue-50/30">
            <label class="block text-xs font-black text-blue-800 uppercase tracking-wider mb-4 border-b border-blue-200 pb-2">Informasi Barang</label>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Nama Barang</label>
                <input v-model="form.NamaBarang" type="text" required placeholder="Contoh: Chiffon Keju Besar" class="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 focus:border-blue-500 font-bold outline-none transition-colors text-gray-800">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Harga Jual</label>
                <div class="relative">
                  <span class="absolute left-3 top-2.5 text-sm font-bold text-gray-400">Rp</span>
                  <input v-model.number="form.HargaDefault" type="number" required min="0" class="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 pl-10 focus:border-blue-500 font-black text-blue-700 outline-none transition-colors">
                </div>
              </div>
            </div>
          </div>

          <!-- Koneksi Resep (Orange Lembut) -->
          <div class="p-5 rounded-xl border border-orange-200 bg-orange-50/30">
            <label class="block text-xs font-black text-orange-800 uppercase tracking-wider mb-4 border-b border-orange-200 pb-2">Koneksi Resep Adonan</label>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Tarik Dari Resep Apa?</label>
                <select v-model="form.resep_id" class="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 focus:border-orange-500 font-bold outline-none text-gray-800 cursor-pointer">
                  <option value="">-- Tidak Diproduksi (Barang Titipan) --</option>
                  <option v-for="r in listResep" :key="r.ID" :value="r.ID">{{ r.nama_resep }}</option>
                </select>
              </div>
              
              <div v-if="form.resep_id" class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Satuan Potong</label>
                  <select v-model="form.metode_konversi" class="w-full bg-white border-2 border-gray-300 rounded-lg p-2 text-sm focus:border-orange-500 font-bold outline-none">
                    <option value="Gram">Gram</option>
                    <option value="Pcs">Pcs/Fraksi</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Beban Resep</label>
                  <input v-model.number="form.kebutuhan_adonan" type="number" step="any" min="0" required class="w-full bg-white border-2 border-gray-300 rounded-lg p-2 text-sm focus:border-orange-500 font-black outline-none text-center">
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Umur Simpan</label>
                  <div class="relative">
                     <input v-model.number="form.masa_simpan" type="number" min="1" required class="w-full bg-white border-2 border-gray-300 rounded-lg p-2 pr-8 focus:border-orange-500 font-black text-gray-800 outline-none text-center">
                     <span class="absolute right-2 top-2 text-[10px] font-bold text-gray-400 uppercase">Hari</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Koneksi Kemasan (Ungu Lembut) -->
        <div class="p-5 rounded-xl border border-purple-200 bg-purple-50/30 mb-6">
          <div class="flex justify-between items-center mb-4 border-b border-purple-200 pb-2">
            <label class="block text-xs font-black text-purple-800 uppercase tracking-wider">Koneksi Kemasan (Dus/Silver)</label>
            <button type="button" @click="tambahKemasan" class="text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded transition-colors border border-purple-200">
              + Tambah Kemasan
            </button>
          </div>
          
          <div class="space-y-2">
            <div v-for="(k, idx) in form.kemasan_detail" :key="idx" class="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-300 shadow-sm">
              <select v-model="k.bahan_id" required class="flex-1 border-none bg-transparent font-bold text-sm outline-none text-gray-800 cursor-pointer">
                <option value="" disabled>Pilih Dus/Tataan/Silver...</option>
                <option v-for="mb in listBahan" :key="mb.ID" :value="mb.ID">{{ mb.nama_bahan }} ({{ mb.satuan }})</option>
              </select>
              <div class="w-px h-6 bg-gray-200"></div>
              <input v-model.number="k.kebutuhan" type="number" step="any" min="0.01" class="w-24 border border-gray-300 bg-gray-50 rounded p-1.5 text-center font-bold text-sm outline-none focus:border-purple-500" placeholder="Qty">
              <button type="button" @click="hapusKemasan(idx)" class="text-red-500 hover:text-red-700 font-bold text-2xl leading-none px-2">×</button>
            </div>
            <div v-if="form.kemasan_detail.length === 0" class="text-center py-4 border-2 border-dashed border-purple-200 rounded-lg bg-white">
               <span class="text-xs font-bold text-purple-400">Tidak ada kemasan yang dikaitkan.</span>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button v-if="isEdit" type="button" @click="resetForm" class="px-6 py-2.5 rounded-lg font-bold text-gray-600 border border-gray-300 bg-white hover:bg-gray-100 transition-colors">Batal Edit</button>
          <button type="submit" class="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors">
            {{ isEdit ? 'Simpan Perubahan' : 'Simpan Produk' }}
          </button>
        </div>
      </form>
    </div>

    <!-- TABEL PRODUK -->
    <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-x-auto">
      <table class="w-full min-w-max text-left">
          <thead class="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                  <th class="p-4 w-16 text-center text-[10px] font-black text-gray-600 uppercase tracking-wider whitespace-nowrap">Urutan</th>
                  <th class="p-4 text-[10px] font-black text-gray-600 uppercase tracking-wider whitespace-nowrap">Nama Barang</th>
                  <th class="p-4 text-right text-[10px] font-black text-gray-600 uppercase tracking-wider whitespace-nowrap">Harga Jual</th>
                  <th class="p-4 text-[10px] font-black text-gray-600 uppercase tracking-wider pl-8 whitespace-nowrap">Struktur Resep & Kemasan</th>
                  <th class="p-4 text-center text-[10px] font-black text-gray-600 uppercase tracking-wider w-40 whitespace-nowrap">Aksi</th>
              </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
              <tr v-for="(b, index) in listBarang" :key="b.ID" class="hover:bg-blue-50/50 transition-colors">
                  
                  <td class="p-4 text-center bg-gray-50 border-r border-gray-100 whitespace-nowrap">
                      <div class="flex flex-col items-center">
                          <button @click="geserAtas(index)" :disabled="index === 0" class="text-gray-400 hover:text-blue-600 disabled:opacity-30 p-0.5 font-black leading-none">▲</button>
                          <span class="text-xs font-bold text-gray-600 my-1">{{ index + 1 }}</span>
                          <button @click="geserBawah(index)" :disabled="index === listBarang.length - 1" class="text-gray-400 hover:text-blue-600 disabled:opacity-30 p-0.5 font-black leading-none">▼</button>
                      </div>
                  </td>
                  
                  <td class="p-4 whitespace-nowrap">
                     <p class="font-bold text-gray-800 text-base mb-1">{{ b.NamaBarang }}</p>
                     <span v-if="!b.resep_id" class="text-[9px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded uppercase tracking-wider">Titipan</span>
                  </td>
                  
                  <td class="p-4 text-right whitespace-nowrap">
                    <span class="font-black text-blue-700 text-base">Rp {{ formatRp(b.HargaDefault) }}</span>
                  </td>
                  
                  <td class="p-4 pl-8 whitespace-nowrap">
                    <div class="flex flex-col gap-2">
                      <div v-if="b.resep_id" class="flex items-center gap-2">
                         <span class="text-orange-500 text-sm">🥣</span>
                         <div class="bg-orange-50 border border-orange-200 rounded px-2 py-1 flex items-center gap-2">
                            <span class="text-[11px] font-bold text-orange-900">{{ b.resep?.nama_resep || 'Resep Terhapus' }}</span>
                            <span class="text-[10px] font-black text-orange-700 border-l border-orange-200 pl-2">{{ b.kebutuhan_adonan }} {{ b.metode_konversi }}</span>
                            <span class="text-[10px] font-bold text-gray-500 border-l border-orange-200 pl-2">Exp: {{ b.masa_simpan }} Hr</span>
                         </div>
                      </div>
                      
                      <div v-if="b.kemasan_detail && b.kemasan_detail.length > 0" class="flex items-start gap-2">
                         <span class="text-purple-500 text-sm mt-0.5">📦</span>
                         <div class="flex flex-wrap gap-1.5">
                            <span v-for="kd in b.kemasan_detail" :key="kd.ID" class="bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-purple-800">
                               {{ kd.bahan?.nama_bahan }} (x{{ kd.kebutuhan }})
                            </span>
                         </div>
                      </div>
                    </div>
                  </td>
                  
                  <td class="p-4 text-center whitespace-nowrap">
                      <div class="flex justify-center gap-1.5">
                          <button @click="editBarang(b)" class="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded font-bold transition-colors">Edit</button>
                          <button @click="hapusBarang(b.ID)" class="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded font-bold transition-colors">Del</button>
                      </div>
                  </td>
              </tr>
          </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>