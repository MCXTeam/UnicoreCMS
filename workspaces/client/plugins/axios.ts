import { Plugin } from '@nuxt/types'

const AxiosPluginExtend: Plugin = ({ $axios, app, error }) => {
  $axios.onError(er => {
    switch (er.response?.status) {
      case 429:
        error({ statusCode: 429  })
        break;
      case 403:
        app.$unicore.errorNotification("Недостаточно прав для выполнения данного действия")
        break;
    }

    return Promise.reject(er);
  })
}

export default AxiosPluginExtend
