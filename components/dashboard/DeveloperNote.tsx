"use client"
import React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import Link from 'next/link';

export const DeveloperNote: React.FC = () => {
  const { theme } = useTheme();
  const boltLogo = theme === 'dark' ? '/bolt-black.png' : '/bolt-white.png';
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/60 shadow-sm my-4">
      <Link href={"https://bolt.new"} target="_blank">
        <Image src={boltLogo} alt="Bolt Logo" width={40} height={40} className="rounded" />
      </Link>
      <div>
        <div className="font-bold text-base">BOLT HACKATHON DEVELOPER NOTE</div>
        <div className="text-sm text-muted-foreground">
          Until <span className="font-semibold">JULY 31, 2025</span> no real payments will be processed. If you are a judge or tester, you can buy a subscription for free during this period.
        </div>
      </div>
    </div >
  );
};

export default DeveloperNote;