import { GetterTree, MutationTree } from 'vuex'

export const state = () => ({
  config: {} as Record<string, number | string | boolean>,
})

export type RootState = ReturnType<typeof state>

export const getters: GetterTree<RootState, RootState> = {
  config: (state) => state.config,
}

export const mutations: MutationTree<RootState> = {
  SET_CONFIG: (state, value: Record<string, number | string | boolean>) => (state.config = value),
}
