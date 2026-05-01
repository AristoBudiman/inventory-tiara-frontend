<script setup>
import { ref, onMounted } from 'vue'

const listResep = ref([])
const listBahan = ref([]) // Untuk dropdown
const isEdit = ref(false)

const formResep = ref({
  ID: null,
  nama_resep: '',
  target_gramasi: 0,
  bahan_detail: [{ bahan_id: '', kebutuhan: 0 }]
})

const fetchBahan = async () => {
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers: { 'Authorization': `Bearer ${token}` }})
  if (res.ok) listBahan.value = await res.json()
}

const fetchResep = async () => {
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resep`, { headers: { 'Authorization': `Bearer ${token}` }})
  if (res.ok) listResep.value = await res.json()
}

// LOGIKA DYNAMIC FORM KOMPOSISI
const tambahBarisBahan = () => {
  formResep.value.bahan_detail.push({ bahan_id: '', kebutuhan: 0 })
}
const hapusBarisBahan = (idx) => {
  formResep.value.bahan_detail.splice(idx, 1)
}

const simpanResep = async () => {
  if (formResep.value.bahan_detail.length === 0) return alert('Resep minimal butuh 1 bahan!')
  
  // Validasi agar tidak ada bahan id kosong
  const invalid = formResep.value.bahan_detail.find(b => !b.bahan_id || b.kebutuhan <= 0)
  if(invalid) return alert('Pastikan semua baris bahan dipilih dan gramasinya lebih dari 0!')

  const method = isEdit.value ? 'PUT' : 'POST'
  const url = isEdit.value 
    ? `${import.meta.env.VITE_API_URL}/api/resep/${formResep.value.ID}` 
    : `${import.meta.env.VITE_API_URL}/api/resep`
    
  const token = localStorage.getItem('inventory_token')
  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(formResep.value)
  })
  
  resetForm()
  fetchResep()
}

const editResep = (r) => {
  isEdit.value = true
  formResep.value = {
    ID: r.ID,
    nama_resep: r.nama_resep,
    target_gramasi: r.target_gramasi,
    bahan_detail: r.bahan_detail.map(d => ({
      bahan_id: d.bahan_id,
      kebutuhan: d.kebutuhan
    }))
  }
}

const hapusResep = async (id) => {
  if(confirm('Hapus Resep ini ke tempat sampah?')) {
    const token = localStorage.getItem('inventory_token')
    await fetch(`${import.meta.env.VITE_API_URL}/api/resep/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
    fetchResep()
  }
}

const resetForm = () => {
  isEdit.value = false
  formResep.value = { ID: null, nama_resep: '', target_gramasi: 0, bahan_detail: [{ bahan_id: '', kebutuhan: 0 }] }
}

onMounted(() => {
  fetchBahan()
  fetchResep()
})
</script>

<template>
  <div class="p-8 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Kelola Buku Resep Produksi</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- FORM INPUT RESEP (Kiri) -->
      <div class="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-blue-200 self-start sticky top-6">
        <h2 class="text-lg font-black text-blue-900 mb-4 border-b pb-2 flex items-center gap-2">
          <span>🥣</span> {{ isEdit ? 'Edit Resep' : 'Racik Resep Baru' }}
        </h2>
        
        <form @submit.prevent="simpanResep" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">Nama Resep</label>
            <input v-model="formResep.nama_resep" type="text" required placeholder="ex: Adonan Manis Spesial" class="w-full border-2 rounded p-2 focus:border-blue-500 font-bold outline-none bg-gray-50">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">Target Total Hasil Adonan (Gram/Pcs)</label>
            <input v-model.number="formResep.target_gramasi" type="number" required min="1" step="any" placeholder="Prediksi matang..." class="w-full border-2 rounded p-2 focus:border-blue-500 font-black text-blue-700 outline-none bg-blue-50">
            <p class="text-[10px] text-gray-400 mt-1">*Berapa gram adonan yang dihasilkan jika memasak 1 resep ini penuh.</p>
          </div>

          <div class="bg-gray-100 p-3 rounded-lg border">
            <div class="flex justify-between items-center mb-2">
                <label class="block text-xs font-black text-gray-700">Komposisi Bahan</label>
                <button type="button" @click="tambahBarisBahan" class="text-[10px] font-bold text-blue-600 hover:bg-blue-100 px-2 py-1 rounded">+ Tambah Bahan</button>
            </div>
            
            <div class="space-y-2 max-h-64 overflow-y-auto pr-2">
              <div v-for="(b, idx) in formResep.bahan_detail" :key="idx" class="flex gap-2 items-center bg-white p-2 rounded shadow-sm border">
                <select v-model="b.bahan_id" required class="w-full text-xs border rounded p-1 font-bold outline-none truncate">
                  <option value="" disabled>Pilih Bahan</option>
                  <option v-for="mb in listBahan" :key="mb.ID" :value="mb.ID">{{ mb.nama_bahan }}</option>
                </select>
                <input v-model.number="b.kebutuhan" type="number" required min="0.01" step="any" placeholder="Qty" class="w-20 text-xs border rounded p-1 text-center font-bold outline-none">
                <button type="button" @click="hapusBarisBahan(idx)" class="text-red-500 font-bold text-lg leading-none hover:text-red-700 px-1">×</button>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
             <button v-if="isEdit" type="button" @click="resetForm" class="px-4 py-2 font-bold text-gray-500 text-sm">Batal</button>
             <button type="submit" class="bg-blue-600 w-full text-white px-6 py-3 rounded-lg font-black shadow-md hover:bg-blue-700 transition">
               {{ isEdit ? 'Simpan Update' : 'Simpan Resep' }}
             </button>
          </div>
        </form>
      </div>

      <!-- LIST RESEP TERDAFTAR (Kanan) -->
      <div class="lg:col-span-2 space-y-4">
        <div v-for="r in listResep" :key="r.ID" class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
          <div class="bg-gray-800 px-5 py-3 flex justify-between items-center text-white">
            <div>
                <h3 class="font-black text-lg text-yellow-400">{{ r.nama_resep }}</h3>
                <p class="text-xs font-medium text-gray-300">Target Produksi: <span class="font-bold text-white">{{ r.target_gramasi }}</span></p>
            </div>
            <div class="flex gap-3 text-sm">
                <button @click="editResep(r)" class="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded font-bold shadow">Edit</button>
                <button @click="hapusResep(r.ID)" class="bg-red-600 hover:bg-red-500 px-3 py-1 rounded font-bold shadow">Hapus</button>
            </div>
          </div>
          <div class="p-5 bg-gray-50 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
             <!-- Looping komposisi -->
             <div v-for="bd in r.bahan_detail" :key="bd.ID" class="bg-white border rounded p-2 text-center shadow-sm">
                 <p class="text-xs text-gray-500 font-bold truncate">{{ bd.bahan.nama_bahan }}</p>
                 <p class="text-sm font-black text-blue-800">{{ bd.kebutuhan }} <span class="text-[10px] text-gray-400">{{ bd.bahan.satuan }}</span></p>
             </div>
          </div>
        </div>
        <div v-if="listResep.length === 0" class="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 font-bold">
            Belum ada resep yang diracik.
        </div>
      </div>

    </div>
  </div>
</template>