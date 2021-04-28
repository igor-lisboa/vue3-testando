<template>
  <template v-if="loading == false">
    <ul v-if="chess.acoesSolicitadas.length > 0">
      <li
        v-for="(acaoSolicitada, index) in chess?.acoesSolicitadas"
        v-bind:key="index"
      >
        {{ acaoSolicitada }}
      </li>
    </ul>
    <div
      v-if="chess.finalizado == null"
      :class="
        'chessboard ' + (chess.ladoIdAtual == sideId ? 'borda-lado-da-vez' : '')
      "
    >
      <div
        v-for="(item, index) in board"
        v-bind:key="index"
        :class="
          'board-house ' +
          (item.movementOrigin ? 'yellow ' : '') +
          (item.possibleMovement ? 'green ' : '') +
          (item.catchPiece ? 'red ' : '') +
          item.backgroundColor
        "
        :title="
          item.house +
          (item.movementName != null ? ' | ' + item.movementName : '')
        "
        @click="getPossibleMovesOrMakeMove(index)"
      >
        {{ item?.piece?.unicode }}
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
      empatePropostoPeloLadoId: number | null;
      tipoJogo: string;
      tabuleiro: (string | null)[][];
      tempoDeTurnoEmMilisegundos: number;
      ladoIdAtual: number;
      finalizado: string | null;
    }>({
      id: -1,
      acoesSolicitadas: [],
      chequeLadoAtual: false,
      empatePropostoPeloLadoId: null,
      tipoJogo: "",
      ladoIdAtual: 0,
      tabuleiro: [[]],
      tempoDeTurnoEmMilisegundos: -1,
      finalizado: null,
    });
    const board = ref<
      {
        house: string;
        line: number;
        column: number;
        possibleMovement: boolean;
        movementName: string | null;
        catchPiece: boolean;
        movementOrigin: boolean;
        piece: {
          nome: string;
          ladoId: number;
          unicode: string;
        } | null;
        backgroundColor: string;
      }[]
    >([]);
    const pieces = ref<
      {
        id: number;
        classe: string;
        nome: string;
        unicodeBranco: string;
        unicodePreto: string;
      }[]
    >([]);
    const equivalenceTable = ref<
      {
        casa: string;
        linha: number;
        coluna: number;
      }[]
    >([]);

    const getGame = async (gameId: number) => {
      loading.value = true;
      return await api
        .get(`/jogos/${gameId}/simples?tabuleiroSuperSimplificado=true`)
        .then((res) => {
          loading.value = false;
          return res.data.data;
        })
        .catch((err) => {
          loading.value = false;
          alert(err.response.data.message);
          router.push({ name: "home" });
        });
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

    const getPiece = (item: string | null) => {
      if (item == null) {
        return null;
      }
      const itemParts = item.split("-");
      const piece = pieces.value.find((piece) => piece.nome == itemParts[0]);
      if (piece != undefined) {
        return {
          nome: piece.nome,
          ladoId: parseInt(itemParts[1]),
          unicode:
            parseInt(itemParts[1]) == 0
              ? piece.unicodeBranco
              : piece.unicodePreto,
        };
      } else {
        return null;
      }
    };

    const cleanPossibleMovements = (
      boardMovementOrigin:
        | {
            house: string;
            line: number;
            column: number;
            possibleMovement: boolean;
            movementName: string | null;
            catchPiece: boolean;
            movementOrigin: boolean;
            piece: {
              nome: string;
              ladoId: number;
              unicode: string;
            } | null;
            backgroundColor: string;
          }
        | undefined
    ) => {
      if (boardMovementOrigin != undefined) {
        const indexBoardMovementOrigin = board.value.indexOf(
          boardMovementOrigin
        );
        board.value[indexBoardMovementOrigin].movementOrigin = false;
        board.value
          .filter((boardItem) => boardItem.possibleMovement == true)
          .forEach((boardItemMovement) => {
            boardItemMovement.possibleMovement = false;
            boardItemMovement.catchPiece = false;
            boardItemMovement.movementName = null;
          });
      }
    };

    const getPossibleMovesOrMakeMove = async (boardHouseIndex: number) => {
      const desiredItem = equivalenceTable.value[boardHouseIndex];
      const boardMovementOrigin = board.value.find(
        (boardItem) => boardItem.movementOrigin == true
      );
      const possibleMovementDestination = board.value.find(
        (boardItem) =>
          boardItem.house == desiredItem.casa &&
          boardItem.possibleMovement == true
      );
      if (
        boardMovementOrigin != undefined &&
        possibleMovementDestination != undefined
      ) {
        await api
          .post(
            `/jogos/${chessId}/pecas/${boardMovementOrigin.house}/move/${possibleMovementDestination.house}`,
            { headers: { lado: sideId } }
          )
          .then(async (res) => {
            console.log(res);
            await populateGame();
          })
          .catch(async (err) => {
            alert(err.response.data.message);
            await populateGame();
          });
      } else {
        cleanPossibleMovements(boardMovementOrigin);
        await api
          .get(
            `/jogos/${chessId}/pecas/${desiredItem.casa}/possiveis-jogadas`,
            { headers: { lado: sideId } }
          )
          .then((res) => {
            board.value[boardHouseIndex].movementOrigin = true;
            res.data.data.forEach(
              (possibleMovement: {
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
              }) => {
                const boardItemPossibleMove = board.value.find(
                  (boardItem) =>
                    boardItem.house == possibleMovement.casaDestino.casa
                );
                if (boardItemPossibleMove != undefined) {
                  const indexBoardItemPossibleMove = board.value.indexOf(
                    boardItemPossibleMove
                  );
                  board.value[
                    indexBoardItemPossibleMove
                  ].possibleMovement = true;
                  board.value[indexBoardItemPossibleMove].catchPiece =
                    possibleMovement.captura;
                  board.value[indexBoardItemPossibleMove].movementName =
                    possibleMovement.nome;
                }
              }
            );
          })
          .catch((err) => {
            alert(err.response.data.message);
            cleanPossibleMovements(boardMovementOrigin);
          });
      }
    };

    const populateEquivalenceTable = async () => {
      let equivalenceTableGot: {
        casa: string;
        linha: number;
        coluna: number;
      }[] = await getEquivalenceTable();

      // if is the black side revert
      if (sideId == 1) {
        equivalenceTableGot = equivalenceTableGot.reverse();
      }

      equivalenceTable.value = equivalenceTableGot;
    };

    const populateGame = async () => {
      const game: {
        id: number;
        acoesSolicitadas: string[];
        chequeLadoAtual: boolean;
        empatePropostoPeloLadoId: number | null;
        tipoJogo: string;
        tabuleiro: (string | null)[][];
        tempoDeTurnoEmMilisegundos: number;
        ladoIdAtual: number;
        finalizado: string | null;
      } = await getGame(chessId);

      let gameBoardFlat: (string | null)[] = game.tabuleiro.flat();

      // if is the black side revert
      if (sideId == 1) {
        gameBoardFlat = gameBoardFlat.reverse();
      }

      populateBoard(gameBoardFlat);
      chess.value = game;
    };

    const populateBoard = (gameBoardFlat: (string | null)[]) => {
      let chessBoard: {
        house: string;
        line: number;
        column: number;
        possibleMovement: boolean;
        movementName: string | null;
        catchPiece: boolean;
        movementOrigin: boolean;
        piece: {
          nome: string;
          ladoId: number;
          unicode: string;
        } | null;
        backgroundColor: string;
      }[] = [];
      gameBoardFlat.forEach((item, index) => {
        chessBoard.push({
          house: equivalenceTable.value[index].casa,
          line: equivalenceTable.value[index].linha,
          column: equivalenceTable.value[index].coluna,
          possibleMovement: false,
          movementName: null,
          catchPiece: false,
          movementOrigin: false,
          piece: getPiece(item),
          backgroundColor:
            Math.floor(index / 8) % 2 == (index % 2) % 2
              ? sideId == 1
                ? "white"
                : "black"
              : sideId == 1
              ? "black"
              : "white",
        });
      });
      board.value = chessBoard;
    };

    const populatePieces = async () => {
      pieces.value = await getPieces();
    };

    onMounted(async () => {
      await populatePieces();
      await populateEquivalenceTable();
      await populateGame();
    });

    return {
      sideId,
      board,
      chess,
      getPossibleMovesOrMakeMove,
      loading,
    };
  },
});
</script>

<style scoped>
.chessboard {
  width: 656px;
  height: 656px;
  margin: auto;
  border: 8px solid rebeccapurple;
  border-radius: 15px;
}

.borda-lado-da-vez {
  border: 8px solid blue;
}

.board-house:hover {
  background-color: lightblue;
}

.board-house:active {
  background-color: blueviolet;
}

.board-house {
  color: black;
  font-weight: bold;
  text-shadow: 2px 0 0 #fff, -2px 0 0 #fff, 0 2px 0 #fff, 0 -2px 0 #fff,
    1px 1px #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff;
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
