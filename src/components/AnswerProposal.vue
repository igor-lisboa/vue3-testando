<template>
  <template v-if="loading == false">
    <template v-if="proposal.ladoId == sideId">
      <h1>Você recebeu uma proposta de {{ actionSufix }}</h1>
      <p class="lead">Clique na resposta desejada</p>

      <div class="mt-3">
        <div class="btn-group" role="group">
          <template v-for="option in options" v-bind:key="option.id">
            <input
              type="radio"
              class="btn-check"
              :id="'btnSelectedSide' + option.id"
              :value="option.id"
              v-model="selectedOption"
            />
            <label
              class="btn btn-outline-primary"
              :for="'btnSelectedSide' + option.id"
              >{{ option.text }}</label
            >
          </template>
        </div>
      </div>

      <button
        class="btn btn-lg btn-light fw-bold border-white mt-3"
        @click="answeProposal"
      >
        Responder
      </button>
    </template>
    <template v-else>
      <h1>Aguarde a resposta da proposta de {{ actionSufix }}...</h1>
    </template>
  </template>
  <template v-else>
    <div class="spinner-border text-light" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </template>
</template>
<script lang="ts">
import { io } from "socket.io-client";
import { defineComponent, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../api";
export default defineComponent({
  name: "AnswerProposal",
  setup: () => {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(false);
    const sideId: number = parseInt(route.params.sideId.toString());
    const chessId: number = parseInt(route.params.id.toString());
    const type: string = route.params.type.toString();
    const selectedOption = ref<number | null>(null);
    const proposal = ref<{
      acao: string;
      ladoId: number;
    }>({ acao: "", ladoId: -1 });

    const socket = io(import.meta.env.VITE_API_CHESS?.toString(), {
      query: { jogador: `${chessId}-${sideId}` },
    });

    socket.on("empatePropostoResposta", async () => {
      await populateGame();
    });

    socket.on("resetPropostoResposta", async () => {
      await populateGame();
    });

    let actionSufix: string = "";
    if (type == "tie") {
      actionSufix = "Empate";
    } else if (type == "reset") {
      actionSufix = "Reset";
    } else {
      router.push({ name: "game", params: { id: chessId, sideId } });
    }

    const options = ref<
      {
        id: number;
        value: boolean;
        text: string;
      }[]
    >([
      { id: 0, value: true, text: "Aceitar" },
      { id: 1, value: false, text: "Recusar" },
    ]);

    const chess = ref<{
      id: number;
      acoesSolicitadas: { acao: string; ladoId: number }[];
      ladoIdAtual: number;
    }>({
      id: -1,
      acoesSolicitadas: [],
      ladoIdAtual: 0,
    });

    const getGame = async (gameId: number) => {
      loading.value = true;
      return await api
        .get(`/jogos/${gameId}/simples?tabuleiroSuperSimplificado=true`)
        .then((res) => {
          loading.value = false;
          return res.data.data;
        })
        .catch((err) => {
          alert(err?.response?.data?.message);
          router.push({ name: "home" });
          loading.value = false;
          return chess.value;
        });
    };

    const populateGame = async () => {
      chess.value = await getGame(chessId);

      const proposalGot = chess.value.acoesSolicitadas.find(
        (requiredAction) =>
          requiredAction.acao == "responderProposta" + actionSufix
      );
      if (proposalGot == undefined) {
        router.push({ name: "game", params: { id: chessId, sideId } });
      } else {
        proposal.value = proposalGot;
      }
    };

    const answeProposal = async () => {
      loading.value = true;
      await api
        .post(
          `/jogos/${chessId}/${actionSufix.toLowerCase()}/responde`,
          {
            resposta: selectedOption.value == 0 ? true : false,
          },
          {
            headers: {
              lado: sideId,
            },
          }
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

    onMounted(async () => {
      await populateGame();
    });

    return {
      answeProposal,
      actionSufix,
      loading,
      proposal,
      options,
      selectedOption,
      sideId,
    };
  },
});
</script>