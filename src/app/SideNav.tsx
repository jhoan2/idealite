'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Folder, UserRound, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { ModeToggle } from './NextThemeButton'
import { NeynarAuthButton } from "@neynar/react"
import { Button } from "~/components/ui/button"
import { ScrollArea } from "~/components/ui/scroll-area"

export default function SideNav() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const menuItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: Folder, label: "Projects", href: "/projects" },
    { icon: UserRound, label: "Profile", href: "/profile" },
  ]

  return (
    <nav className={`flex flex-col h-screen bg-background text-foreground transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} border-r-2 rounded-r-xl border-border`}>
      <div className="flex items-center justify-between p-4 bg-background text-foreground border-b">
        <Link href='/'>
          <div className="flex items-center space-x-2">
            <Image src='/icon48.png' alt='idealite logo' width={32} height={32} />
            {!isCollapsed && <h1 className="text-xl font-semibold text-amber-400">Idealite</h1>}
          </div>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
      <ScrollArea className='flex flex-col justify-between h-full'>
        <nav className="p-2 space-y-4">
          {menuItems.map((item, index) => (
            <Link href={item.href} key={index}>
              <Button
                variant="ghost"
                className={clsx(
                  'w-full',
                  isCollapsed ? 'px-2' : 'px-4 justify-start',
                  'bg-background hover:bg-gray-100 dark:hover:bg-gray-800',
                  {
                    'bg-gray-100 dark:bg-gray-800 text-foreground': pathname.includes(item.href),
                    'text-foreground': !pathname.includes(item.href)
                  }
                )}
              >
                <item.icon className='h-6 w-6 mr-2' />
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t flex flex-col items-center space-y-4 bg-background text-foreground">
        {!isCollapsed && <NeynarAuthButton />}
        <ModeToggle />
      </div>
    </nav>
  )
}
