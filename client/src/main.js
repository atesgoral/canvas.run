// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

Vue.directive('autofocus', {
  inserted: function (el) {
    setTimeout(() => {
      el.focus();
    }, 1);
  }
});

/* eslint-disable no-new */
new Vue({
  el: 'body',
  render: h => h(App)
})
