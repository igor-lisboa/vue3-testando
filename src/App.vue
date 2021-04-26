<template>
  <div class="d-flex h-100 text-center text-white bg-dark">
    <div class="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
      <header class="mb-auto">
        <div>
          <h3 class="float-md-start mb-0">CHESS</h3>
          <nav class="nav nav-masthead justify-content-center float-md-end">
            <router-link class="nav-link" :to="{ name: 'home' }"
              >home</router-link
            >
            <router-link
              class="nav-link"
              :to="{ name: 'game', params: { id: 1 } }"
              >game</router-link
            >
          </nav>
        </div>
      </header>

      <main class="px-3">
        <router-view />
      </main>

      <footer class="mt-auto text-white-50">
        <p>
          Cover template for
          <a href="https://getbootstrap.com/" class="text-white">Bootstrap</a>,
          by <a href="https://twitter.com/mdo" class="text-white">@mdo</a>.
        </p>
      </footer>
    </div>
  </div>
</template>

<style>
html,
body,
#app {
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0px;
}
</style>