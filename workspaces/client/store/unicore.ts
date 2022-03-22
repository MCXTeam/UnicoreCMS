import { GetterTree, MutationTree } from 'vuex'

export const state = () => ({
  name: '',
  config: {} as Record<string, number | string | boolean>,
})

export type RootState = ReturnType<typeof state>

export const getters: GetterTree<RootState, RootState> = {
  name: (state) => state.name,
  config: (state) => state.config,
}

export const mutations: MutationTree<RootState> = {
  SET_NAME: (state, value: string) => (state.name = value),
  SET_CONFIG: (state, value: Record<string, number | string | boolean>) => (state.config = value),
}
