import VueRouter from 'vue-router'
import Vue from 'vue'
import home from './components/home'
import results from './components/results'


Vue.use(VueRouter)


export default new VueRouter ({
  mode:"history",
  routes:[
    {path:"/",component:home},
    {path:"/home",component:home},
    {path:"/results",component:results}
  ]
})
