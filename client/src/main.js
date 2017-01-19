// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

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
  render: h => h(App)
})
