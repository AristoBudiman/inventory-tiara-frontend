<script setup>
import { ref, onMounted } from 'vue'

const trash = ref({ tokos: [], barangs: [], bahans: [], reseps: [] })

const fetchTrash = async () => {
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sampah`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.ok) trash.value = await res.json()
}

const restore = async (type, id) => {
  if (confirm(`Pulihkan data ${type} ini kembali ke sistem aktif?`)) {
    const token = localStorage.getItem('inventory_token')
    await fetch(`${import.meta.env.VITE_API_URL}/api/sampah/${type}/${id}`, {
      method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchTrash()
  }
}

onMounted(fetchTrash)
</script>

<template>
  <div class="p-8 bg-gray-50 min-h-screen">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center gap-3 mb-8">
        <span class="text-4xl">🗑️</span>
        <div>
           <h1 class="text-3xl font-black text-gray-900">Tempat Sampah Terpadu</h1>
           <p class="text-sm font-bold text-gray-500">Pulihkan data yang tidak sengaja terhapus (Aman dari Human Error).</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- KOLOM KIRI -->
        <div class="space-y-6">
          <div class="bg-white p-5 rounded-xl shadow-sm border-t-4 border-purple-500">
            <h3 class="font-black text-purple-900 mb-4 border-b pb-2">Bahan Baku (Gudang)</h3>
            <div v-if="trash.bahans.length === 0" class="text-gray-400 italic text-sm">Aman, tidak ada bahan terhapus.</div>
            <div v-for="t in trash.bahans" :key="t.ID" class="flex justify-between items-center border p-2 rounded mb-2 bg-purple-50 hover:bg-purple-100">
              <span class="font-bold text-purple-800 text-sm">{{ t.nama_bahan }}</span>
              <button @click="restore('bahan', t.ID)" class="bg-purple-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-purple-700 shadow">Pulihkan</button>
            </div>
          </div>

          <div class="bg-white p-5 rounded-xl shadow-sm border-t-4 border-orange-500">
            <h3 class="font-black text-orange-900 mb-4 border-b pb-2">Buku Resep (Dapur)</h3>
            <div v-if="trash.reseps.length === 0" class="text-gray-400 italic text-sm">Aman, tidak ada resep terhapus.</div>
            <div v-for="t in trash.reseps" :key="t.ID" class="flex justify-between items-center border p-2 rounded mb-2 bg-orange-50 hover:bg-orange-100">
              <span class="font-bold text-orange-800 text-sm">{{ t.nama_resep }}</span>
              <button @click="restore('resep', t.ID)" class="bg-orange-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-orange-700 shadow">Pulihkan</button>
            </div>
          </div>
        </div>

        <!-- KOLOM KANAN -->
        <div class="space-y-6">
          <div class="bg-white p-5 rounded-xl shadow-sm border-t-4 border-blue-500">
            <h3 class="font-black text-blue-900 mb-4 border-b pb-2">Produk Jual (Barang)</h3>
            <div v-if="trash.barangs.length === 0" class="text-gray-400 italic text-sm">Aman, tidak ada produk terhapus.</div>
            <div v-for="t in trash.barangs" :key="t.ID" class="flex justify-between items-center border p-2 rounded mb-2 bg-blue-50 hover:bg-blue-100">
              <span class="font-bold text-blue-800 text-sm">{{ t.NamaBarang }}</span>
              <button @click="restore('barang', t.ID)" class="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 shadow">Pulihkan</button>
            </div>
          </div>

          <div class="bg-white p-5 rounded-xl shadow-sm border-t-4 border-green-500">
            <h3 class="font-black text-green-900 mb-4 border-b pb-2">Mitra / Agen (Toko)</h3>
            <div v-if="trash.tokos.length === 0" class="text-gray-400 italic text-sm">Aman, tidak ada toko terhapus.</div>
            <div v-for="t in trash.tokos" :key="t.ID" class="flex justify-between items-center border p-2 rounded mb-2 bg-green-50 hover:bg-green-100">
              <span class="font-bold text-green-800 text-sm">{{ t.NamaToko }}</span>
              <button @click="restore('toko', t.ID)" class="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 shadow">Pulihkan</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>