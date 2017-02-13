export const fetchSession = ({ commit }) => {
  return fetch('/api/session', { credentials: 'same-origin' })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Session fetch failed');
      }

      return response.json();
    })
    .then((session) => {
      commit('updateSession', session);
    });
};
