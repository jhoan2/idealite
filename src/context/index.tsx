'use client'

import { wagmiAdapter, config } from '~/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { base } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { siweConfig } from '~/config/siweConfig'

// Set up queryClient
const queryClient = new QueryClient()

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
    throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
    name: "idealite",
    description: "A mmo learning game",
    url: "https://idealite.xyz", // origin must match your domain & subdomain
    icons: ["/icon32.png"]
}

// Create the modal
const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [base],
    defaultNetwork: base,
    metadata: metadata,
    features: {
        analytics: true, // Optional - defaults to your Cloud configuration
        email: true, // default to true
        socials: ['google'],
        emailShowWallets: true, // default to true
    },
    allWallets: 'SHOW', // default to SHOW
    siweConfig: siweConfig
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
    const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    )
}

export default ContextProvider