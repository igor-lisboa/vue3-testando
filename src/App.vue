<template>
  <div class="d-flex h-100 text-center text-white bg-dark">
    <div class="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
      <header class="mb-auto row">
        <router-link :to="{ name: 'home' }">
          <h3 class="float-md-start mb-0 text-white">
            {{ vueAppTitle }}
          </h3>
        </router-link>
      </header>

      <main class="px-3">
        <router-view />
      </main>

      <footer class="mt-auto text-white-50">
        <p>
          Desenvolvido por
          <a
            href="https://github.com/igor-lisboa"
            target="_blank"
            class="text-white"
            >LISBÔA, Igor</a
          >.
        </p>
      </footer>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "App",
  setup: () => {
    const vueAppTitle = import.meta.env.VITE_APP_TITLE?.toString();
    return { vueAppTitle };
  },
});
</script>
<style>
html,
body,
#app {
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0px;
}

#app {
  display: grid;
}
</style>