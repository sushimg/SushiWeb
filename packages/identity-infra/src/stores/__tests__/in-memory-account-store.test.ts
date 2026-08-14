import { InMemoryAccountStore } from '../in-memory-account-store'
import { runAccountStoreContract } from './account-store-contract'

runAccountStoreContract('InMemoryAccountStore', async () => new InMemoryAccountStore())
