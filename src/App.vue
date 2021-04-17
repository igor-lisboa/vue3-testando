<template>
  <div>
    <router-link :to="{ name: 'home' }">home</router-link>
    <router-link :to="{ name: 'game', params: { id: 1 } }">game</router-link>
    <router-link :to="{ name: 'counter' }">counter</router-link>
    <router-view />
  </div>
</template>