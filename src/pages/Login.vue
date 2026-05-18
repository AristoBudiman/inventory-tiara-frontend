<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

// Ping server di awal agar Render mulai bangun lebih cepat
onMounted(() => {
  fetch(`${import.meta.env.VITE_API_URL}/`).catch(() => {})
})

const handleLogin = async () => {
  isLoading.value = true
  errorMsg.value = ''

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    
    const data = await res.json()

    if (res.ok) {
      // Menggunakan key inventory_token sesuai aslinya
      localStorage.setItem('inventory_token', data.token)
      localStorage.setItem('admin_role', data.role)
      router.push('/') 
    } else {
      errorMsg.value = data.error || 'Username atau Password salah!'
    }
  } catch (err) {
    errorMsg.value = "Gagal terhubung. Pastikan server aktif atau periksa internet Anda."
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-8">
    
    <div class="bg-white min-h-[85vh] w-full rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center font-sans text-slate-900">
      
      <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        
        <div class="text-center mb-8">
          <div class="mx-auto bg-yellow-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-yellow-100 shadow-sm">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h1 class="text-2xl font-black text-yellow-600 tracking-tight">Tiara Bakery</h1>
          <p class="text-slate-500 text-sm font-medium mt-1">Inventory & Production System</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          
          <div v-if="errorMsg" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
            <svg class="w-5 h-5 text-red-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p class="text-sm text-red-700 font-bold">{{ errorMsg }}</p>
          </div>
          
          <div>
            <label class="block text-slate-700 text-sm font-bold mb-1.5">Username</label>
            <input 
              v-model="username" 
              type="text" 
              class="w-full bg-white text-slate-900 border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-shadow font-medium" 
              placeholder="Masukkan username"
              required
              :disabled="isLoading"
            >
          </div>
          
          <div>
            <label class="block text-slate-700 text-sm font-bold mb-1.5">Password</label>
            <input 
              v-model="password" 
              type="password" 
              class="w-full bg-white text-slate-900 border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-shadow font-medium" 
              placeholder="••••••••"
              required
              :disabled="isLoading"
            >
          </div>

          <div v-if="isLoading" class="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-start gap-3 mt-2">
              <span class="text-xl">⏳</span>
              <div>
                 <p class="text-sm font-bold text-yellow-800">Membangunkan server...</p>
                 <p class="text-[10px] font-medium text-yellow-700 leading-tight mt-0.5">Mohon tunggu sekitar 50 detik jika ini login pertama. Sistem sedang menyiapkan database.</p>
              </div>
          </div>

          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-6 active:scale-[0.98]"
          >
            <span v-if="isLoading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memverifikasi...
            </span>
            <span v-else>Masuk Sistem Inventory</span>
          </button>
        </form>
        
      </div>
    </div>
  </div>
</template>