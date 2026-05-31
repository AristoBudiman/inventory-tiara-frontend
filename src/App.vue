<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// State untuk Hamburger Menu
const isMenuOpen = ref(false)

// Cek apakah kita sedang berada di halaman login
const isLoginPage = computed(() => route.path === '/login')

// Tutup menu otomatis setiap kali pindah halaman
watch(() => route.path, () => {
  isMenuOpen.value = false
})

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
    
    <header v-if="!isLoginPage" class="sticky top-0 z-50">
      
      <div class="bg-slate-900 border-b border-slate-800 shadow-md relative z-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            
            <div class="flex items-center gap-3">
              
              <button @click="isMenuOpen = !isMenuOpen" class="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-white transition-colors active:bg-slate-700 mr-1">
                <span v-if="!isMenuOpen" class="text-xl leading-none">☰</span>
                <span v-else class="text-2xl leading-none font-bold">×</span>
              </button>

              <div class="bg-linear-to-br from-yellow-400 to-yellow-600 p-2 rounded-lg shadow-lg flex items-center justify-center">
                <span class="text-xl leading-none block">👑</span>
              </div>
              <div>
                <h1 class="font-black text-xl tracking-widest text-white leading-none mb-1">
                  TIARA <span class="text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-yellow-200">INVENTORY</span>
                </h1>
                <p class="text-[9px] text-slate-400 font-bold tracking-widest uppercase hidden sm:block">Production Planning & Control</p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div class="hidden md:flex items-center gap-2 border-r border-slate-700 pr-5">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                </span>
                <span class="text-xs font-bold text-slate-300">Sistem Online</span>
              </div>
              
              <button @click="logout" class="hidden md:flex group items-center gap-2 bg-slate-800 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm">
                <span class="group-hover:rotate-12 transition-transform block">🚪</span>
                <span>Keluar</span>
              </button>
            </div>
            
          </div>
        </div>
      </div>

      <div 
        :class="isMenuOpen ? 'translate-y-0 opacity-100 visible' : '-translate-y-4 opacity-0 invisible md:translate-y-0 md:opacity-100 md:visible'"
        class="absolute md:static top-full left-0 w-full bg-white/95 md:bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xl md:shadow-sm transition-all duration-300 ease-in-out z-10 
               h-[calc(100vh-4rem)] md:h-auto overflow-y-auto md:overflow-visible pb-24 md:pb-0"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row md:overflow-x-auto hide-scrollbar gap-6 md:gap-3 py-6 md:py-3 justify-center md:justify-start">

            <div class="flex flex-col gap-3 md:gap-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-5 md:pb-0 md:pr-4 shrink-0">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Master Data</span>
              <div class="flex flex-col md:flex-row gap-1.5">
                <router-link to="/bahan" class="px-2.5 py-3 md:py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 flex items-center gap-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" exact-active-class="!bg-blue-50 !text-blue-700 !border-blue-200 shadow-sm">📦 Bahan</router-link>
                <router-link to="/resep" class="px-2.5 py-3 md:py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 flex items-center gap-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" exact-active-class="!bg-blue-50 !text-blue-700 !border-blue-200 shadow-sm">🥣 Resep</router-link>
                <router-link to="/komposit" class="px-2.5 py-3 md:py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 flex items-center gap-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" exact-active-class="!bg-blue-50 !text-blue-700 !border-blue-200 shadow-sm">🧈 Komposit</router-link>
                <router-link to="/barang" class="px-2.5 py-3 md:py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 flex items-center gap-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" exact-active-class="!bg-blue-50 !text-blue-700 !border-blue-200 shadow-sm">🍞 Produk</router-link>
              </div>
            </div>

            <div class="flex flex-col gap-3 md:gap-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-5 md:pb-0 md:pr-4 shrink-0">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Operasional Dapur</span>
              <div class="flex flex-col md:flex-row gap-1.5">
                <router-link to="/konversi" class="px-2.5 py-3 md:py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 flex items-center gap-1.5 text-slate-500 hover:bg-yellow-50 hover:text-yellow-700" exact-active-class="!bg-yellow-50 !text-yellow-700 !border-yellow-300 shadow-sm">🌤️ Konversi</router-link>
                <router-link to="/input-produksi" class="px-2.5 py-3 md:py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 flex items-center gap-1.5 text-slate-500 hover:bg-yellow-50 hover:text-yellow-700" exact-active-class="!bg-yellow-50 !text-yellow-700 !border-yellow-300 shadow-sm">👨‍🍳 Dapur</router-link>
                <router-link to="/tutup-buku" class="px-2.5 py-3 md:py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 flex items-center gap-1.5 text-slate-500 hover:bg-yellow-50 hover:text-yellow-700" exact-active-class="!bg-yellow-50 !text-yellow-700 !border-yellow-300 shadow-sm">🌙 Tutup Buku</router-link>
              </div>
            </div>

            <div class="flex flex-col gap-3 md:gap-1.5 shrink-0">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Gudang & Laporan</span>
              <div class="flex flex-col md:flex-row gap-1.5">
                <router-link to="/opname" class="px-2.5 py-3 md:py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 flex items-center gap-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700" exact-active-class="!bg-rose-50 !text-rose-700 !border-rose-300 shadow-sm">⚖️ Opname</router-link>
                <router-link to="/laporan-pengeluaran" class="px-2.5 py-3 md:py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 flex items-center gap-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700" exact-active-class="!bg-rose-50 !text-rose-700 !border-rose-300 shadow-sm">💸 Pengeluaran</router-link>
                <router-link to="/sampah-inventory" class="px-2.5 py-3 md:py-2 rounded-xl text-sm font-bold border border-transparent transition-all duration-200 flex items-center gap-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700" exact-active-class="!bg-rose-50 !text-rose-700 !border-rose-300 shadow-sm">🗑️ Sampah</router-link>
              </div>
            </div>

            <div class="md:hidden mt-2 pt-4 border-t border-slate-200">
               <button @click="logout" class="w-full flex justify-center items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 px-4 py-3 rounded-xl text-sm font-black transition-all shadow-sm active:scale-95">
                 <span class="text-lg">🚪</span>
                 <span>Keluar dari Sistem</span>
               </button>
            </div>

          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 w-full relative">
      <router-view />
    </main>

  </div>
</template>

<style>
/* Menyembunyikan scrollbar horizontal bawaan di PC agar tetap elegan */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>