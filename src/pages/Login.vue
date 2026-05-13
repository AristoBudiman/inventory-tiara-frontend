<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

onMounted(() => {
  // Tembak rute root "/" diam-diam untuk membangunkan Golang dari tidur
  fetch(`${import.meta.env.VITE_API_URL}/`).catch(() => {})
})

const router = useRouter()
const username = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

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
      // Simpan kunci gembok (token) ke penyimpanan browser
      localStorage.setItem('inventory_token', data.token)
      localStorage.setItem('admin_role', data.role)
      // Buka gerbang, masuk ke halaman utama!
      router.push('/') 
    } else {
      errorMsg.value = data.error || 'Username atau Password salah'
    }
  } catch (err) {
    errorMsg.value = 'Gagal terhubung ke server backend!'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-200">
    <div class="bg-white p-10 rounded-2xl shadow-xl w-full max-w-sm border-t-8 border-yellow-500">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-black text-gray-900 tracking-wider">TIARA</h1>
        <h2 class="text-lg font-bold text-yellow-600 tracking-widest uppercase">Inventory System</h2>
      </div>
      
      <div v-if="errorMsg" class="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg mb-6 text-center font-bold text-sm shadow-sm">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Username</label>
          <input v-model="username" type="text" required class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-yellow-500 outline-none font-bold text-gray-800 transition">
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Password</label>
          <input v-model="password" type="password" required class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-yellow-500 outline-none font-bold text-gray-800 transition">
        </div>
        <button type="submit" :disabled="isLoading" class="w-full bg-gray-900 text-yellow-400 font-black py-3.5 rounded-lg shadow-md hover:bg-black transition mt-4 disabled:opacity-50 text-lg">
          {{ isLoading ? 'TUNGGU...' : 'MASUK' }}
        </button>
      </form>
    </div>
  </div>
</template>