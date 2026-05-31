<script setup>
import { ref, onMounted } from 'vue'

const listKomposit = ref([])
const listBahan = ref([])
const showModal = ref(false)
const isEdit = ref(false)

const form = ref({
  id: null,
  nama_komposit: '',
  details: []
})

const fetchMasterData = async () => {
  const token = localStorage.getItem('inventory_token')
  const headers = { 'Authorization': `Bearer ${token}` }
  
  try {
    const [resKomp, resBahan] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/komposit`, { headers }),
      fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers })
    ])
    
    if (resKomp.ok) listKomposit.value = await resKomp.json() || []
    if (resBahan.ok) listBahan.value = await resBahan.json() || []
  } catch (err) {
    console.error("Gagal menarik data:", err)
  }
}

const tambahBahan = () => {
  form.value.details.push({ bahan_id: '', rasio: 1 })
}

const hapusBahan = (index) => {
  form.value.details.splice(index, 1)
}

const simpanKomposit = async () => {
  if (form.value.details.length === 0) return alert('Pilih minimal 1 bahan untuk komposit ini!')
  
  const token = localStorage.getItem('inventory_token')
  const url = isEdit.value 
    ? `${import.meta.env.VITE_API_URL}/api/komposit/${form.value.id}`
    : `${import.meta.env.VITE_API_URL}/api/komposit`
  
  const method = isEdit.value ? 'PUT' : 'POST'

  const payload = {
    nama_komposit: form.value.nama_komposit,
    details: form.value.details.map(d => ({
      bahan_id: Number(d.bahan_id),
      rasio: Number(d.rasio)
    }))
  }

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  })

  if (res.ok) {
    alert(isEdit.value ? 'Komposit diupdate!' : 'Komposit berhasil dibuat!')
    showModal.value = false
    fetchMasterData()
  } else {
    alert('Gagal menyimpan komposit.')
  }
}

const bukaModalTambah = () => {
  isEdit.value = false
  form.value = { id: null, nama_komposit: '', details: [{ bahan_id: '', rasio: 1 }] }
  showModal.value = true
}

const editKomposit = (k) => {
  isEdit.value = true
  form.value = {
    id: k.id,
    nama_komposit: k.nama_komposit,
    details: k.details.map(d => ({ bahan_id: d.bahan_id, rasio: d.rasio }))
  }
  showModal.value = true
}

const hapusKomposit = async (id) => {
  if (confirm('Buang Master Komposit ini ke tempat sampah?')) {
    const token = localStorage.getItem('inventory_token')
    await fetch(`${import.meta.env.VITE_API_URL}/api/komposit/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchMasterData()
  }
}

onMounted(fetchMasterData)
</script>

<template>
  <div class="p-8 max-w-5xl mx-auto animate-fade-in">
    <div class="flex items-center justify-between border-b-2 border-gray-200 pb-4 mb-6">
      <div>
        <h1 class="text-3xl font-black text-gray-800 tracking-tight">🧈 Master Komposit</h1>
        <p class="text-sm text-gray-500 font-medium mt-1">Kelola formula rasio barang setengah jadi (Pre-mix, Campuran Butter, Isian Coklat).</p>
      </div>
      <button @click="bukaModalTambah" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2">
        ➕ Buat Komposit
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-100 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-[10px] font-black">
          <tr>
            <th class="p-4">Nama Komposit</th>
            <th class="p-4">Rincian Komposisi (Rasio)</th>
            <th class="p-4 text-center w-32">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="listKomposit.length === 0">
            <td colspan="3" class="p-8 text-center text-gray-400 font-bold">Belum ada data komposit.</td>
          </tr>
          <tr v-for="k in listKomposit" :key="k.id" class="hover:bg-blue-50/30 transition-colors">
            <td class="p-4 font-black text-gray-800 text-base">{{ k.nama_komposit }}</td>
            <td class="p-4">
              <div class="flex flex-wrap gap-2">
                <span v-for="d in k.details" :key="d.id" class="bg-yellow-50 border border-yellow-200 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded">
                  {{ d.bahan?.nama_bahan }} <span class="text-yellow-600 ml-1 font-black">(Rasio: {{ d.rasio }})</span>
                </span>
              </div>
            </td>
            <td class="p-4 text-center">
              <div class="flex justify-center gap-2">
                <button @click="editKomposit(k)" class="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded font-bold hover:bg-blue-200 transition-colors">Edit</button>
                <button @click="hapusKomposit(k.id)" class="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded font-bold hover:bg-red-200 transition-colors">Del</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div class="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl border-t-8 border-yellow-400">
        <h2 class="text-xl font-black text-gray-800 mb-6">{{ isEdit ? '✏️ Edit Komposit' : '✨ Buat Komposit Baru' }}</h2>
        
        <form @submit.prevent="simpanKomposit" class="space-y-5">
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Komposit (Pre-mix)</label>
            <input v-model="form.nama_komposit" type="text" required placeholder="Contoh: Butter Kombinasi Premium" class="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:border-yellow-500 font-bold outline-none text-gray-800 bg-white">
          </div>

          <div class="bg-yellow-50/50 p-4 rounded-xl border border-yellow-200">
            <div class="flex justify-between items-center mb-3 border-b border-yellow-200 pb-2">
              <label class="block text-xs font-black text-yellow-800 uppercase tracking-wider">Formula / Rasio Bahan</label>
              <button type="button" @click="tambahBahan" class="text-[10px] font-bold bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-3 py-1.5 rounded shadow-sm transition-colors">+ Tambah Bahan</button>
            </div>

            <div class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              <div v-for="(d, index) in form.details" :key="index" class="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                <select v-model="d.bahan_id" required class="flex-1 border-none bg-transparent font-bold text-sm outline-none text-gray-800 cursor-pointer">
                  <option value="" disabled>Pilih Bahan Baku...</option>
                  <option v-for="b in listBahan" :key="b.ID" :value="b.ID">{{ b.nama_bahan }} ({{ b.satuan }})</option>
                </select>
                <div class="w-px h-6 bg-gray-200"></div>
                <div class="flex items-center">
                  <span class="text-[10px] font-bold text-gray-400 mr-2 uppercase tracking-widest">Rasio:</span>
                  <input v-model.number="d.rasio" type="number" step="any" min="0.01" required class="w-20 border border-gray-300 bg-gray-50 rounded p-1.5 text-center font-black text-sm outline-none focus:border-yellow-500 text-yellow-700">
                </div>
                <button type="button" @click="hapusBahan(index)" class="text-red-400 hover:text-red-600 font-bold text-2xl leading-none px-2 ml-1">×</button>
              </div>
            </div>
            
            <p class="text-[10px] font-bold text-yellow-700 mt-3 flex items-center gap-1">
              <span>💡</span> Angka rasio bebas (misal: 4, 2, 7). Sistem otomatis menghitung pecahannya.
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" @click="showModal = false" class="px-5 py-2 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Batal</button>
            <button type="submit" class="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-bold shadow-md transition-colors">
              {{ isEdit ? 'Simpan Perubahan' : 'Simpan Komposit' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>