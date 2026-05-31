<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
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

// STATE UNTUK POP-UP OPNAME CEPAT
const showModalOpname = ref(false)
const formOpname = ref({ ID: null, nama_bahan: '', stok_sistem: 0, stok_fisik: 0, satuan: '', keterangan: '', _original: null })

const bukaModalOpname = (b) => {
  formOpname.value = {
    ID: b.ID,
    nama_bahan: b.nama_bahan,
    stok_sistem: b.stok,
    stok_fisik: b.stok, 
    satuan: b.satuan,
    keterangan: '',
    _original: b 
  }
  showModalOpname.value = true
}

const simpanOpnameCepat = async () => {
  if (formOpname.value.stok_fisik === null || formOpname.value.stok_fisik === '') return alert("Stok fisik harus diisi!")
  if (formOpname.value.stok_fisik < 0) return alert("Stok fisik tidak boleh negatif!")
  if (!confirm(`Sesuaikan stok ${formOpname.value.nama_bahan} menjadi ${formOpname.value.stok_fisik} ${formOpname.value.satuan}?`)) return
  
  const token = localStorage.getItem('inventory_token')
  
  const payloadOpname = { 
    bahan_id: formOpname.value.ID, 
    stok_fisik: parseFloat(formOpname.value.stok_fisik), 
    keterangan: formOpname.value.keterangan || 'Opname Cepat dari Master Bahan' 
  }
  
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/opname`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payloadOpname)
  })
  
  if (res.ok) {
    alert("Stok berhasil disesuaikan dan tercatat di riwayat Opname!")
    showModalOpname.value = false
    fetchBahan()
  } else {
    alert("Gagal memperbarui stok!")
  }
}

watch([showModalBahan, showModalBeli, showModalOpname], ([isOpenBahan, isOpenBeli, isOpenOpname]) => {
  if (isOpenBahan || isOpenBeli || isOpenOpname) {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
})
onUnmounted(() => { 
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
})

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
                  <button @click="bukaModalOpname(element)" class="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded font-bold text-xs transition-colors" title="Opname Cepat">Opname</button>
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

<div v-if="showModalBeli" class="fixed inset-0 backdrop-blur-sm bg-slate-900/40 flex justify-center items-center z-50 p-4 transition-opacity">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in ring-1 ring-gray-200">
        
        <!-- Header -->
        <div class="bg-linear-to-r from-green-50/80 to-emerald-50/80 px-6 py-5 flex justify-between items-center border-b border-gray-100 shrink-0">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-green-100 rounded-xl text-green-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800 tracking-tight">Catat Struk Belanja</h2>
              <p class="text-xs font-medium text-gray-500 mt-0.5">Masukkan beberapa bahan sekaligus dalam satu nota pembayaran.</p>
            </div>
          </div>
          <button @click="showModalBeli = false" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto custom-scrollbar bg-gray-50/30 flex-1 space-y-6">
          
          <!-- Nota Info -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal Nota</label>
              <input type="date" v-model="formBeli.tanggal" required class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-gray-700 shadow-sm transition-all outline-none">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Keterangan / Supplier</label>
              <input type="text" v-model="formBeli.keterangan" placeholder="Contoh: Beli di Indomaret" class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-gray-700 shadow-sm transition-all outline-none">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status Pembayaran</label>
              <div class="flex gap-3 h-10.5">
                <label class="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors has-checked:border-green-500 has-checked:bg-green-50 has-checked:ring-1 has-checked:ring-green-500">
                  <input type="radio" v-model="formBeli.is_lunas" :value="true" class="sr-only">
                  <span class="w-3 h-3 rounded-full border-2 border-gray-300" :class="{ 'border-green-500 bg-green-500': formBeli.is_lunas }"></span>
                  <span class="text-xs font-bold" :class="formBeli.is_lunas ? 'text-green-700' : 'text-gray-600'">Lunas</span>
                </label>
                <label class="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors has-checked:border-red-500 has-checked:bg-red-50 has-checked:ring-1 has-checked:ring-red-500">
                  <input type="radio" v-model="formBeli.is_lunas" :value="false" class="sr-only">
                  <span class="w-3 h-3 rounded-full border-2 border-gray-300" :class="{ 'border-red-500 bg-red-500': !formBeli.is_lunas }"></span>
                  <span class="text-xs font-bold" :class="!formBeli.is_lunas ? 'text-red-700' : 'text-gray-600'">Hutang</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Add to Cart Form -->
          <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-visible">
            <div class="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-2xl"></div>
            <label class="block text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-3 ml-2">Tambah Item Baru</label>
            <div class="flex flex-col md:flex-row gap-4 items-end ml-2">
              
              <div class="flex-1 relative">
                <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cari & Pilih Bahan</label>
                <div class="relative w-full">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input 
                    type="text" 
                    v-model="searchBahan" 
                    @focus="isDropdownOpen = true" 
                    placeholder="Ketik nama bahan..." 
                    class="relative z-50 w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-gray-700 shadow-inner transition-all outline-none"
                  >

                  <div v-if="isDropdownOpen" @click="isDropdownOpen = false" class="fixed inset-0 z-40 cursor-default"></div>

                  <ul v-if="isDropdownOpen" class="absolute z-50 w-full bg-white border border-gray-200 shadow-2xl max-h-56 overflow-y-auto rounded-xl mt-2 custom-scrollbar overflow-hidden divide-y divide-gray-100">
                    <li class="sticky top-0 bg-gray-50/95 backdrop-blur-sm p-2 flex justify-between items-center z-10">
                       <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-2">Daftar Bahan</span>
                       <button @click.prevent="isDropdownOpen = false" class="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm border border-gray-200 transition-colors">Tutup</button>
                    </li>
                    <li 
                      v-for="b in filteredBahan" 
                      :key="b.ID" 
                      @mousedown.prevent="pilihBahan(b)"
                      class="px-4 py-3 hover:bg-green-50 cursor-pointer text-sm font-semibold text-gray-700 transition-colors flex items-center justify-between group"
                    >
                      {{ b.nama_bahan }} 
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-700 transition-colors">{{ b.satuan }}</span>
                    </li>
                    <li v-if="filteredBahan.length === 0" class="p-4 text-sm text-gray-400 italic text-center bg-gray-50">
                      Bahan tidak ditemukan.
                    </li>
                  </ul>
                </div>
              </div>

              <div class="w-full md:w-28">
                <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Qty</label>
                <input type="number" v-model.number="tempBeli.qty" min="0" step="any" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-black text-center text-gray-700 shadow-inner transition-all outline-none">
              </div>

              <div class="w-full md:w-48 relative">
                <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Total Harga (Rp)</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-xs font-bold text-gray-400">Rp</span>
                  </div>
                  <input type="number" v-model.number="tempBeli.subtotal" min="0" step="any" class="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-black text-red-600 shadow-inner transition-all outline-none">
                </div>
                <div v-if="tempHPP > 0" class="absolute -bottom-6 left-0 w-full text-center">
                   <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">HPP: Rp {{ formatRp(tempHPP) }}/satuan</span>
                </div>
              </div>

              <button @click="tambahKeKeranjang" type="button" class="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 w-full md:w-auto h-10.5 flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                Tambah
              </button>
            </div>
          </div>

          <!-- Cart Table -->
          <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col mt-4">
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <tr>
                    <th class="px-5 py-3.5">Item Bahan</th>
                    <th class="px-5 py-3.5 text-center">Qty</th>
                    <th class="px-5 py-3.5 text-right">Harga Satuan</th>
                    <th class="px-5 py-3.5 text-right">Subtotal</th>
                    <th class="px-5 py-3.5 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="(item, index) in formBeli.details" :key="index" class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-5 py-4 font-semibold text-gray-800">{{ item.nama_bahan }}</td>
                    <td class="px-5 py-4 text-center">
                      <span class="font-black text-gray-800 text-base">{{ item.qty }}</span> 
                      <span class="text-[10px] font-bold text-gray-400 ml-1">{{ item.satuan }}</span>
                    </td>
                    <td class="px-5 py-4 text-right font-medium text-gray-500">Rp {{ formatRp(item.harga_beli_satuan) }}</td>
                    <td class="px-5 py-4 text-right font-black text-red-600 text-base">Rp {{ formatRp(item.subtotal) }}</td>
                    <td class="px-5 py-4 text-center">
                      <button @click="hapusDariKeranjang(index)" class="text-gray-300 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="formBeli.details.length === 0">
                    <td colspan="5" class="px-5 py-10 text-center">
                      <div class="flex flex-col items-center justify-center text-gray-400">
                        <svg class="w-10 h-10 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        <span class="text-sm font-medium">Keranjang kosong, silakan tambah item</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Summary Footer -->
            <div class="bg-linear-to-r from-gray-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Grand Total</span>
              <span class="text-2xl font-black text-green-400 tracking-tight">Rp {{ formatRp(grandTotalBelanja) }}</span>
            </div>
          </div>

        </div>

        <!-- Footer Actions -->
        <div class="bg-white px-6 py-4 flex justify-end gap-3 border-t border-gray-100 shrink-0">
          <button type="button" @click="showModalBeli = false" class="px-6 py-2.5 font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm transition-colors">Batalkan</button>
          <button @click="simpanPembelian" type="button" class="bg-gray-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-gray-800 shadow-md transition-all active:scale-95 flex items-center gap-2">
            <span>Simpan Pembelian</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL OPNAME CEPAT -->
    <div v-if="showModalOpname" class="fixed inset-0 backdrop-blur-md bg-white/30 flex justify-center items-center z-50 p-4">
      <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border-t-8 border-purple-500 animate-fade-in">
        <h2 class="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
          <span>⚖️</span> Stok Opname Cepat
        </h2>

        <div class="bg-purple-50 p-4 rounded-lg text-center mb-6 border border-purple-100">
          <p class="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">{{ formOpname.nama_bahan }}</p>
          <div class="flex items-end justify-center gap-2">
            <span class="text-3xl font-black text-purple-900">{{ formOpname.stok_sistem }}</span>
            <span class="text-sm font-bold text-purple-600 uppercase pb-1">{{ formOpname.satuan }}</span>
          </div>
          <p class="text-[10px] text-gray-500 mt-2">Stok Komputer Saat Ini</p>
        </div>

        <form @submit.prevent="simpanOpnameCepat">
          <div class="mb-4">
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Timbangan Fisik Nyata</label>
            <input v-model.number="formOpname.stok_fisik" type="number" step="any" min="0" required class="w-full border-2 border-gray-300 bg-white rounded-lg p-3 font-black text-center text-gray-900 outline-none focus:border-purple-500 transition-colors text-xl">
          </div>

          <div class="mb-6">
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Alasan Selisih (Opsional)</label>
            <input v-model="formOpname.keterangan" type="text" placeholder="Contoh: Salah hitung kemarin" class="w-full border-2 border-gray-300 bg-white rounded-lg p-2.5 font-bold text-gray-700 outline-none focus:border-purple-500 transition-colors">
          </div>

          <div class="flex justify-end gap-3">
            <button type="button" @click="showModalOpname = false" class="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Batal</button>
            <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-black shadow-md transition-colors">Sesuaikan Stok</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>