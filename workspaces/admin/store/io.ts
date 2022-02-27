import { ActionTree, MutationTree, GetterTree } from 'vuex'

export const state = () => ({
  serversOnline: {
    servers: null,
    total: {
      online: 0,
      records: {
        absolute: 0,
        today: 0,
      },
    },
  } as any,
})

export type RootState = ReturnType<typeof state>

export const getters: GetterTree<RootState, RootState> = {
  serversOnline: (state) => state.serversOnline,
}

export const mutations: MutationTree<RootState> = {
  SERVERS_ONLINE: (state, serversOnline: string[]) => (state.serversOnline = serversOnline),
}

export const actions: ActionTree<RootState, RootState> = {
  async serversOnline({ commit }, servers) {
    commit('SERVERS_ONLINE', servers)
  },
}
