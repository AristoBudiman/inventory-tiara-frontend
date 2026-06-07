<script setup>
import { ref, onMounted } from 'vue'
import { Trash2, Package, Soup, Layers, ShoppingBag } from 'lucide-vue-next'

const trash = ref({ barangs: [], bahans: [], reseps: [], komposits: [] }) // Tokos dihapus

const fetchTrash = async () => {
  const token = localStorage.getItem('inventory_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sampah`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.ok) trash.value = await res.json()
}

const restore = async (type, id) => {
  if (await window.$dialog.confirm(`Pulihkan data ${type} ini kembali ke sistem aktif?`)) {
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
  <div class="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="border-b-2 border-gray-200 pb-4">
      <h1 class="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2"><Trash2 :size="32" /> Tempat Sampah Terpadu</h1>
      <p class="text-sm text-gray-500 font-medium mt-1">Pulihkan data master yang tidak sengaja terhapus. (Aman dari Human Error).</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <!-- KOLOM BAHAN BAKU -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div class="bg-gray-100 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="font-black text-gray-700 tracking-wide flex items-center gap-2"><Package :size="18" /> Bahan Baku</h3>
          <span class="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-black">{{ trash.bahans?.length || 0 }}</span>
        </div>
        <div class="p-4 flex-1 bg-gray-50/50">
          <div v-if="!trash.bahans || trash.bahans.length === 0" class="text-gray-400 font-bold text-sm text-center py-8">Aman, bersih.</div>
          <div class="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            <div v-for="t in trash.bahans" :key="t.ID" class="flex justify-between items-center border border-gray-200 p-2.5 rounded-lg bg-white shadow-sm">
              <span class="font-bold text-gray-800 text-sm truncate pr-2">{{ t.nama_bahan }}</span>
              <button @click="restore('bahan', t.ID)" class="bg-gray-800 text-white px-3 py-1.5 rounded-md text-[10px] font-bold hover:bg-black transition-colors shrink-0">Restore</button>
            </div>
          </div>
        </div>
      </div>

      <!-- KOLOM BUKU RESEP -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div class="bg-gray-100 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="font-black text-gray-700 tracking-wide flex items-center gap-2"><Soup :size="18" /> Buku Resep</h3>
          <span class="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-black">{{ trash.reseps?.length || 0 }}</span>
        </div>
        <div class="p-4 flex-1 bg-gray-50/50">
          <div v-if="!trash.reseps || trash.reseps.length === 0" class="text-gray-400 font-bold text-sm text-center py-8">Aman, bersih.</div>
          <div class="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            <div v-for="t in trash.reseps" :key="t.ID" class="flex justify-between items-center border border-gray-200 p-2.5 rounded-lg bg-white shadow-sm">
              <span class="font-bold text-gray-800 text-sm truncate pr-2">{{ t.nama_resep }}</span>
              <button @click="restore('resep', t.ID)" class="bg-gray-800 text-white px-3 py-1.5 rounded-md text-[10px] font-bold hover:bg-black transition-colors shrink-0">Restore</button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div class="bg-gray-100 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="font-black text-gray-700 tracking-wide flex items-center gap-2"><Layers :size="18" /> Komposit</h3>
          <span class="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-black">{{ trash.komposits?.length || 0 }}</span>
        </div>
        <div class="p-4 flex-1 bg-gray-50/50">
          <div v-if="!trash.komposits || trash.komposits.length === 0" class="text-gray-400 font-bold text-sm text-center py-8">Aman, bersih.</div>
          <div class="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            <div v-for="t in trash.komposits" :key="t.ID" class="flex justify-between items-center border border-gray-200 p-2.5 rounded-lg bg-white shadow-sm">
              <span class="font-bold text-gray-800 text-sm truncate pr-2">{{ t.nama_komposit }}</span>
              <button @click="restore('komposit', t.ID)" class="bg-gray-800 text-white px-3 py-1.5 rounded-md text-[10px] font-bold hover:bg-black transition-colors shrink-0">Restore</button>
            </div>
          </div>
        </div>
      </div>

      <!-- KOLOM BARANG JUAL -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div class="bg-gray-100 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="font-black text-gray-700 tracking-wide flex items-center gap-2"><ShoppingBag :size="18" /> Barang Final</h3>
          <span class="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-black">{{ trash.barangs?.length || 0 }}</span>
        </div>
        <div class="p-4 flex-1 bg-gray-50/50">
          <div v-if="!trash.barangs || trash.barangs.length === 0" class="text-gray-400 font-bold text-sm text-center py-8">Aman, bersih.</div>
          <div class="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            <div v-for="t in trash.barangs" :key="t.ID" class="flex justify-between items-center border border-gray-200 p-2.5 rounded-lg bg-white shadow-sm">
              <span class="font-bold text-gray-800 text-sm truncate pr-2">{{ t.NamaBarang }}</span>
              <button @click="restore('barang', t.ID)" class="bg-gray-800 text-white px-3 py-1.5 rounded-md text-[10px] font-bold hover:bg-black transition-colors shrink-0">Restore</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>