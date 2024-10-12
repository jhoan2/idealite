'use client'

import { useRouter } from 'next/navigation'
import { Button } from '~/components/ui/button'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()

    return (
        <div className='flex w-full h-screen items-center'>
            <div className="bg-gray-700 rounded-lg shadow-lg p-6 m-4 w-full h-full md:w-3/4 md:h-3/4 mx-auto">
                <nav className="bg-gray-700 p-1 rounded-full">
                    <ul className="flex space-x-2">
                        <li>
                            <Button
                                onClick={() => router.push('/home/public')}
                                className={clsx(
                                    "px-4 py-2 text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-700",
                                    pathname.includes('/home/public')
                                        ? "bg-gray-600 text-white"
                                        : "text-gray-400 hover:bg-gray-700 hover:text-white"
                                )}
                            >
                                Channel
                            </Button>
                        </li>
                        <li>
                            <Button
                                onClick={() => router.push('/home/private')}
                                className={clsx(
                                    "px-4 py-2 text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-700",
                                    pathname.includes('/home/private')
                                        ? "bg-gray-600 text-white"
                                        : "text-gray-400 hover:bg-gray-700 hover:text-white"
                                )}
                            >
                                Personal
                            </Button>
                        </li>
                    </ul>
                </nav>
                {children}
            </div>
        </div>
    )
}
