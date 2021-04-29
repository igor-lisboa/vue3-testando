<template>
  <template v-if="loading == false">
    <h1>{{ chess?.finalizado }}</h1>
    <button
      class="btn btn-lg btn-light fw-bold border-white mt-3"
      @click="goToHomePage"
    >
      Novo Jogo?
    </button>
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
  name: "EndGame",
  setup: () => {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(false);
    const sideId: number = parseInt(route.params.sideId.toString());
    const chessId: number = parseInt(route.params.id.toString());

    const chess = ref<{
      id: number;
      finalizado: string | null;
    }>({
      id: -1,
      finalizado: null,
    });

    const getGame = async (gameId: number) => {
      return await api
        .get(`/jogos/${gameId}/simples?tabuleiroSuperSimplificado=true`)
        .then((res) => {
          return res.data.data;
        })
        .catch((err) => {
          alert(err?.response?.data?.message);
          router.push({ name: "home" });
          return chess.value;
        });
    };

    const populateGame = async () => {
      chess.value = await getGame(chessId);

      if (chess.value.finalizado == null) {
        router.push({ name: "game", params: { id: chessId, sideId } });
      }
    };

    onMounted(async () => {
      await populateGame();
    });

    const goToHomePage = () => {
      router.push({ name: "home" });
    };

    return {
      chess,
      loading,
      goToHomePage,
    };
  },
});
</script>