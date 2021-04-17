import { createWebHistory, createRouter } from 'vue-router';

import HelloWorld from '../components/HelloWorld.vue'
import Game from '../components/Game.vue'
import Counter from '../components/Counter.vue'


const routes = [
    {
        path: '/',
        name: 'home',
        component: HelloWorld
    },
    {
        path: '/game/:id',
        name: 'game',
        component: Game
    },
    {
        path: '/counter',
        name: 'counter',
        component: Counter
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