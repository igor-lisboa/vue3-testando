import { createWebHistory, createRouter } from 'vue-router';

import Home from '../components/Home.vue'
import Game from '../components/Game.vue'
import SelectSide from '../components/SelectSide.vue'
import PromotePawn from '../components/PromotePawn.vue'
import EndGame from '../components/EndGame.vue'
import AnswerProposal from '../components/AnswerProposal.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/game/:id',
        name: 'selectSide',
        component: SelectSide
    },
    {
        path: '/game/:id/side/:sideId',
        name: 'game',
        component: Game
    },
    {
        path: '/game/:id/side/:sideId/promotePawn',
        name: 'promotePawn',
        component: PromotePawn
    },
    {
        path: '/game/:id/side/:sideId/endGame',
        name: 'endGame',
        component: EndGame
    },
    {
        path: '/game/:id/side/:sideId/answerProposal/:type',
        name: 'answerProposal',
        component: AnswerProposal
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