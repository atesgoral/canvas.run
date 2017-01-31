// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App'

import paths from './paths.json'

import Editor from './components/Editor'
import Refresh from './components/Refresh'

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  routes: [{
    name: 'home',
    path: '/',
    component: Refresh // Refreshes page to delegate page serving to backend
  }, {
    name: 'new',
    path: paths.new,
    component: Editor
  }, {
    name: 'edit',
    path: paths.edit,
    component: Editor
  }]
});

Vue.directive('deep-blur', {
  bind: function (el, binding) {
    function onBlur(event) {
      let node = event.relatedTarget;

      while (node && node !== el) {
        node = node.parentNode;
      }

      if (!node) {
        binding.value();
      }
    }

    el.addEventListener('blur', onBlur, true);
  }
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App),
  router
})
