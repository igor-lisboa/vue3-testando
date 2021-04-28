<template>
  <template v-if="loading == false">
    <h1>Olá</h1>
    <p class="lead">
      Clique na opção desejada para os tipos de jogadores que irão jogar e tempo
      de turno
    </p>

    <div class="mt-3">
      <div class="btn-group" role="group">
        <template v-for="shiftTime in shiftTimes" v-bind:key="shiftTime.id">
          <input
            type="radio"
            class="btn-check"
            :id="'btnShiftTime' + shiftTime.id"
            :checked="shiftTime.ms == shiftTimeChoosed"
            @change="setShiftTime(shiftTime.ms)"
          />
          <label
            class="btn btn-outline-primary"
            :for="'btnShiftTime' + shiftTime.id"
            >{{ shiftTime.txt }}</label
          >
        </template>
      </div>
    </div>

    <div class="d-flex">
      <div class="m-auto w-100 row">
        <div class="col-md-4 mt-3" v-for="type in types" v-bind:key="type.id">
          <button
            @click="createGameWithType(type.id)"
            class="btn btn-lg btn-light fw-bold border-white w-100"
          >
            <span
              v-bind:key="index"
              v-for="(todosintegranteTipo, index) in type.integranteLadoTipo"
            >
              {{ (index != 0 ? " X " : "") + todosintegranteTipo.nome }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <hr />
    <h2>OU</h2>
    <button
      class="btn btn-lg btn-light fw-bold border-white mt-3"
      @click="enterInSomeRoom"
    >
      Entre em uma sala
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
import { useRouter } from "vue-router";
import api from "../api";
export default defineComponent({
  name: "Home",
  setup: () => {
    const router = useRouter();
    const loading = ref(false);
    const types = ref<
      {
        id: number;
        integranteLadoTipo: {
          nome: string;
        }[];
      }[]
    >([]);
    const shiftTimeChoosed = ref(-1);

    const setShiftTime = (shiftTime: number) => {
      shiftTimeChoosed.value = shiftTime;
    };

    const shiftTimes = [
      { id: 0, ms: -1, txt: "Tempo Infinito" },
      { id: 1, ms: 300000, txt: "5 Minutos" },
      { id: 2, ms: 600000, txt: "10 Minutos" },
      { id: 3, ms: 900000, txt: "15 Minutos" },
      { id: 4, ms: 3600000, txt: "1 Hora" },
    ];

    const getGameTypes = async () => {
      loading.value = true;
      return await api
        .get(`/tipos-de-jogo`)
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

    const createGameWithType = async (typeId: number) => {
      loading.value = true;
      return await api
        .post(`/jogos`, {
          tipoJogo: typeId,
          tempoDeTurnoEmMilisegundos: shiftTimeChoosed.value,
        })
        .then((res) => {
          loading.value = false;
          router.push({ name: "selectSide", params: { id: res.data.data.id } });
        })
        .catch((err) => {
          loading.value = false;
          alert(err.response.data.message);
          return null;
        });
    };

    const enterInSomeRoom = () => {
      const roomId = prompt("Em qual sala você deseja entrar?");
      if (roomId != null && roomId != undefined && roomId != "") {
        router.push({ name: "selectSide", params: { id: roomId } });
      }
    };

    const populateGameTypes = async () => {
      types.value = await getGameTypes();
    };

    onMounted(async () => {
      await populateGameTypes();
      setShiftTime(-1);
    });
    return {
      types,
      createGameWithType,
      shiftTimes,
      shiftTimeChoosed,
      setShiftTime,
      enterInSomeRoom,
      loading,
    };
  },
});
</script>