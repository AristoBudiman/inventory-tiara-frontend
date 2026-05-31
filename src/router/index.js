import { createRouter, createWebHistory } from 'vue-router'

import Login from '../pages/Login.vue'
import MasterBahan from '../pages/MasterBahan.vue'
import MasterResep from '../pages/MasterResep.vue'
import MasterKomposit from '../pages/MasterKomposit.vue'
import MasterBarang from '../pages/MasterBarang.vue'
import InputProduksi from '../pages/InputProduksi.vue'
import LaporanPengeluaran from '../pages/LaporanPengeluaran.vue'
import SampahInventory from '../pages/SampahInventory.vue'
import KonversiPagi from '../pages/Konversi.vue'
import StockOpname from '../pages/StockOpname.vue'
import TutupBuku from '../pages/TutupBuku.vue'

const routes = [
  { path: '/', redirect: '/bahan' }, 
  { path: '/login', component: Login },
  { path: '/bahan', component: MasterBahan },
  { path: '/resep', component: MasterResep },
  { path: '/komposit', component: MasterKomposit },
  { path: '/barang', component: MasterBarang },
  { path: '/input-produksi', component: InputProduksi },
  { path: '/laporan-pengeluaran', component: LaporanPengeluaran },
  { path: '/konversi', component: KonversiPagi },
  { path: '/opname', component: StockOpname },
  { path: '/tutup-buku', component: TutupBuku },
  { path: '/sampah-inventory', component: SampahInventory },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from) => {
  const token = localStorage.getItem('inventory_token')
  const isTokenValid = token && token !== 'null' && token !== 'undefined' && token.trim() !== ''

  // 1. Jika belum login (token kosong), lempar ke halaman login
  if (to.path !== '/login' && !isTokenValid) {
    return '/login'
  }

  // 2. Jika sudah punya token tapi iseng buka halaman /login, tendang ke dalam
  if (to.path === '/login' && isTokenValid) {
    return '/bahan'
  }

  // 3. Sisanya, biarkan lewat
  return true
})

export default router