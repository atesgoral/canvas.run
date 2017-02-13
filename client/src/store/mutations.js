export const updateSession = (state, session) => {
  state.session = { ...state.session, ...session };
};

export const updateSettings = (state, settings) => {
  state.settings = { ...state.settings, ...settings };
};
