import { HTTPRequest, HTTPResponse, RefreshScheme } from '~auth/runtime'

export default class CoreScheme extends RefreshScheme {
  async login(endpoint, { reset = true } = {}) {
    if (reset) {
      this.$auth.reset({ resetInterceptor: false })
    }

    const response = await this.$auth.request(endpoint, this.options.endpoints.login)

    this.updateTokens(response)
    if (!this.requestHandler.interceptor) {
      this.initializeRequestInterceptor()
    }

    this.updateTokens(response)
    this.$auth.setUser(response.data)

    return response
  }

  async logout(endpoint = {}) {
    if (this.options.endpoints.logout) {
      await this.$auth
        .requestWith(this.name, endpoint, {
          ...this.options.endpoints.logout,
          data: {
            refresh_token: this.refreshToken.get(),
          },
        })
        .catch(() => {})
    }

    return this.$auth.reset()
  }
}
