const Timeout = require('./timeout')
const {
  Backoff: {
    MAX_DELAY,
    MAX_RECONNECT_ATTEMPTS,
    MULTIPLY_FACTOR,
    INITIAL_DELAY,
  },
  Event,
} = require('../constants')

export default function(options = {}) {
  const { backoff = {} } = options
  let totalReconnectAttempts = 0
  const initalDelayMs = backoff.initialDelayMs != null
    ? backoff.initialDelayMs
    : INITIAL_DELAY
  const multiplyFactor = backoff.multiplyFactor != null
    ? backoff.multiplyFactor
    : MULTIPLY_FACTOR
  const maxDelayMs = backoff.maxDelayMs != null ? backoff.maxDelayMs : MAX_DELAY
  const maxReconnectAttempts = backoff.maxReconnectAttempts != null
    ? backoff.maxReconnectAttempts
    : MAX_RECONNECT_ATTEMPTS

  this.clearBackoffTimeout = () => (totalReconnectAttempts = 0)

  this.clearBackoffHandle = function() {
    if (this.backoffHandle != null) {
      this.backoffHandle.clear()
      return (this.backoffHandle = null)
    }
  }

  return (this.setBackoffTimeout = fn => {
    this.clearBackoffHandle()
    if (totalReconnectAttempts < maxReconnectAttempts) {
      const timeout = Math.min(
        initalDelayMs * Math.pow(multiplyFactor, totalReconnectAttempts),
        maxDelayMs
      )
      this.backoffHandle = new Timeout(fn, timeout)
      return totalReconnectAttempts++
    } else {
      return this.emit(Event.backOffFailed)
    }
  })
}
