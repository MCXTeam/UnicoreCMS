import { Plugin } from '@nuxt/types'

const AxiosPluginExtend: Plugin = ({ $axios, error }) => {
  $axios.onError((er) => {
    switch (er.response?.status) {
      case 403:
        error({ statusCode: 403 })
        break
    }

    return Promise.reject(er)
  })
}

export default AxiosPluginExtend
