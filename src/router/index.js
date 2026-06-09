import { createRouter, createWebHistory } from 'vue-router'

import Login from '../pages/Login.vue'
import DashboardInventory from '../pages/DashboardInventory.vue'
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
import PecahBarang from '../pages/PecahBarang.vue'

import { hasPermission } from '../utils/permission'

const routes = [
  { path: '/', redirect: '/dashboard' }, 
  { path: '/login', component: Login },
  { path: '/dashboard', component: DashboardInventory, meta: { requiresAuth: true, requiredPermission: 'app_inventory' } },
  { path: '/bahan', component: MasterBahan, meta: { requiresAuth: true, requiredPermission: 'manage_master_bahan' } },
  { path: '/resep', component: MasterResep, meta: { requiresAuth: true, requiredPermission: 'manage_resep' } },
  { path: '/komposit', component: MasterKomposit, meta: { requiresAuth: true, requiredPermission: 'manage_komposit' } },
  { path: '/barang', component: MasterBarang, meta: { requiresAuth: true, requiredPermission: 'manage_master_barang' } },
  { path: '/input-produksi', component: InputProduksi, meta: { requiresAuth: true, requiredPermission: ['manage_produksi_masak', 'manage_produksi_matang', 'manage_barang_rusak'] } },
  { path: '/laporan-pengeluaran', component: LaporanPengeluaran, meta: { requiresAuth: true, requiredPermission: 'view_jurnal_dapur' } },
  { path: '/konversi', component: KonversiPagi, meta: { requiresAuth: true, requiredPermission: 'manage_produksi_masak' } },
  { path: '/opname', component: StockOpname, meta: { requiresAuth: true, requiredPermission: 'manage_opname' } },
  { path: '/tutup-buku', component: TutupBuku, meta: { requiresAuth: true, requiredPermission: 'manage_tutup_buku' } },
  { path: '/pecah-barang', component: PecahBarang, meta: { requiresAuth: true, requiredPermission: 'manage_pecah_barang' } },
  { path: '/sampah-inventory', component: SampahInventory, meta: { requiresAuth: true, requiredPermission: 'manage_sampah' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from) => {
  const token = localStorage.getItem('inventory_token')
  const isTokenValid = token && token !== 'null' && token !== 'undefined' && token.trim() !== ''

  if (to.meta.requiresAuth) {
    if (!isTokenValid) {
      return '/login'
    }

    const required = to.meta.requiredPermission
    const hasAccess = required ? hasPermission(required) : true

    if (!hasAccess) {
      window.$dialog?.alert(`Akses Ditolak! Anda tidak diizinkan melihat halaman ini.`)
      return '/login'
    }
  } else {
    // Kalau sudah login mau ke halaman login, kembalikan ke dashboard
    if (isTokenValid && to.path === '/login') {
      if (hasPermission('app_inventory')) return '/dashboard'
    }
  }

  // 3. Sisanya, biarkan lewat
  return true
})

export default router