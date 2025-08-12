"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from '@/components/ui/button';
import { Heart, Bell, Settings, LogOut, User, History, Shield, FileText, Undo2, Truck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import { toast } from 'sonner';
import { TestEmailButton } from "../testerButton";
import { useTheme } from 'next-themes';
import Image from 'next/image';
// import { DeveloperNote } from './DeveloperNote';

interface DashboardHeaderProps {
  user: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const { signOut } = useAuthActions();
  const { theme } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Image
            src={theme === 'dark' ? '/dark-logo.png' : '/light-logo.png'}
            alt="MindfulAI Logo"
            width={150}
            height={40}
            className="h-10 w-auto"
          />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            MindfulAI
          </span>
        </Link>
        {/* <DeveloperNote /> */}
        {/* <TestEmailButton /> */}

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/sessions">
                <DropdownMenuItem>
                  <History className="mr-2 h-4 w-4" />
                  <span>Sessions</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Link href="/privacy-policy">
                <DropdownMenuItem>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Privacy Policy</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/terms-and-conditions">
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Terms & Conditions</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/refund-policy">
                <DropdownMenuItem>
                  <Undo2 className="mr-2 h-4 w-4" />
                  <span>Refund Policy</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/shipping">
                <DropdownMenuItem>
                  <Truck className="mr-2 h-4 w-4" />
                  <span>Shipping</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image || ''} alt={user.name || ''} />
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}