<template>
  <div class="chessboard">
    <div
      v-for="(item, index) in board"
      v-bind:key="index"
      :class="
        'board-house ' +
        (possibleMoves.includes(index)
          ? item != null
            ? 'red '
            : 'green '
          : '') +
        (Math.floor(index / 8) % 2 == (index % 2) % 2
          ? reverse
            ? 'white'
            : 'black'
          : reverse
          ? 'black'
          : 'white')
      "
      @click="getPossibleMoves(index)"
    >
      {{ item != null ? getPiece(item.tipo, item.ladoId) : "" }}
    </div>
  </div>
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
    const sideId: number = 1;
    const chessId: string = route.params.id.toString();
    let reverse: boolean = false;
    let chess = ref({});
    let board = ref<
      ({
        ladoId: number;
        valor: number;
        tipo: string;
        passosHabilitados: number;
        movimentacao: { direcao: string; opcoes: string[] }[];
      } | null)[]
    >([]);
    let equivalenceTable = ref([]);
    let pieces = ref([]);
    let possibleMoves = ref<number[]>([]);

    if (sideId == 1) {
      reverse = true;
    }

    const getGame = async (gameId: string) => {
      const chess = await api
        .get(`/jogos/${gameId}`)
        .then((res) => {
          return res.data.data;
        })
        .catch((err) => {
          alert(err.response.data.message);
          return {
            tabuleiro: { casas: [] },
          };
        });

      const board: ({
        ladoId: number;
        valor: number;
        tipo: string;
        passosHabilitados: number;
        movimentacao: { direcao: string; opcoes: string[] }[];
      } | null)[] = chess.tabuleiro.casas.flat();

      return { chess, board };
    };

    const getPieces = async () => {
      return await api
        .get(`/tipos-de-peca`)
        .then((res) => {
          return res.data.data;
        })
        .catch((err) => {
          alert(err.response.data.message);
          return [];
        });
    };

    const getEquivalenceTable = async () => {
      return await api
        .get(`/tabela-equivalencia`)
        .then((res) => {
          return res.data.data;
        })
        .catch((err) => {
          alert(err.response.data.message);
          return [];
        });
    };

    const getPiece = (type: string, side: number) => {
      const piece = pieces.value.find((piece) => piece["nome"] == type);
      if (piece != undefined) {
        if (side == 0) {
          return piece["unicodeBranco"];
        }
        return piece["unicodePreto"];
      }
    };

    const getPossibleMoves = async (boardHouseIndex: number) => {
      possibleMoves.value = [];
      return await api
        .get(
          `/jogos/${chessId}/pecas/${equivalenceTable.value[boardHouseIndex]["casa"]}/possiveis-jogadas`,
          { headers: { lado: sideId } }
        )
        .then((res) => {
          res.data.data.forEach(
            (possibleMove: {
              casaDestino: { casa: string; coluna: number; linha: number };
            }) => {
              const item:
                | {
                    casa: string;
                    linha: number;
                    coluna: number;
                  }
                | undefined = equivalenceTable.value.find(
                (boardHouse) =>
                  boardHouse["casa"] == possibleMove["casaDestino"]["casa"]
              );
              if (item != undefined) {
                possibleMoves.value.push(equivalenceTable.value.indexOf(item));
              }
            }
          );
        })
        .catch((err) => {
          alert(err.response.data.message);
          return [];
        });
    };

    const populateGame = async () => {
      let game = await getGame(chessId);
      equivalenceTable.value = await getEquivalenceTable();
      pieces.value = await getPieces();

      chess.value = game.chess;
      board.value = game.board;

      if (board.value.length == 0) {
        router.push({ name: "home" });
      }

      // if is the black side revert
      if (reverse) {
        equivalenceTable.value.reverse();
        board.value.reverse();
      }
    };

    onMounted(async () => {
      await populateGame();
    });

    return {
      chessId,
      board,
      chess,
      reverse,
      getPiece,
      getPossibleMoves,
      possibleMoves,
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

.green {
  background-color: greenyellow;
}

.red {
  background-color: red;
}
</style>
