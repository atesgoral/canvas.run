import Vue from 'vue';
import Vuex from 'vuex';
import * as actions from './actions';
import * as mutations from './mutations';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  state: {
    settings: {
      isLayoutHorizontal: true,
      splitterPercentage: 50
    },
    session: {}
  },
  actions,
  mutations,
  strict: debug
});
