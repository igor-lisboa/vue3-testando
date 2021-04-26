import { createWebHistory, createRouter } from 'vue-router';

import Home from '../components/Home.vue'
import Game from '../components/Game.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/game/:id',
        name: 'game',
        component: Game
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: { name: 'home' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router