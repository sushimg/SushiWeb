import { InMemorySessionStore } from '../in-memory-session-store'
import { runSessionStoreContract } from './session-store-contract'

runSessionStoreContract('InMemorySessionStore', async () => ({
  store: new InMemorySessionStore(),
  accountId: 'hesap-1',
}))
