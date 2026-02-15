import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { findOrCreateUser } from '@/lib/privy'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { identifier } = body

        if (!identifier) {
            return NextResponse.json(
                { error: 'identifier (email or phone) is required' },
                { status: 400 }
            )
        }

        // Find or create user via Privy
        const { address, userId, identifierType } =
            await findOrCreateUser(identifier)

        // Upsert user in our DB
        const user = await prisma.user.upsert({
            where: { privyId: userId },
            update: { walletAddress: address },
            create: {
                privyId: userId,
                email: identifierType === 'email' ? identifier : null,
                phone: identifierType === 'phone' ? identifier : null,
                walletAddress: address,
            },
        })

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                identifier,
                identifierType,
            },
        })
    } catch (error) {
        console.error('[Auth] Privy callback error:', error)
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        )
    }
}
