/**
 * permission.js
 * Utilitas untuk mengecek hak akses (RBAC) di sistem Inventory.
 */

export const hasPermission = (requiredPermission) => {
  const role = localStorage.getItem('admin_role')
  
  // Superadmin bypass
  if (role === 'Superadmin' || role === 'superadmin') return true

  // Ambil daftar permissions dari localStorage (disimpan saat login)
  let permissions = []
  try {
    const permsString = localStorage.getItem('inventory_permissions')
    if (permsString) {
      permissions = JSON.parse(permsString)
    }
  } catch (e) {
    console.error("Gagal parse permissions", e)
  }

  // Jika requiredPermission adalah array, cek apakah user memiliki SALAH SATU izin.
  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some(perm => permissions.includes(perm))
  }

  // Jika requiredPermission adalah string tunggal
  return permissions.includes(requiredPermission)
}
