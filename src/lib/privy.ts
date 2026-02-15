import { PrivyClient } from '@privy-io/node'

let _privyClient: PrivyClient | null = null
let _isDemoMode = false

export function isPrivyConfigured(): boolean {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
    const appSecret = process.env.PRIVY_APP_SECRET
    return !!(appId && appSecret && appId !== 'your-privy-app-id' && appSecret !== 'your-privy-app-secret')
}

export function getPrivyClient(): PrivyClient {
    if (!isPrivyConfigured()) {
        _isDemoMode = true
        throw new Error(
            'Privy not configured. Set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET in .env'
        )
    }

    if (!_privyClient) {
        _privyClient = new PrivyClient({
            appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
            appSecret: process.env.PRIVY_APP_SECRET!,
        })
    }
    return _privyClient
}

/**
 * Find or create a user by email or phone.
 * Returns the user's wallet address.
 */
export async function findOrCreateUser(identifier: string): Promise<{
    address: string
    userId: string
    identifierType: 'email' | 'phone'
}> {
    if (!isPrivyConfigured()) {
        // Demo mode: return a deterministic test address
        return {
            address: '0xAcF8dBD0352a9D47135DA146EA5DbEfAD58340C4',
            userId: 'demo-user',
            identifierType: identifier.includes('@') ? 'email' : 'phone',
        }
    }

    const privy = getPrivyClient()
    const isEmail = identifier.includes('@')

    // Try to find existing user
    let user = null
    try {
        if (isEmail) {
            user = await privy.users().getByEmailAddress({ address: identifier })
        } else {
            user = await privy.users().getByPhoneNumber({ number: identifier })
        }
    } catch {
        // User not found — will create
    }

    // Create if not found
    if (!user) {
        if (isEmail) {
            user = await privy.users().create({
                linked_accounts: [{ type: 'email', address: identifier }],
                wallets: [{ chain_type: 'ethereum' }],
            })
        } else {
            user = await privy.users().create({
                linked_accounts: [{ type: 'phone', number: identifier }],
                wallets: [{ chain_type: 'ethereum' }],
            })
        }
    }

    // Extract wallet
    const wallet = user.linked_accounts?.find(
        (account: { type: string; chain_type?: string }) =>
            account.type === 'wallet' && account.chain_type === 'ethereum'
    ) as { address?: string } | undefined

    if (!wallet?.address) {
        throw new Error(`No wallet found for user ${identifier}`)
    }

    return {
        address: wallet.address,
        userId: user.id,
        identifierType: isEmail ? 'email' : 'phone',
    }
}
