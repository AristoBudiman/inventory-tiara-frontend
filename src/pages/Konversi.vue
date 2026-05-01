<script setup>
import { ref, onMounted } from 'vue'

const getToday = () => new Date().toISOString().split('T')[0]
const tanggal = ref(getToday())

const listProduk = ref([]) 
const sisaKemarinMap = ref({})
const hasilRekapResep = ref([]) // Wadah untuk instruksi akhir koki
const isDihitung = ref(false)

const fetchAwal = async () => {
  const token = localStorage.getItem('inventory_token') // Pastikan sudah diganti ke inventory_token
  const headers = { 'Authorization': `Bearer ${token}` }
  
  const [resB, resS] = await Promise.all([
    fetch(`${import.meta.env.VITE_API_URL}/api/barangs`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/konversi/sisa-kemarin?tanggal=${tanggal.value}`, { headers })
  ])

  if(resB.ok) {
    const semuaBarang = await resB.json()
    // Saring HANYA barang yang terikat dengan resep dapur
    listProduk.value = semuaBarang
      .filter(b => b.resep_id !== null)
      .map(b => ({
        ...b,
        input_target: 0, // State reaktif untuk form input
        target_bersih: 0 // Hasil setelah dikurangi sisa
      }))
  }

  if(resS.ok) {
    const sisaData = await resS.json()
    sisaKemarinMap.value = sisaData.reduce((map, item) => {
      map[item.barang_id] = item.qty_sisa
      return map
    }, {})
  }
}

// FUNGSI SAPU JAGAT: Hitung Semua Produk -> Konversi ke Resep
const hitungSemuaKonversi = () => {
  // Objek untuk mengumpulkan gramasi berdasarkan ID Resep
  let rekapMangkuk = {} 

  listProduk.value.forEach(p => {
    const target = p.input_target || 0
    const sisa = sisaKemarinMap.value[p.ID] || 0
    
    // Target bersih tidak boleh minus
    const bersih = Math.max(0, target - sisa)
    p.target_bersih = bersih // Simpan untuk ditampilkan di UI

    if(bersih > 0) {
      // Jika butuh diproduksi, masukkan ke dalam mangkuk resep yang sesuai
      if(!rekapMangkuk[p.resep_id]) {
        rekapMangkuk[p.resep_id] = {
          nama_resep: p.resep?.nama_resep || 'Resep Tidak Diketahui',
          target_gram_per_resep: p.resep?.target_gramasi || 1,
          total_kebutuhan_adonan: 0,
          daftar_roti: [] // Untuk rincian
        }
      }

      // Akumulasi kebutuhan adonan (Misal: 100 Roti Cokelat x 60gr = 6000gr)
      const totalBebanBarang = bersih * p.kebutuhan_adonan
      rekapMangkuk[p.resep_id].total_kebutuhan_adonan += totalBebanBarang
      
      // Catat rincian untuk diperlihatkan ke koki
      rekapMangkuk[p.resep_id].daftar_roti.push(`${bersih} Pcs ${p.NamaBarang}`)
    }
  })

  // Ubah objek rekap menjadi array agar mudah di-looping di UI
  hasilRekapResep.value = Object.values(rekapMangkuk).map(resep => {
    return {
      nama_resep: resep.nama_resep,
      detail_roti: resep.daftar_roti.join(', '),
      total_adonan_gram: resep.total_kebutuhan_adonan,
      // Hitung Batch: Total Butuh / Target Gram per Resep
      rekomendasi_batch: (resep.total_kebutuhan_adonan / resep.target_gram_per_resep).toFixed(2)
    }
  })

  isDihitung.value = true
}

onMounted(fetchAwal)
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <div class="bg-white p-8 rounded-xl shadow-lg border-t-8 border-yellow-400 mb-8">
      <h1 class="text-3xl font-black text-gray-900 mb-2">🌤️ Kalkulator Produksi Pagi (Input Massal)</h1>
      <p class="text-gray-500 font-bold mb-6 border-b pb-4">Masukkan target total orderan hari ini. Sistem akan memotong sisa kemarin dan merangkum perintah masak untuk dapur.</p>

      <form @submit.prevent="hitungSemuaKonversi">
        <div class="overflow-x-auto mb-6 border border-gray-200 rounded-lg">
          <table class="w-full text-sm text-left">
            <thead class="bg-gray-100 text-gray-700">
              <tr>
                <th class="p-3 font-bold border-r">Nama Produk</th>
                <th class="p-3 font-bold border-r">Tipe Adonan</th>
                <th class="p-3 font-bold text-center border-r text-blue-700 bg-blue-50">Sisa Kemarin</th>
                <th class="p-3 font-bold text-center border-r">Target Order Pcs</th>
                <th class="p-3 font-bold text-center text-green-700 bg-green-50">Harus Cetak (Netto)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in listProduk" :key="b.ID" class="border-b hover:bg-yellow-50 transition">
                <td class="p-3 font-bold text-gray-800 border-r">{{ b.NamaBarang }}</td>
                <td class="p-3 text-xs text-gray-500 font-bold border-r">{{ b.resep?.nama_resep }}</td>
                
                <!-- Info Sisa Kemarin -->
                <td class="p-3 text-center font-black text-blue-800 bg-blue-50 border-r">
                   {{ sisaKemarinMap[b.ID] || 0 }}
                </td>

                <!-- Input Field Target Pcs -->
                <td class="p-3 border-r bg-yellow-50/30">
                  <input v-model.number="b.input_target" type="number" min="0" class="w-24 mx-auto block text-center border-2 border-yellow-400 rounded p-1.5 font-black outline-none focus:bg-yellow-100 transition">
                </td>

                <!-- Indikator Target Bersih (Live / Setelah Hitung) -->
                <td class="p-3 text-center font-black text-green-700 bg-green-50">
                  <span v-if="isDihitung">{{ b.target_bersih }} Pcs</span>
                  <span v-else class="text-gray-400 font-medium text-xs">Hitung Dulu</span>
                </td>
              </tr>
              <tr v-if="listProduk.length === 0">
                <td colspan="5" class="p-6 text-center text-gray-400 italic font-bold">Tidak ada produk yang terikat ke Resep.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end">
           <button type="submit" class="bg-yellow-500 text-yellow-950 px-10 py-4 rounded-xl font-black shadow-lg hover:bg-yellow-400 transition text-lg flex items-center gap-2">
             🧮 KALKULASI REKAP DAPUR
           </button>
        </div>
      </form>
    </div>

    <!-- HASIL REKAP UNTUK KOKI (Muncul Setelah Hitung) -->
    <div v-if="isDihitung" class="bg-gray-900 rounded-xl p-8 shadow-2xl border-2 border-gray-800 animate-fade-in">
      <h2 class="text-2xl font-black text-yellow-400 mb-6 border-b border-gray-700 pb-3 flex items-center gap-3">
        <span>👨‍🍳</span> Instruksi Masak Untuk Koki Hari Ini:
      </h2>

      <div v-if="hasilRekapResep.length === 0" class="text-center p-8 bg-gray-800 rounded-lg text-green-400 font-bold">
         Luar Biasa! Sisa kemarin masih cukup untuk memenuhi order hari ini. Dapur libur masak adonan!
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="(resep, idx) in hasilRekapResep" :key="idx" class="bg-gray-800 p-5 rounded-xl border border-gray-700 relative overflow-hidden">
           <div class="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
           
           <h3 class="font-black text-white text-lg mb-1">{{ resep.nama_resep }}</h3>
           <p class="text-xs text-gray-400 font-bold mb-4 line-clamp-2">Peruntukan: {{ resep.detail_roti }}</p>
           
           <div class="bg-gray-900 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
             <div>
               <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Gramasi</p>
               <p class="font-black text-blue-400">{{ resep.total_adonan_gram.toLocaleString() }} <span class="text-xs font-normal">gr</span></p>
             </div>
             <div class="text-right">
               <p class="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">Perintah Masak</p>
               <p class="font-black text-yellow-400 text-2xl leading-none">{{ resep.rekomendasi_batch }}<span class="text-sm font-bold">x</span></p>
             </div>
           </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>