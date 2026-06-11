<script setup>
import { ref, onMounted, computed } from 'vue'
import { Scissors } from 'lucide-vue-next'

const isLoading = ref(false)
const riwayat = ref([])
const listBahan = ref([])

const getToday = () => {
    const today = new Date()
    const offset = today.getTimezoneOffset() * 60000
    return new Date(today - offset).toISOString().split('T')[0]
}

const today = new Date()
const offset = today.getTimezoneOffset() * 60000
const localTodayStr = new Date(today - offset).toISOString().split('T')[0]
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
const localFirstDayStr = new Date(firstDay - offset).toISOString().split('T')[0]

const startHistoryDate = ref(localFirstDayStr)
const endHistoryDate = ref(localTodayStr)

const form = ref({
  tanggal: getToday(),
  bahan_asal_id: '',
  qty_asal: 1,
  keterangan: 'Pecah Barang',
  details: [{ bahan_hasil_id: '', qty_hasil: 1 }]
})

const fetchAwal = async () => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('inventory_token')
    const headers = { 'Authorization': `Bearer ${token}` }
    
    let historyUrl = `${import.meta.env.VITE_API_URL}/api/inventory/pecah-barang`
    if (startHistoryDate.value && endHistoryDate.value) {
      historyUrl += `?start_date=${startHistoryDate.value}&end_date=${endHistoryDate.value}`
    }

    const [resBahan, resRiwayat] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers }),
      fetch(historyUrl, { headers })
    ])

    if(resBahan.ok) listBahan.value = await resBahan.json()
    if(resRiwayat.ok) riwayat.value = await resRiwayat.json()
  } catch (error) {
    console.error("Gagal menarik data:", error)
  } finally {
    isLoading.value = false
  }
}

const addDetailRow = () => {
  form.value.details.push({ bahan_hasil_id: '', qty_hasil: 1 })
}

const removeDetailRow = (index) => {
  form.value.details.splice(index, 1)
}

const submitForm = async () => {
  if (!form.value.bahan_asal_id) return window.$dialog.alert('Pilih bahan sumber terlebih dahulu!')
  if (form.value.details.length === 0) return window.$dialog.alert('Tambahkan minimal 1 hasil pecahan!')
  
  // Validasi bahan hasil terisi semua
  for (let d of form.value.details) {
      if (!d.bahan_hasil_id) return window.$dialog.alert('Ada kolom hasil pecahan yang belum dipilih bahannya.')
  }

  try {
    const token = localStorage.getItem('inventory_token')
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/pecah-barang`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
          tanggal: form.value.tanggal,
          bahan_asal_id: parseInt(form.value.bahan_asal_id),
          qty_asal: parseFloat(form.value.qty_asal),
          keterangan: form.value.keterangan,
          details: form.value.details.map(d => ({
              bahan_hasil_id: parseInt(d.bahan_hasil_id),
              qty_hasil: parseFloat(d.qty_hasil)
          }))
      })
    })

    if (res.ok) {
      window.$dialog.alert('Pecah barang berhasil disimpan!')
      // Reset form
      form.value.bahan_asal_id = ''
      form.value.qty_asal = 1
      form.value.details = [{ bahan_hasil_id: '', qty_hasil: 1 }]
      fetchAwal()
    } else {
      const err = await res.json()
      window.$dialog.alert('Gagal: ' + err.error)
    }
  } catch(e) {
      window.$dialog.alert('Terjadi kesalahan jaringan')
  }
}

const deleteRiwayat = async (id) => {
    if(!await window.$dialog.confirm('Yakin ingin membatalkan konversi ini? Stok akan dikembalikan seperti semula.')) return
    
    try {
        const token = localStorage.getItem('inventory_token')
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/pecah-barang/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if(res.ok) {
            window.$dialog.alert('Konversi dibatalkan, stok berhasil dipulihkan.')
            fetchAwal()
        } else {
            const err = await res.json()
            window.$dialog.alert('Gagal batal: ' + err.error)
        }
    } catch(e) {
        console.error(e)
    }
}

onMounted(fetchAwal)
</script>

<template>
  <div class="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    
    <div class="mb-6 border-b pb-4">
      <h1 class="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2"><Scissors :size="32" /> Pecah Barang (Konversi)</h1>
      <p class="text-sm text-gray-500 font-medium mt-1">Gunakan fitur ini untuk menukar 1 barang utuh menjadi banyak potongan (Misal: Kertas Utuh dipotong jadi 12x12 dan 20x20).</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-indigo-50 border-b border-indigo-100 p-4">
            <h2 class="font-bold text-indigo-800 flex items-center gap-2">
                Formulir Potong Barang
            </h2>
        </div>
        <div class="p-6 space-y-6">
            <!-- SUMBER -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                <div class="md:col-span-1">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal</label>
                    <input type="date" v-model="form.tanggal" class="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500 font-medium">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Barang Sumber (Yg Dikorbankan)</label>
                    <select v-model="form.bahan_asal_id" class="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500 font-bold bg-white">
                        <option value="">-- Pilih Barang Utuh --</option>
                        <option v-for="b in listBahan" :key="b.ID" :value="b.ID">
                            {{ b.nama_bahan }} (Sisa: {{ b.stok }} {{ b.satuan }})
                        </option>
                    </select>
                </div>
                <div class="md:col-span-1">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Jumlah</label>
                    <div class="flex gap-2">
                        <input type="number" v-model="form.qty_asal" min="0.01" step="any" class="w-full border-gray-300 rounded-lg p-2 text-sm font-black focus:ring-indigo-500">
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-center my-2">
                <div class="bg-indigo-100 text-indigo-500 rounded-full p-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </div>
            </div>

            <!-- HASIL -->
            <div class="space-y-3">
                <label class="block text-xs font-bold text-gray-500 uppercase">Menghasilkan Pecahan Berikut:</label>
                
                <div v-for="(detail, idx) in form.details" :key="idx" class="flex flex-col sm:flex-row gap-3 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative">
                    <div class="w-full sm:flex-1">
                        <select v-model="detail.bahan_hasil_id" class="w-full border-gray-300 rounded-lg p-2 text-sm font-semibold bg-gray-50 focus:bg-white focus:ring-emerald-500 transition-colors">
                            <option value="">-- Pilih Barang Potongan --</option>
                            <option v-for="b in listBahan" :key="b.ID" :value="b.ID">
                                {{ b.nama_bahan }}
                            </option>
                        </select>
                    </div>
                    <div class="w-full sm:w-1/4 flex items-center gap-2">
                        <span class="text-xs font-bold text-gray-400">SEBANYAK</span>
                        <input type="number" v-model="detail.qty_hasil" min="0.01" step="any" class="w-full border-gray-300 rounded-lg p-2 text-sm font-black text-emerald-600 focus:ring-emerald-500">
                    </div>
                    <button @click="removeDetailRow(idx)" class="absolute -right-2 -top-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1.5 transition-colors sm:static sm:bg-transparent sm:hover:bg-gray-100 sm:text-gray-400 sm:hover:text-red-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <button @click="addDetailRow" type="button" class="mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-1 border border-dashed border-indigo-200">
                    + Tambah Jenis Potongan Lain
                </button>
            </div>

            <div class="pt-4 border-t border-gray-100 flex justify-end">
                <button @click="submitForm" class="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-md transition-transform active:scale-95 text-sm flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    Simpan & Update Stok
                </button>
            </div>
        </div>
    </div>

    <!-- RIWAYAT -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-5 bg-gray-50 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 class="font-black text-gray-700 tracking-tight uppercase text-xs">Riwayat Konversi Barang</h3>
          <div class="flex items-center gap-2">
            <input type="date" v-model="startHistoryDate" @change="fetchAwal" class="text-xs border-gray-300 rounded p-1.5 focus:ring-indigo-500">
            <span class="text-gray-400 font-bold">-</span>
            <input type="date" v-model="endHistoryDate" @change="fetchAwal" class="text-xs border-gray-300 rounded p-1.5 focus:ring-indigo-500">
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-gray-100 text-gray-500 uppercase text-[10px] tracking-widest font-bold">
              <tr>
                <th class="p-4 w-32">Tanggal</th>
                <th class="p-4">Dikorbankan (Utuh)</th>
                <th class="p-4">Hasil Pecahan (Potongan)</th>
                <th class="p-4 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="riwayat.length === 0">
                <td colspan="4" class="p-8 text-center text-gray-400 font-bold italic">Belum ada riwayat konversi.</td>
              </tr>
              <tr v-for="r in riwayat" :key="r.ID" class="hover:bg-indigo-50/30 transition">
                <td class="p-4 text-xs font-semibold text-gray-600">{{ r.tanggal.split('T')[0] }}</td>
                <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        - {{ r.qty_asal }} {{ r.bahan_asal?.satuan }} {{ r.bahan_asal?.nama_bahan }}
                    </span>
                </td>
                <td class="p-4">
                    <div class="flex flex-wrap gap-2">
                        <span v-for="d in r.details" :key="d.ID" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            + {{ d.qty_hasil }} {{ d.bahan_hasil?.satuan }} {{ d.bahan_hasil?.nama_bahan }}
                        </span>
                    </div>
                </td>
                <td class="p-4 text-center">
                    <button @click="deleteRiwayat(r.ID)" class="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Batal & Kembalikan Stok">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
