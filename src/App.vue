<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Cek apakah kita sedang berada di halaman login
const isLoginPage = computed(() => route.path === '/login')

// Fungsi membuang token dan keluar
const logout = () => {
  if (confirm('Yakin ingin mengunci sistem dan keluar?')) {
    localStorage.removeItem('inventory_token')
    localStorage.removeItem('admin_role')
    router.push('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Navbar sembunyi secara otomatis kalau di halaman /login -->
    <nav v-if="!isLoginPage" class="bg-gray-900 text-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex items-center justify-between">
          <span class="font-black text-xl tracking-widest text-yellow-400">TIARA INVENTORY</span>
          <!-- Tombol Keluar (Logout) -->
          <button @click="logout" class="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-2">
            Logout
          </button>
        </div>
        <div class="flex flex-wrap gap-2 mt-3 text-xs">
          <router-link to="/bahan" class="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700" exact-active-class="!bg-blue-600 font-bold">📦 M. Bahan</router-link>
          <router-link to="/resep" class="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700" exact-active-class="!bg-blue-600 font-bold">🥣 M. Resep</router-link>
          <router-link to="/barang" class="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700" exact-active-class="!bg-blue-600 font-bold">🍞 M. Produk</router-link>
          <router-link to="/konversi" class="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-yellow-300" exact-active-class="!bg-yellow-600 !text-white font-bold">🌤️ Konversi Pagi</router-link>
          <router-link to="/input-produksi" class="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700" exact-active-class="!bg-blue-600 font-bold">👨‍🍳 Input Dapur</router-link>
          <router-link to="/tutup-buku" class="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-green-300" exact-active-class="!bg-green-600 !text-white font-bold">🌙 Tutup Buku</router-link>
          <router-link to="/opname" class="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-purple-300" exact-active-class="!bg-purple-600 !text-white font-bold">⚖️ Stock Opname</router-link>
          <router-link to="/laporan-pengeluaran" class="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700" exact-active-class="!bg-blue-600 font-bold">💸 Keuangan</router-link>
          <router-link to="/sampah-inventory" class="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-red-300" exact-active-class="!bg-red-600 !text-white font-bold">🗑️ Sampah</router-link>
        </div>
      </div>
    </nav>

    <!-- Konten Halaman -->
    <main class="flex-1"><router-view /></main>
  </div>
</template>