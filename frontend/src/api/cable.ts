import { createConsumer } from '@rails/actioncable'
import { API_BASE } from './client'

function cableUrl() {
  const url = new URL('/cable', API_BASE)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

export const cable = createConsumer(cableUrl())
