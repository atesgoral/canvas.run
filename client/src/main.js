// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'whatwg-fetch';
import Vue from 'vue'
import VueRouter from 'vue-router'

import store from './store';
import App from './components/App'

import paths from './paths.json'

import Editor from './components/Editor'

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  routes: [{
    name: 'new',
    path: paths.new,
    component: Editor
  }, {
    name: 'edit',
    path: paths.edit,
    component: Editor
  }]
});

// @todo make into plugin
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
  store,
  router
})
