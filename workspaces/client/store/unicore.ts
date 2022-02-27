import { GetterTree, MutationTree } from 'vuex';

export const state = () => ({
  name: '',
});

export type RootState = ReturnType<typeof state>;

export const getters: GetterTree<RootState, RootState> = {
  name: (state) => state.name,
};

export const mutations: MutationTree<RootState> = {
  SET_NAME: (state, value: string) => (state.name = value),
};