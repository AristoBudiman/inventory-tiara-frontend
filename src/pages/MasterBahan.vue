<script setup>
import { ref, onMounted, computed } from 'vue'
import draggable from 'vuedraggable'

const listBahan = ref([])
const isEdit = ref(false)

const formBahan = ref({ ID: null, nama_bahan: '', satuan: 'gr', batas_minimum: 0, harga_saat_ini: 0 })

// STATE UNTUK POP-UP MODAL
const showModalBahan = ref(false) 



const simpanUrutan = async () => {
  const payload = listBahan.value.map((b, i) => ({ id: b.ID, urutan: i + 1 }))
  try {
    const token = localStorage.getItem('inventory_token')
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bahan/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error("Gagal menyimpan urutan")
  } catch (err) {
    console.error("Gagal simpan urutan:", err.message)
  }
}

const fetchBahan = async () => {
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers: { 'Authorization': `Bearer ${token}` } })
  if (res.ok) listBahan.value = await res.json()
}

const simpanBahan = async () => {
  const method = isEdit.value ? 'PUT' : 'POST'
  const url = isEdit.value ? `${import.meta.env.VITE_API_URL}/api/bahan/${formBahan.value.ID}` : `${import.meta.env.VITE_API_URL}/api/bahan`
  const token = localStorage.getItem('inventory_token')
  await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formBahan.value) })
  
  // Tutup modal dan reset setelah berhasil
  showModalBahan.value = false
  isEdit.value = false
  formBahan.value = { ID: null, nama_bahan: '', satuan: 'gr', batas_minimum: 0, harga_saat_ini: 0 }
  fetchBahan()
}

// BUKA POP-UP TAMBAH BAHAN BARU
const tambahBahanBaru = () => {
  isEdit.value = false
  formBahan.value = { ID: null, nama_bahan: '', satuan: 'gr', batas_minimum: 0, harga_saat_ini: 0 }
  showModalBahan.value = true
}

// BUKA POP-UP EDIT BAHAN
const editBahan = (b) => { 
  isEdit.value = true
  formBahan.value = { ID: b.ID, nama_bahan: b.nama_bahan, satuan: b.satuan, batas_minimum: b.batas_minimum, harga_saat_ini: b.harga_saat_ini }
  showModalBahan.value = true
}

const hapusBahan = async (id) => {
  if(confirm('Hapus bahan ini ke tempat sampah?')) {
    const token = localStorage.getItem('inventory_token')
    await fetch(`${import.meta.env.VITE_API_URL}/api/bahan/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
    fetchBahan()
  }
}

// ==========================================
// STATE & LOGIKA KERANJANG BELANJA
// ==========================================
const showModalBeli = ref(false)
const formBeli = ref({ tanggal: new Date().toISOString().split('T')[0], keterangan: '', is_lunas: true, details: [] })
const tempBeli = ref({ bahan_id: '', qty: '', subtotal: '' }) // Form input sementara

// STATE BARU KHUSUS UNTUK DROPDOWN PENCARIAN
const searchBahan = ref('')
const isDropdownOpen = ref(false)

const filteredBahan = computed(() => {
  if (!searchBahan.value) return listBahan.value
  return listBahan.value.filter(b => b.nama_bahan.toLowerCase().includes(searchBahan.value.toLowerCase()))
})

const pilihBahan = (b) => {
  tempBeli.value.bahan_id = b.ID
  searchBahan.value = b.nama_bahan // Tampilkan nama bahan di input
  isDropdownOpen.value = false
}

// Buka modal belanja (Bisa dari tombol atas, atau dari tombol keranjang di baris tabel)
const bukaModalBeli = (b = null) => { 
  formBeli.value = { tanggal: new Date().toISOString().split('T')[0], keterangan: '', is_lunas: true, details: [] }
  tempBeli.value = { bahan_id: '', qty: '', subtotal: '' }
  searchBahan.value = ''
  if (b && b.ID) {
    tempBeli.value.bahan_id = b.ID 
    searchBahan.value = b.nama_bahan
  } 
  showModalBeli.value = true 
}

const tambahKeKeranjang = () => {
  if (!tempBeli.value.bahan_id || !tempBeli.value.qty || !tempBeli.value.subtotal) {
    return alert('Harap isi Bahan, Qty, dan Subtotal Biaya!')
  }
  const bahan = listBahan.value.find(x => x.ID === tempBeli.value.bahan_id)
  
  formBeli.value.details.push({
    bahan_id: tempBeli.value.bahan_id,
    nama_bahan: bahan.nama_bahan,
    satuan: bahan.satuan,
    qty: tempBeli.value.qty,
    subtotal: tempBeli.value.subtotal,
    harga_beli_satuan: tempBeli.value.subtotal / tempBeli.value.qty
  })
  // Kosongkan form input setelah masuk keranjang
  tempBeli.value = { bahan_id: '', qty: '', subtotal: '' }
  searchBahan.value = '' // Reset pencarian
}

const hapusDariKeranjang = (index) => {
  formBeli.value.details.splice(index, 1)
}

const tempHPP = computed(() => {
  if (tempBeli.value.qty > 0 && tempBeli.value.subtotal > 0) {
    return tempBeli.value.subtotal / tempBeli.value.qty
  }
  return 0
})

const grandTotalBelanja = computed(() => {
  return formBeli.value.details.reduce((sum, item) => sum + item.subtotal, 0)
})

const simpanPembelian = async () => {
  if (formBeli.value.details.length === 0) return alert('Keranjang belanja masih kosong!')
  
  const payload = {
    tanggal: formBeli.value.tanggal,
    keterangan: formBeli.value.keterangan,
    is_lunas: formBeli.value.is_lunas,
    details: formBeli.value.details
  }

  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
      body: JSON.stringify(payload) 
  })
  
  if (res.ok) { 
    alert('Struk belanja gabungan berhasil dicatat! Stok terupdate.')
    showModalBeli.value = false
    fetchBahan() 
  } else {
    alert('Gagal mencatat belanja ke database.')
  }
}
// ==========================================

const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)
onMounted(fetchBahan)
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    <div class="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-gray-200 pb-4 gap-4">
      <div>
        <h1 class="text-3xl font-black text-gray-800 tracking-tight">📦 Katalog Bahan & Kemasan</h1>
        <p class="text-sm text-gray-500 font-medium mt-1">Kelola data mentah, stok gudang, dan HPP otomatis.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button @click="bukaModalBeli()" class="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2 whitespace-nowrap">
          🛒 Catat Struk Belanja
        </button>
        <button @click="tambahBahanBaru" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2 whitespace-nowrap">
          ➕ Tambah Bahan Baru
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-x-auto">
      <table class="w-full min-w-max text-sm text-left">
        <thead class="bg-gray-100 border-b-2 border-gray-200">
          <tr>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs whitespace-nowrap">Nama Bahan</th>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs text-center w-48 whitespace-nowrap">Stok Gudang</th>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs text-right whitespace-nowrap">HPP Terakhir</th>
            <th class="p-4 font-black text-gray-600 uppercase tracking-wider text-xs text-center w-64 whitespace-nowrap">Aksi</th>
          </tr>
        </thead>
        <draggable 
            v-model="listBahan" 
            tag="tbody" 
            item-key="ID" 
            handle=".drag-handle" 
            @end="simpanUrutan"
            class="divide-y divide-gray-100"
            animation="200"
        >
          <template #item="{ element, index }">
            <tr class="hover:bg-blue-50/50 transition-colors bg-white">
              
              <td class="p-4 font-bold text-gray-800 text-base whitespace-nowrap">
                <span class="text-gray-400 mr-3 text-lg drag-handle cursor-grab active:cursor-grabbing" title="Tahan dan geser">☰</span>
                {{ element.nama_bahan }}
              </td>

              <td class="p-4 text-center whitespace-nowrap">
                <div class="inline-flex items-baseline justify-center px-3 py-1 rounded-lg border-2 shadow-sm" :class="element.stok <= element.batas_minimum ? 'bg-red-50 border-red-400 text-red-700 animate-pulse' : 'bg-white border-blue-200 text-blue-800'">
                  <span class="font-black text-xl mr-1">{{ element.stok }}</span> 
                  <span class="text-xs font-bold uppercase">{{ element.satuan }}</span>
                </div>
                <p v-if="element.stok <= element.batas_minimum" class="text-[10px] text-red-600 font-black mt-1 uppercase tracking-widest">⚠️ Stok Kritis</p>
              </td>

              <td class="p-4 text-right whitespace-nowrap">
                <span class="font-bold text-gray-800 text-base">Rp {{ formatRp(element.harga_saat_ini) }}</span>
                <span class="text-[10px] text-gray-500 font-medium ml-1">/ {{ element.satuan }}</span>
              </td>

              <td class="p-4 whitespace-nowrap">
                <div class="flex justify-center gap-2">
                  <button @click="editBahan(element)" class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded font-bold text-xs transition-colors">Edit</button>
                  <button @click="hapusBahan(element.ID)" class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded font-bold text-xs transition-colors">Del</button>
                </div>
              </td>
              
            </tr>
          </template>
        </draggable>
      </table>
    </div>

    <div v-if="showModalBahan" class="fixed inset-0 backdrop-blur-md bg-white/30 flex justify-center items-center z-50 p-4">
      <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg border-t-8" :class="isEdit ? 'border-blue-500' : 'border-blue-700'">
        <h2 class="text-xl font-black text-gray-800 mb-6">
          {{ isEdit ? '✏️ Edit Data Bahan' : '✨ Daftarkan Bahan Baru' }}
        </h2>

        <form @submit.prevent="simpanBahan" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Nama Bahan / Kemasan</label>
            <input v-model="formBahan.nama_bahan" type="text" required placeholder="Contoh: Tepung Segitiga Biru" class="w-full border-2 border-gray-300 rounded p-2 focus:border-blue-500 font-bold outline-none text-gray-800 bg-white">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Satuan (UOM)</label>
              <select v-model="formBahan.satuan" class="w-full border-2 border-gray-300 rounded p-2 focus:border-blue-500 font-bold outline-none text-gray-800 bg-white cursor-pointer">
                <option value="gr">Gram (gr)</option>
                <option value="ml">MiliLiter (ml)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="lmbr">Lembar (lmbr)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Batas Minimum</label>
              <input v-model.number="formBahan.batas_minimum" type="number" required min="0" step="any" class="w-full border-2 border-red-300 bg-red-50 rounded p-2 focus:border-red-500 font-black text-red-700 outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider mb-1 text-green-600">HPP / Harga Modal</label>
            <input v-model.number="formBahan.harga_saat_ini" type="number" min="0" step="any" class="w-full border-2 border-green-300 bg-green-50 rounded p-2 focus:border-green-500 font-black text-green-700 outline-none" title="Harga Modal saat ini">
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" @click="showModalBahan = false" class="px-5 py-2 font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded transition-colors">Batal</button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold shadow-md transition-colors">
              {{ isEdit ? 'Simpan Perubahan' : 'Tambah Bahan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

<div v-if="showModalBeli" class="fixed inset-0 backdrop-blur-md bg-white/30 flex justify-center items-center z-50 p-4">
      <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl border-t-8 border-green-500 max-h-[95vh] overflow-y-auto">
        
        <div class="flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
          <div>
            <h2 class="text-2xl font-black text-gray-800 tracking-tight">🛒 Catat Struk Belanja</h2>
            <p class="text-sm font-bold text-gray-500">Masukkan beberapa bahan sekaligus dalam satu nota pembayaran.</p>
          </div>
          <button @click="showModalBeli = false" class="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Tanggal Nota</label>
            <input type="date" v-model="formBeli.tanggal" required class="w-full border border-gray-300 rounded p-2 focus:border-green-500 font-bold outline-none text-gray-700">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Keterangan / Supplier</label>
            <input type="text" v-model="formBeli.keterangan" placeholder="Contoh: Beli di Lotte Mart" class="w-full border border-gray-300 rounded p-2 focus:border-green-500 font-medium outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase mb-2">Status Pembayaran</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="formBeli.is_lunas" :value="true" class="w-4 h-4 text-green-600">
                <span class="text-sm font-bold text-green-700">Lunas (Potong Kas)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="formBeli.is_lunas" :value="false" class="w-4 h-4 text-red-600">
                <span class="text-sm font-bold text-red-700">Hutang (Tempo)</span>
              </label>
            </div>
          </div>
        </div>

        <div class="bg-green-50/50 p-4 rounded-lg border border-green-200 mb-6">
          <label class="block text-xs font-black text-green-800 uppercase mb-3">➕ Tambah Item Ke Keranjang</label>
          <div class="flex flex-col md:flex-row gap-3 items-end mb-3">
            
            <div class="flex-1">
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cari & Pilih Bahan</label>
              <div class="relative w-full">
                
                <input 
                  type="text" 
                  v-model="searchBahan" 
                  @focus="isDropdownOpen = true" 
                  placeholder="Ketik nama bahan..." 
                  class="relative z-101 w-full border border-gray-300 rounded p-2.5 outline-none font-bold text-gray-700 focus:border-green-500 bg-white"
                >

                <div 
                  v-if="isDropdownOpen" 
                  @click="isDropdownOpen = false" 
                  class="fixed inset-0 z-101 cursor-default"
                ></div>

                <ul v-if="isDropdownOpen" class="absolute z-101 w-full bg-white border border-gray-300 shadow-xl max-h-56 overflow-y-auto rounded-b mt-1 custom-scrollbar">
                  <li class="sticky top-0 bg-gray-100 p-2 border-b border-gray-200 flex justify-between items-center">
                     <span class="text-[10px] font-black text-gray-500 uppercase">Daftar Bahan</span>
                     <button @click.prevent="isDropdownOpen = false" class="text-red-500 hover:text-red-700 font-bold text-xs px-2 rounded">Tutup ✖</button>
                  </li>
                  <li 
                    v-for="b in filteredBahan" 
                    :key="b.ID" 
                    @mousedown.prevent="pilihBahan(b)"
                    class="p-2.5 hover:bg-green-100 cursor-pointer text-sm font-bold text-gray-800 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    {{ b.nama_bahan }} <span class="text-xs text-gray-400 font-normal ml-1">({{ b.satuan }})</span>
                  </li>
                  <li v-if="filteredBahan.length === 0" class="p-3 text-sm text-gray-400 italic text-center">
                    Bahan tidak ditemukan.
                  </li>
                </ul>
              </div>
            </div>

            <div class="w-full md:w-32">
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Qty Masuk</label>
              <input type="number" v-model.number="tempBeli.qty" min="0" step="any" class="w-full border border-gray-300 rounded p-2.5 font-black outline-none text-center">
            </div>

            <div class="w-full md:w-48 relative">
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Total Harga Beli (Rp)</label>
              <input type="number" v-model.number="tempBeli.subtotal" min="0" step="any" class="w-full border border-gray-300 rounded p-2.5 font-black text-red-700 outline-none">
              <p v-if="tempHPP > 0" class="absolute -bottom-4 left-0 text-[10px] font-black text-blue-600 whitespace-nowrap">
                💡 HPP: Rp {{ formatRp(tempHPP) }} / satuan
              </p>
            </div>

            <button @click="tambahKeKeranjang" type="button" class="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded shadow transition-all active:scale-95 w-full md:w-auto h-full">
              Tambah
            </button>
          </div>
        </div>

        <div class="border border-gray-200 rounded-lg overflow-hidden mb-6">
          <table class="w-full text-sm text-left">
            <thead class="bg-gray-100 border-b border-gray-200 text-xs uppercase font-black text-gray-600">
              <tr>
                <th class="p-3">Nama Bahan</th>
                <th class="p-3 text-center">Qty Masuk</th>
                <th class="p-3 text-right">Harga / Satuan</th>
                <th class="p-3 text-right">Subtotal Biaya</th>
                <th class="p-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(item, index) in formBeli.details" :key="index" class="hover:bg-gray-50">
                <td class="p-3 font-bold text-gray-800">{{ item.nama_bahan }}</td>
                <td class="p-3 text-center font-black text-blue-700">{{ item.qty }} <span class="text-[10px] font-bold text-gray-500">{{ item.satuan }}</span></td>
                <td class="p-3 text-right font-medium text-gray-600">Rp {{ formatRp(item.harga_beli_satuan) }}</td>
                <td class="p-3 text-right font-black text-red-700">Rp {{ formatRp(item.subtotal) }}</td>
                <td class="p-3 text-center">
                  <button @click="hapusDariKeranjang(index)" class="text-red-500 hover:text-red-700 font-bold p-1 rounded hover:bg-red-50">❌</button>
                </td>
              </tr>
              <tr v-if="formBeli.details.length === 0">
                <td colspan="5" class="p-6 text-center text-gray-400 font-bold italic">Keranjang masih kosong. Tambahkan item di atas.</td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-800 text-white">
              <tr>
                <td colspan="3" class="p-3 text-right font-black uppercase tracking-wider text-xs">Grand Total:</td>
                <td class="p-3 text-right font-black text-lg text-green-400">Rp {{ formatRp(grandTotalBelanja) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" @click="showModalBeli = false" class="px-6 py-3 font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded shadow-sm transition-colors">Batal</button>
          <button @click="simpanPembelian" type="button" class="bg-green-600 text-white px-8 py-3 rounded font-black hover:bg-green-700 shadow-md transition-all active:scale-95 text-lg">
            Simpan Struk Belanja
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>