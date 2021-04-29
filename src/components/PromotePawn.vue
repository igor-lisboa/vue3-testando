<template>
  <template v-if="loading == false">
    <h1>Escolha uma peça para promover seu peão</h1>
    <p class="lead">Clique na opção desejada</p>

    <div class="mt-3">
      <div class="btn-group" role="group">
        <template v-for="piece in pieces" v-bind:key="piece.id">
          <input
            type="radio"
            class="btn-check"
            :id="'btnSelectedSide' + piece.id"
            :value="piece.id"
            v-model="selectedPiece"
          />
          <label
            class="btn btn-outline-primary"
            :for="'btnSelectedSide' + piece.id"
            >{{ piece.nome }}</label
          >
        </template>
      </div>
    </div>

    <button
      class="btn btn-lg btn-light fw-bold border-white mt-3"
      @click="promotePawn"
    >
      Selecionar Peça
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
  name: "PromotePawn",
  setup: () => {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(false);
    const sideId: number = parseInt(route.params.sideId.toString());
    const chessId: number = parseInt(route.params.id.toString());
    const selectedPiece = ref<number | null>(null);

    const pieces = ref<
      {
        id: number;
        classe: string;
        nome: string;
        unicodeBranco: string;
        unicodePreto: string;
      }[]
    >([]);

    const chess = ref<{
      id: number;
      acoesSolicitadas: { acao: string; ladoId: number }[];
      ladoIdAtual: number;
    }>({
      id: -1,
      acoesSolicitadas: [],
      ladoIdAtual: 0,
    });

    const getPieces = async () => {
      loading.value = true;
      return await api
        .get(`/tipos-de-peca/promocao-peao`)
        .then((res) => {
          loading.value = false;
          return res.data.data;
        })
        .catch((err) => {
          loading.value = false;
          alert(err?.response?.data?.message);
          return [];
        });
    };

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

      const requiredActionsForThisSide = chess.value.acoesSolicitadas.filter(
        (requiredAction) => requiredAction.ladoId == sideId
      );
      if (requiredActionsForThisSide.length > 0) {
        const promotePawn = requiredActionsForThisSide.find(
          (requiredAction) => requiredAction.acao == "promocaoPeao"
        );
        if (promotePawn == undefined) {
          router.push({ name: "game", params: { id: chessId, sideId } });
        }
      } else {
        router.push({ name: "game", params: { id: chessId, sideId } });
      }
    };

    const promotePawn = async () => {
      loading.value = true;
      await api
        .post(
          `/jogos/${chessId}/promove-peao/${selectedPiece.value}`,
          {},
          { headers: { lado: sideId } }
        )
        .then((res) => {
          loading.value = false;
          alert(res.data.message);
          router.push({ name: "game", params: { id: chessId, sideId } });
        })
        .catch((err) => {
          loading.value = false;
          alert(err?.response?.data?.message);
          router.push({ name: "game", params: { id: chessId, sideId } });
        });
    };

    const populatePieces = async () => {
      pieces.value = await getPieces();
    };

    onMounted(async () => {
      await populateGame();
      await populatePieces();
    });

    return {
      pieces,
      selectedPiece,
      loading,
      promotePawn,
    };
  },
});
</script>