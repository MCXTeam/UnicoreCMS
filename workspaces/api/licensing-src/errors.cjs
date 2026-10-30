class LicenseError extends Error {
  constructor(code) {
    super(code)
    this.name = 'LicenseError'
    this.code = code
  }
}

module.exports = { LicenseError }
