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
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-200">
    
    <!-- HEADER NAVIGASI (Hanya tampil jika bukan di halaman login) -->
    <header v-if="!isLoginPage" class="sticky top-0 z-50">
      
      <!-- TIER 1: TOP BAR (DARK & BRANDING) -->
      <div class="bg-slate-900 border-b border-slate-800 shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            
            <!-- Logo & Nama Sistem -->
            <div class="flex items-center gap-3">
              <div class="bg-linear-to-br from-yellow-400 to-yellow-600 p-2 rounded-lg shadow-lg flex items-center justify-center">
                <span class="text-xl leading-none block">👑</span>
              </div>
              <div class="hidden sm:block">
                <h1 class="font-black text-xl tracking-widest text-white leading-none mb-1">
                  TIARA <span class="text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-yellow-200">INVENTORY</span>
                </h1>
                <p class="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Production Planning & Control</p>
              </div>
            </div>

            <!-- Menu Kanan (Indikator & Logout) -->
            <div class="flex items-center gap-5">
              <div class="hidden md:flex items-center gap-2 border-r border-slate-700 pr-5">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                </span>
                <span class="text-xs font-bold text-slate-300">Sistem Online</span>
              </div>
              
              <button @click="logout" class="group flex items-center gap-2 bg-slate-800 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm">
                <span class="group-hover:rotate-12 transition-transform block">🚪</span>
                <span>Keluar</span>
              </button>
            </div>
            
          </div>
        </div>
      </div>

      <!-- TIER 2: BOTTOM BAR (KATEGORI MENU) -->
      <div class="bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Pembungkus menu yang bisa di-scroll menyamping di HP -->
          <div class="flex overflow-x-auto hide-scrollbar gap-8 py-3">

            <!-- KELOMPOK 1: MASTER DATA -->
            <div class="flex flex-col gap-1.5 border-r border-slate-200 pr-8 shrink-0">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Master Data</span>
              <div class="flex gap-2">
                <router-link to="/bahan" class="px-4 py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 whitespace-nowrap flex items-center gap-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" exact-active-class="!bg-blue-50 !text-blue-700 !border-blue-200 shadow-sm">📦 Bahan</router-link>
                <router-link to="/resep" class="px-4 py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 whitespace-nowrap flex items-center gap-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" exact-active-class="!bg-blue-50 !text-blue-700 !border-blue-200 shadow-sm">🥣 Resep</router-link>
                <router-link to="/barang" class="px-4 py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 whitespace-nowrap flex items-center gap-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" exact-active-class="!bg-blue-50 !text-blue-700 !border-blue-200 shadow-sm">🍞 Produk</router-link>
              </div>
            </div>

            <!-- KELOMPOK 2: OPERASIONAL DAPUR -->
            <div class="flex flex-col gap-1.5 border-r border-slate-200 pr-8 shrink-0">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Operasional Dapur</span>
              <div class="flex gap-2">
                <router-link to="/konversi" class="px-4 py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 whitespace-nowrap flex items-center gap-2 text-slate-500 hover:bg-yellow-50 hover:text-yellow-700" exact-active-class="!bg-yellow-50 !text-yellow-700 !border-yellow-300 shadow-sm">🌤️ Konversi</router-link>
                <router-link to="/input-produksi" class="px-4 py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 whitespace-nowrap flex items-center gap-2 text-slate-500 hover:bg-yellow-50 hover:text-yellow-700" exact-active-class="!bg-yellow-50 !text-yellow-700 !border-yellow-300 shadow-sm">👨‍🍳 Dapur</router-link>
                <router-link to="/tutup-buku" class="px-4 py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 whitespace-nowrap flex items-center gap-2 text-slate-500 hover:bg-yellow-50 hover:text-yellow-700" exact-active-class="!bg-yellow-50 !text-yellow-700 !border-yellow-300 shadow-sm">🌙 Tutup Buku</router-link>
              </div>
            </div>

            <!-- KELOMPOK 3: GUDANG & LAPORAN -->
            <div class="flex flex-col gap-1.5 pr-4 shrink-0">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Gudang & Laporan</span>
              <div class="flex gap-2">
                <router-link to="/opname" class="px-4 py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 whitespace-nowrap flex items-center gap-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700" exact-active-class="!bg-rose-50 !text-rose-700 !border-rose-300 shadow-sm">⚖️ Opname</router-link>
                <router-link to="/laporan-pengeluaran" class="px-4 py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 whitespace-nowrap flex items-center gap-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700" exact-active-class="!bg-rose-50 !text-rose-700 !border-rose-300 shadow-sm">💸 Pengeluaran</router-link>
                <router-link to="/sampah-inventory" class="px-4 py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 whitespace-nowrap flex items-center gap-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700" exact-active-class="!bg-rose-50 !text-rose-700 !border-rose-300 shadow-sm">🗑️ Sampah</router-link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </header>

    <!-- KONTEN UTAMA (Yang akan diisi oleh halaman lain) -->
    <main class="flex-1 w-full relative">
      <router-view />
    </main>

  </div>
</template>

<style>
/* Menyembunyikan scrollbar bawah jika dibuka di HP agar tetap elegan */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>