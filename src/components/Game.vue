<template>
  <template v-if="loading == false">
    <div v-if="chess?.finalizado == null" class="chessboard">
      <div
        v-for="(item, index) in board"
        v-bind:key="index"
        :class="
          'board-house ' +
          (equivalenceTable[index].casa == originMove?.casa ? 'yellow ' : '') +
          (possibleMoves.find(
            (possibleMove) =>
              possibleMove.casaDestino.casa == equivalenceTable[index].casa
          ) != undefined
            ? possibleMoves.find(
                (possibleMove) =>
                  possibleMove.casaDestino.casa == equivalenceTable[index].casa
              )?.captura == true
              ? 'red '
              : 'green '
            : '') +
          (Math.floor(index / 8) % 2 == (index % 2) % 2
            ? sideId == 1
              ? 'white'
              : 'black'
            : sideId == 1
            ? 'black'
            : 'white')
        "
        @click="getPossibleMovesOrMakeMove(index)"
      >
        {{ item != null ? getPiece(item) : null }}
      </div>
    </div>
    <div v-else>
      <h1>{{ chess?.finalizado }}</h1>
    </div>
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
import api from "../api/index";
export default defineComponent({
  name: "Game",
  setup: () => {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(false);
    const sideId: number = parseInt(route.params.sideId.toString());
    const chessId: number = parseInt(route.params.id.toString());
    const chess = ref<{
      id: number;
      acoesSolicitadas: string[];
      chequeLadoAtual: boolean;
      empatePropostoPeloLadoId: number;
      tipoJogo: string;
      tabuleiro: (string | null)[][];
      tempoDeTurnoEmMilisegundos: number;
      finalizado: string | null;
    } | null>(null);
    const board = ref<(string | null)[]>([]);
    const equivalenceTable = ref<
      {
        casa: string;
        linha: number;
        coluna: number;
      }[]
    >([]);
    const pieces = ref([]);
    const possibleMoves = ref<
      {
        casaOrigem: {
          casa: string;
          linha: number;
          coluna: number;
        };
        casaDestino: {
          casa: string;
          linha: number;
          coluna: number;
        };
        nome: string | null;
        captura: boolean;
      }[]
    >([]);
    const originMove = ref<{
      casa: string;
      linha: number;
      coluna: number;
    } | null>(null);

    const getGame = async (gameId: number) => {
      loading.value = true;
      const chess: {
        id: number;
        acoesSolicitadas: string[];
        chequeLadoAtual: boolean;
        empatePropostoPeloLadoId: number;
        tipoJogo: string;
        tabuleiro: (string | null)[][];
        tempoDeTurnoEmMilisegundos: number;
        finalizado: string | null;
      } | null = await api
        .get(`/jogos/${gameId}/simples?tabuleiroSuperSimplificado=true`)
        .then((res) => {
          loading.value = false;
          return res.data.data;
        })
        .catch((err) => {
          loading.value = false;
          alert(err.response.data.message);
          return null;
        });

      let board: (string | null)[] = [];
      if (chess != null) {
        board = chess.tabuleiro.flat();
      }

      return { chess, board };
    };

    const getPieces = async () => {
      loading.value = true;
      return await api
        .get(`/tipos-de-peca`)
        .then((res) => {
          loading.value = false;
          return res.data.data;
        })
        .catch((err) => {
          loading.value = false;
          alert(err.response.data.message);
          return [];
        });
    };

    const getEquivalenceTable = async () => {
      loading.value = true;
      return await api
        .get(`/tabela-equivalencia`)
        .then((res) => {
          loading.value = false;
          return res.data.data;
        })
        .catch((err) => {
          loading.value = false;
          alert(err.response.data.message);
          return [];
        });
    };

    const getPiece = (item: string) => {
      const itemParts = item.split("-");
      const piece = pieces.value.find((piece) => piece["nome"] == itemParts[0]);
      if (piece != undefined) {
        if (parseInt(itemParts[1]) == 0) {
          return piece["unicodeBranco"];
        }
        return piece["unicodePreto"];
      }
    };

    const getPossibleMovesOrMakeMove = async (boardHouseIndex: number) => {
      const desiredItem = equivalenceTable.value[boardHouseIndex];
      if (
        possibleMoves.value.find(
          (possibleMove) => possibleMove.casaDestino.casa == desiredItem.casa
        ) != undefined &&
        originMove.value != null
      ) {
        await api
          .post(
            `/jogos/${chessId}/pecas/${originMove.value.casa}/move/${desiredItem.casa}`,
            { headers: { lado: sideId } }
          )
          .then((res) => {
            console.log(res.data);
            originMove.value = null;
            possibleMoves.value = [];
          })
          .catch((err) => {
            alert(err.response.data.message);
            possibleMoves.value = [];
            originMove.value = null;
          });
      } else {
        originMove.value = null;
        possibleMoves.value = [];
        await api
          .get(
            `/jogos/${chessId}/pecas/${desiredItem.casa}/possiveis-jogadas`,
            { headers: { lado: sideId } }
          )
          .then((res) => {
            possibleMoves.value = res.data.data;
            originMove.value = desiredItem;
          })
          .catch((err) => {
            alert(err.response.data.message);
            possibleMoves.value = [];
            originMove.value = null;
          });
      }
    };

    const populateGame = async () => {
      const game = await getGame(chessId);
      let equivalenceTableGot = await getEquivalenceTable();
      let gameBoard = game.board;

      if (gameBoard.length == 0) {
        router.push({ name: "home" });
      }

      // if is the black side revert
      if (sideId == 1) {
        equivalenceTableGot = equivalenceTableGot.reverse();
        gameBoard = gameBoard.reverse();
      }

      pieces.value = await getPieces();
      equivalenceTable.value = equivalenceTableGot;
      board.value = gameBoard;
      chess.value = game.chess;
    };

    onMounted(async () => {
      await populateGame();
    });

    return {
      chessId,
      equivalenceTable,
      board,
      chess,
      sideId,
      getPiece,
      getPossibleMovesOrMakeMove,
      possibleMoves,
      loading,
      originMove,
    };
  },
});
</script>

<style scoped>
.chessboard {
  width: 655px;
  height: 655px;
  margin: auto;
}

.board-house:hover {
  background-color: lightblue;
}

.board-house:active {
  background-color: blueviolet;
}

.board-house {
  transition: background-color 0.5s ease;
  cursor: pointer;
  float: left;
  width: 80px;
  height: 80px;
  font-size: 50px;
  text-align: center;
  display: table-cell;
  vertical-align: middle;
  border: 0.5px solid black;
}

.black {
  background-color: #999;
}
.white {
  background-color: #fff;
}

.yellow {
  background-color: yellow;
}

.green {
  background-color: greenyellow;
}

.red {
  background-color: red;
}
</style>
