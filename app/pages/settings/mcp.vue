<template>
  <div class="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold text-text-heading">Connexion IA (Claude / MCP)</h1>
      <p class="text-text-body/70 text-sm">
        Génère un lien sécurisé en lecture seule pour analyser tes dépenses et investissements avec Claude ou tout autre IA compatible MCP. L'IA ne peut pas modifier tes données.
      </p>
    </div>

    <!-- Generate Card -->
    <div class="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
      <div v-if="newGeneratedToken" class="flex flex-col gap-3 p-4 bg-green-50 border border-green-200 rounded-[16px]">
        <div class="flex items-center gap-2 text-green-700 font-medium">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Nouveau lien généré avec succès
        </div>
        <p class="text-sm text-green-800">
          <strong>Sauvegarde ce lien maintenant, il ne sera plus affiché.</strong>
        </p>
        <div class="flex items-center gap-2 mt-2">
          <input type="text" readonly :value="newGeneratedToken.mcpUrl" 
                 class="flex-1 bg-white border border-green-200 rounded-[12px] px-3 py-2 text-sm text-gray-700 focus:outline-none" />
          <button @click="copyToClipboard" 
                  class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-[12px] transition-colors whitespace-nowrap">
            {{ copied ? 'Copié !' : 'Copier' }}
          </button>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 items-end">
        <div class="flex-1 w-full flex flex-col gap-1.5">
          <label class="text-[14px] font-medium text-text-heading">Label du token</label>
          <input v-model="tokenLabel" type="text" placeholder="Ex: Claude Desktop Mac" 
                 class="w-full bg-[#f8faf9] border-transparent focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/10 rounded-[16px] px-4 py-3 sm:py-3.5 text-[14px] sm:text-[15px] transition-all" />
        </div>
        <button @click="generateToken" :disabled="isGenerating || !tokenLabel"
                class="w-full sm:w-auto h-[48px] sm:h-[52px] px-6 rounded-[16px] bg-primary text-white font-medium hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-2">
          <span v-if="!isGenerating">Générer un nouveau lien MCP</span>
          <span v-else>Génération...</span>
        </button>
      </div>
    </div>

    <!-- Tokens List -->
    <div class="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 mt-4">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-text-heading">Tokens existants</h2>
        <button @click="refreshTokens" class="text-sm text-primary hover:text-primary-dark font-medium px-3 py-1 bg-primary/10 rounded-lg transition-colors">
          Actualiser
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50">
              <th class="px-6 py-4 text-[13px] font-medium text-text-body/60 border-b border-gray-100">Label</th>
              <th class="px-6 py-4 text-[13px] font-medium text-text-body/60 border-b border-gray-100">Créé le</th>
              <th class="px-6 py-4 text-[13px] font-medium text-text-body/60 border-b border-gray-100">Dernière utilisation</th>
              <th class="px-6 py-4 text-[13px] font-medium text-text-body/60 border-b border-gray-100">Statut</th>
              <th class="px-6 py-4 text-[13px] font-medium text-text-body/60 border-b border-gray-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pending" class="border-b border-gray-50">
              <td colspan="5" class="px-6 py-8 text-center text-text-body/50 text-sm">Chargement...</td>
            </tr>
            <tr v-else-if="!tokens || (tokens as any[]).length === 0" class="border-b border-gray-50">
              <td colspan="5" class="px-6 py-8 text-center text-text-body/50 text-sm">Aucun token généré.</td>
            </tr>
            <tr v-for="token in (tokens as any[])" :key="token.id" 
                class="border-b border-gray-50 transition-colors"
                :class="token.revokedAt ? 'opacity-50 bg-gray-50/50' : 'hover:bg-gray-50/50'">
              <td class="px-6 py-4">
                <div class="font-medium text-sm text-text-heading" :class="{'line-through': token.revokedAt}">{{ token.label || 'Token sans nom' }}</div>
              </td>
              <td class="px-6 py-4 text-sm text-text-body/70">
                {{ formatDate(token.createdAt) }}
              </td>
              <td class="px-6 py-4 text-sm text-text-body/70">
                {{ token.lastUsedAt ? formatDate(token.lastUsedAt) : 'Jamais' }}
              </td>
              <td class="px-6 py-4">
                <span v-if="token.revokedAt" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Révoqué
                </span>
                <span v-else class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Actif
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button v-if="!token.revokedAt" @click="revokeToken(token.id)" :disabled="revokingId === token.id"
                        class="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-[8px] transition-colors disabled:opacity-50">
                  {{ revokingId === token.id ? 'Révocation...' : 'Révoquer' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const { data: tokens, pending, refresh } = useFetch('/api/mcp/tokens');

const tokenLabel = ref('');
const isGenerating = ref(false);
const newGeneratedToken = ref<{ id: string; label: string; mcpUrl: string; token: string } | null>(null);
const copied = ref(false);
const revokingId = ref<string | null>(null);

const generateToken = async () => {
  if (!tokenLabel.value) return;
  
  isGenerating.value = true;
  try {
    const res = await $fetch('/api/mcp/tokens', {
      method: 'POST',
      body: { label: tokenLabel.value }
    });
    
    newGeneratedToken.value = res as any;
    tokenLabel.value = '';
    copied.value = false;
    await refresh();
  } catch (e) {
    console.error('Failed to generate token', e);
    alert("Erreur lors de la génération du token");
  } finally {
    isGenerating.value = false;
  }
};

const revokeToken = async (id: string) => {
  if (!confirm("Êtes-vous sûr de vouloir révoquer ce token ? Claude ne pourra plus accéder à vos données avec ce lien.")) return;
  
  revokingId.value = id;
  try {
    await $fetch(`/api/mcp/tokens/${id}`, { method: 'DELETE' });
    await refresh();
  } catch (e) {
    console.error('Failed to revoke token', e);
    alert("Erreur lors de la révocation du token");
  } finally {
    revokingId.value = null;
  }
};

const copyToClipboard = async () => {
  if (!newGeneratedToken.value) return;
  
  try {
    await navigator.clipboard.writeText(newGeneratedToken.value.mcpUrl);
    copied.value = true;
    setTimeout(() => { copied.value = false }, 2000);
  } catch (e) {
    console.error('Failed to copy', e);
  }
};

const refreshTokens = async () => {
  await refresh();
};

const formatDate = (dateString: string | Date) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { 
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
};
</script>
