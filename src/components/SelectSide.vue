<template>
  <template v-if="loading == false">
    <template v-if="emptySides.length > 0">
      <h1>Escolha um lado disponível para esse jogo</h1>
      <p class="lead">Clique na opção desejada</p>

      <div class="mt-3">
        <div class="btn-group" role="group">
          <template v-for="emptySide in emptySides" v-bind:key="emptySide.id">
            <input
              type="radio"
              class="btn-check"
              :id="'btnSelectedSide' + emptySide.id"
              :value="emptySide.id"
              v-model="selectedSide"
            />
            <label
              class="btn btn-outline-primary"
              :for="'btnSelectedSide' + emptySide.id"
              >{{ emptySide.lado }}</label
            >
          </template>
        </div>
      </div>

      <button
        class="btn btn-lg btn-light fw-bold border-white mt-3"
        @click="enterInGame"
      >
        Entrar no Jogo
      </button>
    </template>
    <template v-else>
      <h1>Esse jogo não possui lados disponíveis</h1>
      <button
        class="btn btn-lg btn-light fw-bold border-white mt-3"
        @click="goToHomePage"
      >
        Novo Jogo?
      </button>
    </template>
  </template>
  <template v-else>
    <div class="spinner-border text-light" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </template>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../api";
export default defineComponent({
  name: "SelectSide",
  setup: () => {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(false);
    const selectedSide = ref<number | null>(null);
    const chessId: number = parseInt(route.params.id.toString());
    const emptySides = ref<{ id: number; lado: string }[]>([]);

    const enterInGame = async () => {
      loading.value = true;
      await api
        .post(`/jogos/${chessId}/jogadores`, {
          ladoId: selectedSide.value,
          tipoId: "0",
        })
        .then((res) => {
          loading.value = false;
          if (selectedSide.value != null) {
            router.push({
              name: "game",
              params: { id: chessId, sideId: selectedSide.value },
            });
          }
          return res.data.data;
        })
        .catch((err) => {
          loading.value = false;
          alert(err?.response?.data?.message);
        });
    };

    const getGameEmptySides = async () => {
      loading.value = true;
      return await api
        .get(`/jogos/${chessId}/lado-sem-jogador`)
        .then((res) => {
          loading.value = false;
          return res.data.data;
        })
        .catch((err) => {
          loading.value = false;
          alert(err?.response?.data?.message);
          router.push({ name: "home" });
          return [];
        });
    };

    const populateGameEmptySides = async () => {
      emptySides.value = await getGameEmptySides();
    };

    const goToHomePage = () => {
      router.push({ name: "home" });
    };

    onMounted(async () => {
      await populateGameEmptySides();
    });

    return {
      selectedSide,
      emptySides,
      enterInGame,
      loading,
      goToHomePage,
    };
  },
});
</script>