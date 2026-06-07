<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Menu, X, Crown, Package, Soup, Layers, ShoppingBag, 
  ArrowRightLeft, ChefHat, Moon, Scissors, Scale, 
  Receipt, Trash2, LogOut
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

// State untuk Menu Mobile
const isMenuOpen = ref(false)
// State untuk Minimize Sidebar di Desktop
const isSidebarMinimized = ref(false)

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
  <div class="h-screen w-full bg-slate-50 flex font-sans selection:bg-blue-200 overflow-hidden">
    
    <!-- Sidebar -->
    <aside v-if="!isLoginPage" 
           :class="[
             isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
             isSidebarMinimized ? 'md:w-20' : 'md:w-64'
           ]"
           class="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-all duration-300 ease-in-out md:static md:flex md:flex-col shadow-xl overflow-hidden shrink-0">
        
        <div class="h-16 flex items-center px-4 border-b border-slate-800 shrink-0 transition-all duration-300" :class="isSidebarMinimized ? 'justify-center' : 'gap-3'">
            
            <!-- Brand Icon / Toggle Button -->
            <button @click="isSidebarMinimized = !isSidebarMinimized" class="bg-linear-to-br from-yellow-400 to-yellow-600 p-2 rounded-lg shadow-lg flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform" title="Toggle Menu">
                <Crown :size="20" class="text-white" />
            </button>

            <!-- Brand Text -->
            <div v-if="!isSidebarMinimized" class="whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 flex flex-col justify-center">
                <h1 class="font-black text-lg tracking-[0.2em] text-white leading-tight">
                    TIARA
                </h1>
                <p class="text-[10px] font-black tracking-[0.3em] text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-yellow-200 uppercase">
                    Inventory
                </p>
            </div>

            <!-- Close button for mobile -->
            <button @click="isMenuOpen = false" class="md:hidden ml-auto text-slate-400 hover:text-white p-2">
                <X :size="24" />
            </button>
        </div>

        <div class="flex-1 overflow-y-auto overflow-x-hidden py-5 space-y-8 custom-scrollbar transition-all duration-300" :class="isSidebarMinimized ? 'px-2' : 'px-3'">
            
            <div class="space-y-1.5">
                <span v-if="!isSidebarMinimized" class="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3 mb-2 block whitespace-nowrap overflow-hidden">Master Data</span>
                
                <router-link to="/bahan" title="Master Bahan" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-blue-600 !text-white shadow-md">
                    <Package :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Bahan</span>
                </router-link>
                
                <router-link to="/resep" title="Buku Resep" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-blue-600 !text-white shadow-md">
                    <Soup :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Resep</span>
                </router-link>
                
                <router-link to="/komposit" title="Bahan Komposit" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-blue-600 !text-white shadow-md">
                    <Layers :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Komposit</span>
                </router-link>
                
                <router-link to="/barang" title="Master Produk" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-blue-600 !text-white shadow-md">
                    <ShoppingBag :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Produk</span>
                </router-link>
            </div>

            <div class="space-y-1.5">
                <span v-if="!isSidebarMinimized" class="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3 mb-2 block whitespace-nowrap overflow-hidden">Operasional Dapur</span>
                
                <router-link to="/konversi" title="Konversi Kemasan" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-yellow-600 !text-white shadow-md">
                    <ArrowRightLeft :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Konversi</span>
                </router-link>
                
                <router-link to="/input-produksi" title="Input Produksi Dapur" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-yellow-600 !text-white shadow-md">
                    <ChefHat :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Dapur</span>
                </router-link>
                
                <router-link to="/tutup-buku" title="Tutup Buku Harian" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-yellow-600 !text-white shadow-md">
                    <Moon :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Tutup Buku</span>
                </router-link>
            </div>

            <div class="space-y-1.5">
                <span v-if="!isSidebarMinimized" class="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3 mb-2 block whitespace-nowrap overflow-hidden">Gudang & Laporan</span>
                
                <router-link to="/pecah-barang" title="Pecah Barang" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-rose-600 !text-white shadow-md">
                    <Scissors :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Pecah Brg</span>
                </router-link>
                
                <router-link to="/opname" title="Stok Opname" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-rose-600 !text-white shadow-md">
                    <Scale :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Opname</span>
                </router-link>
                
                <router-link to="/laporan-pengeluaran" title="Laporan Pengeluaran Gudang" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-rose-600 !text-white shadow-md">
                    <Receipt :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Pengeluaran</span>
                </router-link>
                
                <router-link to="/sampah-inventory" title="Tempat Sampah" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-rose-600 !text-white shadow-md">
                    <Trash2 :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Sampah</span>
                </router-link>
            </div>
        </div>

        <div class="p-4 border-t border-slate-800 shrink-0 transition-all duration-300" :class="isSidebarMinimized ? 'p-2' : 'p-4'">
            <button @click="logout" title="Keluar Sistem" class="w-full flex items-center justify-center bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all shadow-sm group" :class="isSidebarMinimized ? 'py-3 px-0' : 'py-3 px-4 gap-2'">
                <LogOut :size="20" class="group-hover:-translate-x-1 transition-transform shrink-0" />
                <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Keluar Sistem</span>
            </button>
        </div>
    </aside>

    <!-- Overlay for mobile when sidebar is open -->
    <div v-if="!isLoginPage && isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"></div>

    <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative transition-all duration-300">
        
        <!-- Mobile Top Header (only visible on mobile) -->
        <header v-if="!isLoginPage" class="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 shadow-sm shrink-0 sticky top-0 z-30">
            <div class="flex items-center gap-3">
                <button @click="isMenuOpen = true" class="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                    <Menu :size="24" />
                </button>
                <h1 class="font-black text-lg tracking-widest text-slate-800 leading-none">
                  TIARA <span class="text-transparent bg-clip-text bg-linear-to-r from-yellow-500 to-yellow-600">INVENTORY</span>
                </h1>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto w-full relative">
            <router-view />
        </main>
    </div>

  </div>
</template>

<style>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155; /* slate-700 */
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #475569; /* slate-600 */
}
</style>