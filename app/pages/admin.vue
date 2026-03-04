<template>
  <div class="flex flex-col gap-6 lg:gap-10 min-w-0 mx-auto max-w-[1200px] w-full">
    
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden">
      <div>
        <h1 class="text-3xl font-bold text-text-heading tracking-tight mb-2">Administration</h1>
        <p class="text-text-body/60 font-medium">Gérez les utilisateurs et le système.</p>
      </div>
    </div>

    <!-- Users List -->
    <div class="bg-card-inner rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] overflow-hidden flex flex-col grow min-h-[500px]">
      <div v-if="loading" class="flex flex-col items-center justify-center grow gap-4 text-text-body/40">
        <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <span class="text-lg font-medium">Chargement des utilisateurs...</span>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-[#eff3f1]">
              <th class="px-8 py-6 text-text-body/40 font-semibold text-[13px] uppercase tracking-wider">Nom</th>
              <th class="px-8 py-6 text-text-body/40 font-semibold text-[13px] uppercase tracking-wider">Email</th>
              <th class="px-8 py-6 text-text-body/40 font-semibold text-[13px] uppercase tracking-wider">Rôle</th>
              <th class="px-8 py-6 text-text-body/40 font-semibold text-[13px] uppercase tracking-wider">Créé le</th>
              <th class="px-8 py-6 text-text-body/40 font-semibold text-[13px] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#eff3f1]/50">
            <tr v-for="user in users" :key="user.id" class="hover:bg-input-bg/50 transition-colors group">
              <td class="px-8 py-5">
                <span class="text-text-heading font-bold text-[16px]">{{ user.name }}</span>
              </td>
              <td class="px-8 py-5">
                <span class="text-text-body font-medium text-[15px]">{{ user.email }}</span>
              </td>
              <td class="px-8 py-5">
                <span :class="[
                  'px-4 py-1.5 rounded-full text-[13px] font-bold border',
                  user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/10' : 'bg-gray-100 text-gray-600 border-gray-100'
                ]">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-8 py-5">
                <span class="text-text-body/60 font-medium text-[14px]">{{ formatDate(user.createdAt) }}</span>
              </td>
              <td class="px-8 py-5 text-right">
                <div class="flex items-center justify-end gap-3">
                  <!-- Reset Password -->
                  <button 
                    v-if="user.role !== 'admin'"
                    @click="resetPassword(user)"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-[13px] font-bold"
                    title="Réinitialiser le mot de passe"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Reset
                  </button>

                  <!-- Delete -->
                  <button 
                    v-if="user.role !== 'admin'"
                    @click="deleteUser(user)"
                    class="p-2 text-text-body/40 hover:text-red-500 transition-colors"
                    title="Supprimer l'utilisateur"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="users.length === 0 && !loading">
              <td colspan="5" class="px-8 py-20 text-center">
                <div class="flex flex-col items-center gap-4 text-text-body/40">
                  <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span class="text-xl font-medium">Aucun utilisateur trouvé</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Generated Password Modal (Simple Alert for now) -->
    <div v-if="lastGeneratedPassword" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
        <div class="flex flex-col items-center text-center gap-6">
          <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04c-.542 4.105-1.083 8.12-1.832 12.007a11.962 11.962 0 0013.57 0c.75-3.887 1.292-7.902 1.834-12.007z" />
            </svg>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-text-heading mb-2">Mot de passe réinitialisé</h3>
            <p class="text-text-body/60">Veuillez copier le nouveau mot de passe pour l'utilisateur <strong>{{ userBeingReset?.name }}</strong> :</p>
          </div>
          <div class="w-full bg-card-inner border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4">
            <span class="font-mono text-lg font-bold text-primary select-all">{{ lastGeneratedPassword }}</span>
            <button @click="copyToClipboard(lastGeneratedPassword)" class="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
          <button 
            @click="lastGeneratedPassword = null; userBeingReset = null"
            class="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            C'est compris
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

definePageMeta({
  middleware: 'auth'
});

const users = ref<any[]>([]);
const loading = ref(true);
const lastGeneratedPassword = ref<string | null>(null);
const userBeingReset = ref<any | null>(null);

const { user: currentUser } = useUserSession();

// Check if NOT admin and redirect
onMounted(() => {
  if (currentUser.value?.role !== 'admin') {
    navigateTo('/');
  }
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const data = await $fetch('/api/admin/users');
    users.value = data as any[];
  } catch (err) {
    console.error('Failed to fetch users', err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date: string | number | Date) => {
  return new Date(date).toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

const deleteUser = async (user: any) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} ? Toutes ses données seront définitivement supprimées.`)) return;
  
  try {
    await $fetch(`/api/admin/users/${user.id}`, {
      method: 'DELETE'
    });
    users.value = users.value.filter(u => u.id !== user.id);
  } catch (err: any) {
    console.error('Failed to delete user', err);
    alert(err.statusMessage || 'Une erreur est survenue lors de la suppression.');
  }
};

const resetPassword = async (user: any) => {
  if (!confirm(`Générer un nouveau mot de passe pour ${user.name} ?`)) return;
  
  try {
    const response = await $fetch(`/api/admin/users/${user.id}/reset-password`, {
      method: 'POST'
    });
    userBeingReset.value = user;
    lastGeneratedPassword.value = (response as any).newPassword;
  } catch (err: any) {
    console.error('Failed to reset password', err);
    alert(err.statusMessage || 'Une erreur est survenue lors de la réinitialisation.');
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  alert('Mot de passe copié !');
};

onMounted(fetchUsers);
</script>

<style scoped>
::selection {
  background: rgba(41, 75, 60, 0.2);
  color: #294b3c;
}
</style>
