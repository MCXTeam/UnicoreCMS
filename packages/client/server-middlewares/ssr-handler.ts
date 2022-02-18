import { ServerMiddleware } from '@nuxt/types'

const SSRHandlerMiddleware: ServerMiddleware = function (req, res, next) {
  const pathStarts = ['/auth', '/cabinet']

  if (pathStarts.some((srt) => req.originalUrl?.startsWith(srt))) {
    // @ts-ignore
    res.spa = true
  }

  next()
}

export default SSRHandlerMiddleware
