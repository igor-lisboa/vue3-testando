<template>
  <div class="chessboard">
    <div
      v-for="(item, index) in board"
      v-bind:key="index"
      :class="
        'board-house ' +
        (Math.floor(index / 8) % 2 == (index % 2) % 2
          ? reverse
            ? 'white'
            : 'black'
          : reverse
          ? 'black'
          : 'white')
      "
    >
      {{ item != null ? item.tipo : "" }}
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
    const ladoId: number = 1;
    const chessId: string = route.params.id.toString();
    let reverse: boolean = false;
    let chess = ref({});
    let board = ref([]);
    let equivalenceTable = ref([]);
    let pieces = ref([]);

    if (ladoId == 1) {
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

      const board: never[] = chess.tabuleiro.casas.flat();

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

    onMounted(async () => {
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
    });

    return { chessId, board, chess, reverse };
  },
});
</script>

<style scoped>
.chessboard {
  width: 640px;
  height: 640px;
  margin: 20px;
  border: 25px solid #333;
}

.board-house {
  float: left;
  width: 80px;
  height: 80px;
  font-size: 50px;
  text-align: center;
  display: table-cell;
  vertical-align: middle;
}

.black {
  background-color: #999;
}
.white {
  background-color: #fff;
}
</style>
