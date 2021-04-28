<template>
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
    const selectedSide = ref<number | null>(null);
    const chessId: number = parseInt(route.params.id.toString());
    const emptySides = ref<{ id: number; lado: string }[]>([]);

    const enterInGame = () => {
      if (selectedSide.value != null) {
        router.push({
          name: "game",
          params: { id: chessId, sideId: selectedSide.value },
        });
      } else {
        alert("Selecione um lado para entrar no jogo!");
      }
    };

    const getGameEmptySides = async () => {
      return await api
        .get(`/jogos/${chessId}/lado-sem-jogador`)
        .then((res) => {
          return res.data.data;
        })
        .catch((err) => {
          alert(err.response.data.message);
          router.push({ name: "home" });
        });
    };

    const populateGameEmptySides = async () => {
      emptySides.value = await getGameEmptySides();
    };

    onMounted(async () => {
      await populateGameEmptySides();
    });

    return {
      selectedSide,
      emptySides,
      enterInGame,
    };
  },
});
</script>