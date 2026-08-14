import { InMemoryVerificationStore } from '../in-memory-verification-store'
import { runVerificationStoreContract } from './verification-store-contract'

runVerificationStoreContract('InMemoryVerificationStore', async () => ({
  store: new InMemoryVerificationStore(),
  accountId: 'hesap-1',
}))
