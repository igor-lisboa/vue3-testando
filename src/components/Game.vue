<template>
  <template v-if="loading == false">
    <div class="alert alert-light" role="alert">
      {{ chess.id }} | {{ chess.tipoJogo }}
    </div>
    <div
      :class="
        'chessboard ' + (chess.ladoIdAtual == sideId ? 'borda-lado-da-vez' : '')
      "
    >
      <div
        v-for="(item, index) in board"
        v-bind:key="index"
        :class="
          'board-house ' +
          (chess.chequeLadoAtual &&
          item?.piece?.nome == 'Rei' &&
          item?.piece?.ladoId == chess.ladoIdAtual
            ? 'check-alert '
            : '') +
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
    <div class="mt-3" v-if="chess.tempoDeTurnoEmMilisegundos != -1">
      <ul class="list-group w-25 m-auto">
        <li
          class="list-group-item d-flex justify-content-between align-items-center"
        >
          Branco
          <span class="badge bg-primary rounded-pill">{{
            msToTime(chess.ladoBrancoTempoMilisegundosRestante).formated
          }}</span>
        </li>
        <li
          class="list-group-item d-flex justify-content-between align-items-center"
        >
          Preto
          <span class="badge bg-primary rounded-pill">{{
            msToTime(chess.ladoPretoTempoMilisegundosRestante).formated
          }}</span>
        </li>
      </ul>
    </div>

    <div class="btn-group" role="group">
      <button
        class="btn btn-lg btn-light fw-bold border-white mt-3"
        @click="leaveGame"
      >
        Desistir
      </button>
      <button
        class="btn btn-lg btn-danger fw-bold mt-3"
        @click="proposeSomething('empate')"
      >
        Propõe Empate
      </button>
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
import { io } from "socket.io-client";
export default defineComponent({
  name: "Game",
  setup: () => {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(false);
    const sideId: number = parseInt(route.params.sideId.toString());
    const chessId: number = parseInt(route.params.id.toString());
    const socket = io(import.meta.env.VITE_API_CHESS?.toString(), {
      query: { jogador: `${chessId}-${sideId}` },
    });
    const chess = ref<{
      id: number;
      acoesSolicitadas: { acao: string; ladoId: number }[];
      chequeLadoAtual: boolean;
      tipoJogo: string;
      ladosIdDeslogados: number[];
      ladoBrancoTempoMilisegundosRestante: number;
      ladoPretoTempoMilisegundosRestante: number;
      tabuleiro: (string | null)[][];
      tempoDeTurnoEmMilisegundos: number;
      ladoIdAtual: number;
      finalizado: string | null;
    }>({
      id: -1,
      acoesSolicitadas: [],
      chequeLadoAtual: false,
      ladosIdDeslogados: [0, 1],
      ladoBrancoTempoMilisegundosRestante: -1,
      ladoPretoTempoMilisegundosRestante: -1,
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

    socket.on("adversarioEntrou", async () => {
      alert("O adversário entrou na partida!");
      await populateGame();
    });

    socket.on("uncaughtException", function (err) {
      alert("Socket error");
      console.log(err);
    });

    socket.on("jogadaRealizada", async () => {
      await populateGame();
    });

    socket.on("empateProposto", async () => {
      await populateGame();
    });

    socket.on("empatePropostoResposta", async () => {
      await populateGame();
    });

    socket.on("jogoFinalizado", async () => {
      await populateGame();
    });

    socket.on("resetProposto", async () => {
      await populateGame();
    });

    socket.on("resetPropostoResposta", async () => {
      await populateGame();
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
          alert(err?.response?.data?.message);
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
          alert(err?.response?.data?.message);
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

    const cleanPossibleMovements = () => {
      board.value
        .filter(
          (boardItem) =>
            boardItem.possibleMovement == true ||
            boardItem.movementOrigin == true
        )
        .forEach((boardItemMovement) => {
          boardItemMovement.possibleMovement = false;
          boardItemMovement.catchPiece = false;
          boardItemMovement.movementName = null;
          boardItemMovement.movementOrigin = false;
        });
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
            {},
            { headers: { lado: sideId } }
          )
          .then(async () => {
            await populateGame();
          })
          .catch(async (err) => {
            alert(err?.response?.data?.message);
            await populateGame();
          });
      } else {
        cleanPossibleMovements();
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
            alert(err?.response?.data?.message);
            cleanPossibleMovements();
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
      chess.value = await getGame(chessId);

      if (chess.value.finalizado != null) {
        router.push({ name: "endGame", params: { id: chessId, sideId } });
      }

      if (chess.value.ladosIdDeslogados.includes(sideId)) {
        router.push({
          name: "selectSide",
          params: { id: chessId },
          query: {
            sideId,
          },
        });
      }

      const promotePawn = chess.value.acoesSolicitadas.find(
        (requiredAction) =>
          requiredAction.acao == "promocaoPeao" &&
          requiredAction.ladoId == sideId
      );
      if (promotePawn != undefined) {
        router.push({ name: "promotePawn", params: { id: chessId, sideId } });
      }
      const awnswerResetProposal = chess.value.acoesSolicitadas.find(
        (requiredAction) => requiredAction.acao == "responderPropostaReset"
      );
      if (awnswerResetProposal != undefined) {
        router.push({
          name: "answerProposal",
          params: { id: chessId, sideId, type: "reset" },
        });
      }
      const awnswerTieProposal = chess.value.acoesSolicitadas.find(
        (requiredAction) => requiredAction.acao == "responderPropostaEmpate"
      );
      if (awnswerTieProposal != undefined) {
        router.push({
          name: "answerProposal",
          params: { id: chessId, sideId, type: "tie" },
        });
      }

      let gameBoardFlat: (string | null)[] = chess.value.tabuleiro.flat();

      // if is the black side revert
      if (sideId == 1) {
        gameBoardFlat = gameBoardFlat.reverse();
      }

      populateBoard(gameBoardFlat);
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
            Math.floor(index / 8) % 2 == (index % 2) % 2 ? "white" : "black",
        });
      });
      board.value = chessBoard;
    };

    const populatePieces = async () => {
      pieces.value = await getPieces();
    };

    const leaveGame = async () => {
      loading.value = true;
      return await api
        .delete(`/jogos/${chessId}/jogadores/${sideId}`)
        .then(async (res) => {
          loading.value = false;
          alert(res.data.message);
          router.push({ name: "home" });
        })
        .catch(async (err) => {
          loading.value = false;
          alert(err?.response?.data?.message);
          await populateGame();
        });
    };

    const proposeSomething = async (action: string) => {
      loading.value = true;
      return await api
        .put(
          `/jogos/${chessId}/${action}/propoe`,
          {},
          { headers: { lado: sideId } }
        )
        .then(async (res) => {
          loading.value = false;
          alert(res.data.message);
          await populateGame();
        })
        .catch(async (err) => {
          loading.value = false;
          alert(err?.response?.data?.message);
          await populateGame();
        });
    };

    const msToTime = (duration: number) => {
      const seconds: number = Math.floor((duration / 1000) % 60);
      const minutes: number = Math.floor((duration / (1000 * 60)) % 60);
      const hours: number = Math.floor((duration / (1000 * 60 * 60)) % 24);

      const hoursString: string = hours < 10 ? "0" + hours : hours.toString();
      const minutesString: string =
        minutes < 10 ? "0" + minutes : minutes.toString();
      const secondsString: string =
        seconds < 10 ? "0" + seconds : seconds.toString();
      const formated: string = `${hoursString}:${minutesString}:${secondsString}`;

      return {
        seconds,
        minutes,
        hours,
        formated,
      };
    };

    const forceIa = async () => {
      await api.get(`/ia`);
    };

    onMounted(async () => {
      await populatePieces();
      await populateEquivalenceTable();
      await populateGame();

      if (
        chess.value.tempoDeTurnoEmMilisegundos != -1 &&
        chess.value.ladosIdDeslogados.length == 0
      ) {
        setInterval(async () => {
          if (chess.value.ladoIdAtual == 0) {
            if (chess.value.ladoBrancoTempoMilisegundosRestante > 0) {
              chess.value.ladoBrancoTempoMilisegundosRestante -= 1000;
              if (chess.value.ladoBrancoTempoMilisegundosRestante <= 0) {
                await populateGame();
              }
            }
          } else {
            if (chess.value.ladoPretoTempoMilisegundosRestante > 0) {
              chess.value.ladoPretoTempoMilisegundosRestante -= 1000;
              if (chess.value.ladoPretoTempoMilisegundosRestante <= 0) {
                await populateGame();
              }
            }
          }
        }, 1000);
      }

      await forceIa();
    });

    return {
      sideId,
      board,
      chess,
      getPossibleMovesOrMakeMove,
      loading,
      leaveGame,
      msToTime,
      proposeSomething,
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

.check-alert {
  background-color: darkred;
}
</style>
