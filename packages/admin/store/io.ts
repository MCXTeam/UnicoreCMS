import { GetterTree, ActionTree, MutationTree } from 'vuex'

export const state = () => ({
  serversOnline: [] as string[],
})

export type RootState = ReturnType<typeof state>

export const mutations: MutationTree<RootState> = {
  SERVERS_ONLINE: (state, serversOnline: string[]) => (state.serversOnline = serversOnline),
}

export const actions: ActionTree<RootState, RootState> = {
  async serversOnline({ commit }, servers) {
    console.log(servers)
  },
}
