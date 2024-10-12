'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Folder, UserRound } from 'lucide-react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

export default function SideNav() {
    const pathname = usePathname()
    return (
        <nav id="sidebar-mini" className="flex flex-col translate-x-0 -translate-x-full p-2 h-full xl:w-[300px] transition-all duration-300 transform hidden z-[1]  border-r-2 rounded-r-xl border-gray-700 md:block md:translate-x-0 md:end-auto md:bottom-0">
            <div className="flex flex-col justify-center items-center gap-y-2 py-4">
                <Link href={'/'}>
                    <div className="flex items-center text-lg space-x-2 mb-4">
                        <Image src='/icon48.png' alt='idealite logo' width={64} height={64} />
                        <p className='lg:block hidden text-3xl text-amber-400'>Idealite</p>
                    </div>
                </Link>
                <div className="inline-block [--placement:right]">
                    <Link href={'/home'}>
                        <button
                            title='Home'
                            className={clsx(
                                'w-16 lg:w-36 h-16 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent',
                                'text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none',
                                'focus:outline-none focus:ring-1 focus:ring-gray-600',
                                {
                                    'bg-gray-600': pathname.includes('/home'),
                                    'bg-gray-800': !pathname.includes('/home')
                                }
                            )}
                        >
                            <div className='flex items-center space-x-2 text-lg'>
                                <Home />
                                <p className='lg:block hidden text-white'>Home</p>
                            </div>
                        </button>
                    </Link>
                </div>
                <div className="inline-block [--placement:right]">
                    <Link href={'/projects'}>
                        <button
                            title='Projects'
                            className={clsx(
                                'w-16 lg:w-36 h-16 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent',
                                'text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none',
                                'focus:outline-none focus:ring-1 focus:ring-gray-600',
                                {
                                    'bg-gray-600': pathname.includes('/projects'),
                                    'bg-gray-800': !pathname.includes('/projects')
                                }
                            )}
                        >
                            <div className='flex items-center text-lg space-x-2'>
                                <Folder />
                                <p className='lg:block hidden text-white'>Projects</p>
                            </div>
                        </button>
                    </Link>
                </div>
                <div className="inline-block [--placement:right]">
                    <Link href={'/profile'}>
                        <button
                            title='Profile'
                            className={clsx(
                                'w-16 lg:w-36 h-16 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent',
                                'text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none',
                                'focus:outline-none focus:ring-1 focus:ring-gray-600',
                                {
                                    'bg-gray-600': pathname.includes('/profile'),
                                    'bg-gray-800': !pathname.includes('/profile')
                                }
                            )}
                        >
                            <div className='flex items-center space-x-2 text-lg'>
                                <UserRound />
                                <p className='lg:block hidden text-white'>Profile</p>
                            </div>
                        </button>
                    </Link>
                </div>
            </div>
            <div className='pt-2 flex justify-center items-center'>
                <w3m-button balance='hide' />
            </div>
        </nav>
    )
}
