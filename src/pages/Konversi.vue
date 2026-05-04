<script setup>
import { ref, onMounted } from 'vue'

const getToday = () => new Date().toISOString().split('T')[0]
const tanggal = ref(getToday())

const listProduk = ref([]) 
const sisaKemarinMap = ref({})
const hasilRekapResep = ref([])
const isDihitung = ref(false)
const listResep = ref([]) 
const listBahan = ref([]) 
const peringatanStok = ref([])

const fetchAwal = async () => {
  const token = localStorage.getItem('inventory_token')
  const headers = { 'Authorization': `Bearer ${token}` }
  
  const [resB, resS, resResep, resBahan] = await Promise.all([
    fetch(`${import.meta.env.VITE_API_URL}/api/barangs`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/konversi/sisa-kemarin?tanggal=${tanggal.value}`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/resep`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers }) 
  ])

  if(resResep.ok) listResep.value = await resResep.json()
  if(resBahan.ok) listBahan.value = await resBahan.json()

  if(resB.ok) {
    const semuaBarang = await resB.json()
    listProduk.value = semuaBarang.filter(b => b.resep_id !== null).map(b => ({ ...b, input_target: 0, target_bersih: 0 }))
  }

  if(resS.ok) {
    const sisaData = await resS.json()
    sisaKemarinMap.value = sisaData.reduce((map, item) => {
      map[item.barang_id] = (map[item.barang_id] || 0) + item.qty_sisa
      return map
    }, {})
  }
}

const hitungSemuaKonversi = () => {
  let rekapMangkuk = {} 
  listProduk.value.forEach(p => {
    const target = p.input_target || 0
    const sisa = sisaKemarinMap.value[p.ID] || 0
    const bersih = Math.max(0, target - sisa)
    p.target_bersih = bersih 

    if(bersih > 0) {
      if(!rekapMangkuk[p.resep_id]) {
        rekapMangkuk[p.resep_id] = { nama_resep: p.resep?.nama_resep || 'Resep Unknown', target_gram_per_resep: p.resep?.target_gramasi || 1, total_kebutuhan_adonan: 0, daftar_roti: [] }
      }
      rekapMangkuk[p.resep_id].total_kebutuhan_adonan += (bersih * p.kebutuhan_adonan)
      rekapMangkuk[p.resep_id].daftar_roti.push(`${bersih} Pcs ${p.NamaBarang}`)
    }
  })

  hasilRekapResep.value = Object.values(rekapMangkuk).map(resep => {
    const rawBatch = resep.total_kebutuhan_adonan / resep.target_gram_per_resep
    const finalBatch = Math.ceil(rawBatch * 4) / 4
    return { nama_resep: resep.nama_resep, detail_roti: resep.daftar_roti.join(', '), total_adonan_gram: resep.total_kebutuhan_adonan, rekomendasi_batch: finalBatch }
  })

  isDihitung.value = true

  const bahanDibutuhkan = {}
  peringatanStok.value = []

  hasilRekapResep.value.forEach(r => {
    const resepAsli = listResep.value.find(x => x.nama_resep === r.nama_resep)
    const batch = parseFloat(r.rekomendasi_batch)
    resepAsli.bahan_detail.forEach(bd => {
        if(!bahanDibutuhkan[bd.bahan_id]) bahanDibutuhkan[bd.bahan_id] = 0
        bahanDibutuhkan[bd.bahan_id] += (bd.kebutuhan * batch)
    })
  })

  Object.keys(bahanDibutuhkan).forEach(id => {
    const bahanAsli = listBahan.value.find(b => b.ID == id)
    if (bahanAsli && bahanDibutuhkan[id] > bahanAsli.stok) {
        peringatanStok.value.push(`Kekurangan ${bahanAsli.nama_bahan}! (Butuh: ${bahanDibutuhkan[id].toFixed(1)} ${bahanAsli.satuan} | Sisa: ${bahanAsli.stok} ${bahanAsli.satuan})`)
    }
  })
}

onMounted(fetchAwal)
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    
    <!-- KOTAK KALKULATOR -->
    <div class="bg-white p-8 rounded-2xl shadow-md border-t-8 border-yellow-400">
      <div class="mb-8">
        <h1 class="text-3xl font-black text-gray-800 tracking-tight">🌤️ Kalkulator Produksi Pagi</h1>
        <p class="text-sm text-gray-500 font-medium mt-1">Masukkan target total orderan. Sistem akan otomatis memotong sisa layak jual dari kemarin.</p>
      </div>

      <form @submit.prevent="hitungSemuaKonversi">
        <div class="border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
          <table class="w-full text-left">
            <thead class="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs">Produk</th>
                <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs border-x border-gray-200 text-center bg-blue-50/50 w-32">Sisa Kemarin</th>
                <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs text-center w-40">Target Pcs</th>
                <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs border-l border-gray-200 text-center bg-green-50/50 w-40">Netto (Cetak)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="b in listProduk" :key="b.ID" class="hover:bg-yellow-50/50 transition-colors">
                <td class="p-4">
                  <p class="font-bold text-gray-800 text-base">{{ b.NamaBarang }}</p>
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{{ b.resep?.nama_resep }}</p>
                </td>
                
                <td class="p-4 text-center border-x border-gray-100 bg-blue-50/30">
                   <span class="font-black text-blue-700 text-xl">{{ sisaKemarinMap[b.ID] || 0 }}</span>
                </td>

                <td class="p-4 bg-yellow-50/20">
                  <input v-model.number="b.input_target" type="number" min="0" class="w-24 mx-auto block text-center border-2 border-yellow-300 rounded-lg p-2 font-black outline-none focus:border-yellow-500 focus:bg-yellow-50 text-gray-800 transition-colors shadow-sm">
                </td>

                <td class="p-4 text-center border-l border-gray-100 bg-green-50/30">
                  <div v-if="isDihitung" class="font-black text-green-700 text-xl">{{ b.target_bersih }}</div>
                  <div v-else class="text-xs font-bold text-gray-400 uppercase">Menunggu</div>
                </td>
              </tr>
              <tr v-if="listProduk.length === 0">
                <td colspan="4" class="p-8 text-center text-gray-400 font-bold bg-gray-50">Katalog Produk Kosong.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col md:flex-row items-end justify-end gap-4">
           <!-- ALERT STOK -->
           <div v-if="peringatanStok.length > 0" class="flex-1 w-full bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm animate-pulse">
             <h4 class="text-red-700 font-black text-sm mb-2 flex items-center gap-2">⚠️ BAHAN MENTAH TIDAK MENCUKUPI:</h4>
             <ul class="list-disc list-inside text-xs font-bold text-red-600 space-y-1">
                <li v-for="(alert, idx) in peringatanStok" :key="idx">{{ alert }}</li>
             </ul>
           </div>

           <button type="submit" class="bg-gray-900 hover:bg-black text-yellow-400 px-8 py-4 rounded-xl font-black shadow-lg transition-transform active:scale-95 text-lg whitespace-nowrap border-2 border-transparent hover:border-yellow-400">
             🧮 KALKULASI DAPUR
           </button>
        </div>
      </form>
    </div>

    <!-- HASIL REKAP (MUNCUL JIKA DIHITUNG) -->
    <div v-if="isDihitung" class="bg-slate-900 rounded-2xl p-8 shadow-xl border-4 border-yellow-400 animate-fade-in relative overflow-hidden">
      <div class="absolute -right-10 -top-10 text-9xl opacity-10 pointer-events-none">👨‍🍳</div>
      
      <h2 class="text-2xl font-black text-white mb-6 flex items-center gap-3">
        <span class="bg-yellow-400 text-slate-900 p-2 rounded-lg leading-none">👨‍🍳</span>
        Surat Perintah Kerja (SPK) Dapur
      </h2>

      <div v-if="hasilRekapResep.length === 0" class="text-center p-8 bg-slate-800 rounded-xl text-emerald-400 font-bold border border-emerald-500/30">
         🎉 Luar Biasa! Sisa kemarin masih cukup menutupi semua order hari ini. Dapur libur masak adonan!
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
        <div v-for="(resep, idx) in hasilRekapResep" :key="idx" class="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-yellow-400/50 transition-colors flex flex-col">
           <h3 class="font-black text-yellow-400 text-lg mb-1 leading-tight">{{ resep.nama_resep }}</h3>
           <p class="text-[11px] text-slate-400 font-medium mb-4 flex-1">{{ resep.detail_roti }}</p>
           
           <div class="bg-slate-900 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center mt-auto">
             <div>
               <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Berat Adonan</p>
               <p class="font-black text-white">{{ resep.total_adonan_gram.toLocaleString() }} <span class="text-[10px] font-bold text-slate-500">gr</span></p>
             </div>
             <div class="text-right">
               <p class="text-[9px] text-yellow-500 font-bold uppercase tracking-widest">Masak Batch</p>
               <p class="font-black text-yellow-400 text-2xl leading-none">{{ resep.rekomendasi_batch }}<span class="text-sm font-bold opacity-50">x</span></p>
             </div>
           </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>