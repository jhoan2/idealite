"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { WaitlistButton } from "~/components/WaitlistButton";
import Footer from "./Footer";

interface LandingGamingProps {
  variant?: string;
}

export function EmptyPartySlots() {
  return (
    <svg width="200" height="220" viewBox="0 0 200 220">
      <defs>
        {/* Glow filter for active slot */}
        <filter id="activeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle glow for searching effect */}
        <filter id="searchGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Top empty slot */}
      <g transform="translate(100, 35)">
        <rect
          x="-28"
          y="-28"
          width="56"
          height="56"
          rx="4"
          fill="none"
          stroke="#f2a716"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.3"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;40"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.3;0.5;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
        <text
          y="5"
          textAnchor="middle"
          fill="#f2a716"
          fontFamily="monospace"
          fontSize="18"
          opacity="0.4"
        >
          ?
        </text>
      </g>

      {/* Left empty slot */}
      <g transform="translate(45, 90)">
        <rect
          x="-28"
          y="-28"
          width="56"
          height="56"
          rx="4"
          fill="none"
          stroke="#f2a716"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.3"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;40"
            dur="3s"
            begin="0.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.3;0.5;0.3"
            dur="2s"
            begin="0.5s"
            repeatCount="indefinite"
          />
        </rect>
        <text
          y="5"
          textAnchor="middle"
          fill="#f2a716"
          fontFamily="monospace"
          fontSize="18"
          opacity="0.4"
        >
          ?
        </text>
      </g>

      {/* Right empty slot */}
      <g transform="translate(155, 90)">
        <rect
          x="-28"
          y="-28"
          width="56"
          height="56"
          rx="4"
          fill="none"
          stroke="#f2a716"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.3"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;40"
            dur="3s"
            begin="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.3;0.5;0.3"
            dur="2s"
            begin="1s"
            repeatCount="indefinite"
          />
        </rect>
        <text
          y="5"
          textAnchor="middle"
          fill="#f2a716"
          fontFamily="monospace"
          fontSize="18"
          opacity="0.4"
        >
          ?
        </text>
      </g>

      {/* Bottom ACTIVE slot with player */}
      <g transform="translate(100, 145)" filter="url(#activeGlow)">
        {/* Solid border for active slot */}
        <rect
          x="-28"
          y="-28"
          width="56"
          height="56"
          rx="4"
          fill="#103c96"
          stroke="#f28705"
          strokeWidth="2"
        >
          <animate
            attributeName="stroke-opacity"
            values="1;0.6;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>

        {/* Player silhouette icon */}
        <g fill="#f2e7c4">
          {/* Head */}
          <circle cx="0" cy="-8" r="8" />
          {/* Body */}
          <path d="M-12 18 Q-12 4 0 4 Q12 4 12 18 Z" />
        </g>

        {/* Online indicator dot */}
        <circle cx="20" cy="-20" r="4" fill="#4ade80">
          <animate
            attributeName="opacity"
            values="1;0.5;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Connecting lines (faded) */}
      <g stroke="#f2a716" strokeWidth="1" opacity="0.15">
        <line x1="100" y1="63" x2="100" y2="117" />
        <line x1="73" y1="90" x2="127" y2="90" />
        <line x1="72" y1="63" x2="72" y2="90" />
        <line x1="72" y1="63" x2="100" y2="63" />
        <line x1="128" y1="63" x2="128" y2="90" />
        <line x1="128" y1="63" x2="100" y2="63" />
        <line x1="72" y1="117" x2="72" y2="90" />
        <line x1="72" y1="117" x2="100" y2="117" />
        <line x1="128" y1="117" x2="128" y2="90" />
        <line x1="128" y1="117" x2="100" y2="117" />
      </g>

      {/* Status text */}
      <text
        x="100"
        y="200"
        textAnchor="middle"
        fill="#f2a716"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="12"
        fontWeight="bold"
      >
        1/4 PARTY MEMBERS
      </text>

      {/* Searching text */}
      <text
        x="100"
        y="215"
        textAnchor="middle"
        fill="#f2e7c4"
        fontFamily="monospace"
        fontSize="9"
        opacity="0.5"
      >
        <animate
          attributeName="opacity"
          values="0.5;0.2;0.5"
          dur="1.5s"
          repeatCount="indefinite"
        />
        SEARCHING...
      </text>
    </svg>
  );
}

export default function LandingGaming({ variant }: LandingGamingProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Refs for scroll reveal
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Refs for 3D card logic
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const xpFillRef = useRef<HTMLDivElement>(null);

  // Animation State Refs (for smooth physics)
  const requestRef = useRef<number>();
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  // Stats counting logic
  const statsTriggeredRef = useRef(false);
  const [stats, setStats] = useState({
    scientia: 0,
    ars: 0,
    humanitas: 0,
    techne: 0,
  });

  useEffect(() => {
    setIsMounted(true);

    // 1. Scroll Reveal Observer
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");

          // Trigger card specific animations
          if (entry.target.id === "cardContainer") {
            triggerStats();
            if (xpFillRef.current) {
              setTimeout(() => {
                xpFillRef.current!.style.width = "75%";
              }, 500);
            }
          }
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    revealElements.forEach((el) => observerRef.current?.observe(el));

    // 2. Start Animation Loop
    animate();

    return () => {
      observerRef.current?.disconnect();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Animation Loop for Smooth Tilt
  const animate = () => {
    // Linear Interpolation (Lerp) for smoothness
    // Formula: current = current + (target - current) * friction
    const friction = 0.1; // Lower = heavier/slower, Higher = snappier

    currentRotation.current.x +=
      (targetRotation.current.x - currentRotation.current.x) * friction;
    currentRotation.current.y +=
      (targetRotation.current.y - currentRotation.current.y) * friction;

    if (cardRef.current) {
      cardRef.current.style.transform = `rotateX(${currentRotation.current.x}deg) rotateY(${currentRotation.current.y}deg)`;
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  // 3. Stats Animation Function
  const triggerStats = () => {
    if (statsTriggeredRef.current) return;
    statsTriggeredRef.current = true;

    const targets = {
      scientia: 85,
      ars: 92,
      humanitas: 64,
      techne: 78,
    };

    const duration = 1500;
    const frames = 60;
    const intervalTime = duration / frames;

    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / frames; // 0 to 1

      if (progress >= 1) {
        setStats(targets);
        clearInterval(timer);
      } else {
        setStats({
          scientia: Math.floor(targets.scientia * progress),
          ars: Math.floor(targets.ars * progress),
          humanitas: Math.floor(targets.humanitas * progress),
          techne: Math.floor(targets.techne * progress),
        });
      }
    }, intervalTime);
  };

  // 4. 3D Tilt Logic Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardContainerRef.current) return;

    const rect = cardContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Increased range to 20deg for more drama
    const rotateY = ((x - centerX) / centerX) * 20;
    const rotateX = ((centerY - y) / centerY) * 20; // Inverted Y axis logic is standard, but sometimes feels flipped depending on preference. usually (y - center) / center * -1

    // Update the target, the loop handles the DOM update
    targetRotation.current = { x: -rotateX, y: rotateY };
  };

  const handleMouseLeave = () => {
    // Reset target to center; loop handles smooth return
    targetRotation.current = { x: 0, y: 0 };
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#03318c] font-[family-name:var(--font-space-grotesk)] leading-relaxed text-[#f2e7c4] selection:bg-[#f28705] selection:text-[#03318c]">
      {/* NAV */}
      <nav className="fixed top-0 z-50 w-full border-b border-[#f2e7c4]/20 bg-[#03318c]/90 py-8 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-8">
          <div className="font-[family-name:var(--font-cinzel)] text-2xl font-black tracking-[2px] text-[#f2e7c4]">
            IDEALITE<span className="text-[#f28705]">.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/blog"
              className="font-[family-name:var(--font-jetbrains-mono)] text-sm uppercase tracking-widest text-[#f2e7c4] transition-colors hover:text-[#f2a716]"
            >
              Blog
            </Link>
            <SignedOut>
              <WaitlistButton
                variant={variant}
                className="group flex items-center justify-center border border-[#f2e7c4] bg-transparent px-6 py-2 font-[family-name:var(--font-jetbrains-mono)] text-sm font-bold uppercase tracking-widest text-[#f2e7c4] transition-all duration-300 hover:border-[#f2a716] hover:bg-[#f2a716]/5 hover:text-[#f2a716]"
              >
                Login
              </WaitlistButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/workspace"
                className="group flex items-center justify-center border border-[#f2e7c4] bg-transparent px-6 py-2 font-[family-name:var(--font-jetbrains-mono)] text-sm font-bold uppercase tracking-widest text-[#f2e7c4] transition-all duration-300 hover:border-[#f2a716] hover:bg-[#f2a716]/5 hover:text-[#f2a716]"
              >
                Continue to Workspace
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-32">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[1.2fr_0.8fr]">
          <div className="hero-content">
            <h1 className="reveal-on-scroll ease-out-quart mb-8 translate-y-8 font-[family-name:var(--font-cinzel)] text-5xl font-bold leading-[1.1] tracking-tight opacity-0 transition-all duration-700 md:text-[clamp(3rem,5vw,5rem)] [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
              The <span className="text-[#f28705]">Solo Queue</span> is Over.
            </h1>
            <p className="reveal-on-scroll ease-out-quart mb-8 max-w-[500px] translate-y-8 text-xl text-[#f2e7c4]/80 opacity-0 transition-all delay-100 duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
              Escape the syllabus, explore rabbit holes, and squad up with elite
              autodidacts. The first MMORPG for the intellectually curious.
            </p>
            <div className="reveal-on-scroll ease-out-quart flex translate-y-8 flex-wrap gap-4 opacity-0 transition-all delay-200 duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
              <WaitlistButton
                variant={variant}
                className="inline-flex items-center justify-center bg-[#f28705] px-8 py-4 font-[family-name:var(--font-jetbrains-mono)] font-bold uppercase tracking-widest text-[#03318c] transition-all duration-300 [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(242,135,5,0.4)]"
              >
                Create Character
              </WaitlistButton>
              <a
                href="#quests"
                className="inline-flex items-center justify-center border border-[#f2e7c4] bg-transparent px-8 py-4 font-[family-name:var(--font-jetbrains-mono)] font-bold uppercase tracking-widest text-[#f2e7c4] transition-all duration-300 hover:border-[#f2a716] hover:bg-[#f2a716]/5 hover:text-[#f2a716]"
              >
                View Quest Board
              </a>
            </div>

            <SignedIn>
              <p className="reveal-on-scroll ease-out-quart mt-6 translate-y-8 font-[family-name:var(--font-jetbrains-mono)] text-sm text-[#f2a716] opacity-0 transition-all delay-300 duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
                Already approved?{" "}
                <Link
                  href="/workspace"
                  className="underline transition-colors hover:text-[#f2e7c4]"
                >
                  Continue to workspace
                </Link>
              </p>
            </SignedIn>

{/* <div className="trust-signals reveal-on-scroll ease-out-quart mt-16 translate-y-8 border-t border-[#f2e7c4]/20 pt-4 opacity-0 transition-all delay-300 duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
              <span className="mb-4 block font-[family-name:var(--font-jetbrains-mono)] text-[0.8rem] uppercase opacity-60">
                Guild members from
              </span>
              <div className="flex gap-8 font-[family-name:var(--font-cinzel)] font-bold opacity-50">
                STRIPE&nbsp;&nbsp;//&nbsp;&nbsp;AIRBNB&nbsp;&nbsp;//&nbsp;&nbsp;OPENAI
              </div>
            </div> */}
          </div>

          {/* INTERACTIVE CARD */}
          <div
            className="card-container reveal-on-scroll ease-out-quart perspective-[1000px] mt-12 flex translate-y-8 justify-center p-8 opacity-0 transition-all delay-200 duration-700 md:mt-0 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100"
            id="cardContainer"
            ref={cardContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="char-card relative flex h-[520px] w-[380px] flex-col justify-between rounded border border-[#f2a716] bg-gradient-to-br from-[#103c96] to-[#03318c] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              style={{ transformStyle: "preserve-3d" }}
              id="charCard"
              ref={cardRef}
            >
              <div className="pointer-events-none absolute bottom-[10px] left-[10px] right-[10px] top-[10px] border border-[#f2a716]/30"></div>

              <div className="char-header">
                <div className="char-avatar mb-8 flex h-20 w-20 items-center justify-center bg-[#f2e7c4] [clip-path:polygon(20%_0%,80%_0%,100%_20%,100%_80%,80%_100%,20%_100%,0%_80%,0%_20%)]">
                  {/* SVG Avatar */}
                  <svg
                    viewBox="0 0 24 24"
                    width="40"
                    height="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#f28705]"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h3 className="mb-1 font-[family-name:var(--font-cinzel)] text-xl font-bold">
                  Renaissance_Amateur_07
                </h3>
                <p className="font-[family-name:var(--font-jetbrains-mono)] text-[0.8rem] text-[#f2a716]">
                  Lvl 42 Polymath
                </p>
              </div>

              <div className="char-stats mt-8">
                <div className="mb-4 flex justify-between border-b border-dashed border-[#f2a716]/20 pb-2 font-[family-name:var(--font-jetbrains-mono)] text-[0.9rem]">
                  <span>Scientia</span>
                  <span className="font-bold text-[#f2a716]">
                    {stats.scientia}
                  </span>
                </div>
                <div className="mb-4 flex justify-between border-b border-dashed border-[#f2a716]/20 pb-2 font-[family-name:var(--font-jetbrains-mono)] text-[0.9rem]">
                  <span>Ars</span>
                  <span className="font-bold text-[#f2a716]">
                    {stats.ars}
                  </span>
                </div>
                <div className="mb-4 flex justify-between border-b border-dashed border-[#f2a716]/20 pb-2 font-[family-name:var(--font-jetbrains-mono)] text-[0.9rem]">
                  <span>Humanitas</span>
                  <span className="font-bold text-[#f2a716]">
                    {stats.humanitas}
                  </span>
                </div>
                <div className="mb-4 flex justify-between border-b border-dashed border-[#f2a716]/20 pb-2 font-[family-name:var(--font-jetbrains-mono)] text-[0.9rem]">
                  <span>Techne</span>
                  <span className="font-bold text-[#f2a716]">
                    {stats.techne}
                  </span>
                </div>
              </div>

              <div className="char-footer">
                <p className="mb-1 font-[family-name:var(--font-jetbrains-mono)] text-[0.7rem]">
                  Current Quest: Complete the Quadrivium
                </p>
                <div className="relative mt-2 h-1.5 w-full bg-black/40">
                  <div
                    className="duration-[2000ms] ease-out-expo h-full w-0 bg-[#f28705] transition-[width]"
                    ref={xpFillRef}
                    id="xpFill"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="relative py-32">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-32 px-8 md:grid-cols-2">
          <div className="reveal-on-scroll ease-out-quart relative flex h-[400px] translate-y-8 items-center justify-center overflow-hidden border border-[#f2e7c4]/20 bg-[#103c96]/20 opacity-0 transition-all duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
            <div className="scale-150">
              <EmptyPartySlots />
            </div>
          </div>
          <div className="reveal-on-scroll ease-out-quart translate-y-8 opacity-0 transition-all delay-100 duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
            <h2 className="mb-8 font-[family-name:var(--font-cinzel)] text-5xl font-bold leading-tight">
              Stuck in the <span className="text-[#f28705]">NPC Loop?</span>
            </h2>
            <p className="mb-4 text-[1.1rem] text-[#f2e7c4]/70">
              Traditional education feels like a tutorial level you can't skip.
              Memorize, regurgitate, forget. No exploration. No party members.
            </p>
            <p className="mb-4 text-[1.1rem] text-[#f2e7c4]/70">
              The "Solo Queue" of self-learning is dangerous. You get lost in
              tutorials. You lose motivation. You need a guild.
            </p>
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section
        className="bg-gradient-to-b from-[#03318c] to-[#103c96] py-32 text-center"
        id="quests"
      >
        <div className="mx-auto max-w-[1200px] px-8">
          <h2 className="reveal-on-scroll ease-out-quart translate-y-8 font-[family-name:var(--font-cinzel)] text-5xl font-bold leading-tight opacity-0 transition-all duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
            The Quest Board
          </h2>
          <p className="reveal-on-scroll ease-out-quart mt-4 translate-y-8 font-[family-name:var(--font-jetbrains-mono)] text-[#f2a716] opacity-0 transition-all delay-100 duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
            Interface v2.4 // Connected
          </p>

          <div className="reveal-on-scroll ease-out-quart relative mx-auto mt-16 h-[600px] max-w-[1000px] translate-y-8 overflow-hidden border border-[#f2a716] bg-[#03318c] text-left opacity-0 shadow-[0_0_40px_rgba(242,167,22,0.1)] transition-all delay-200 duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
            <div className="flex h-10 items-center justify-between border-b border-[#f2e7c4]/20 px-4 font-[family-name:var(--font-jetbrains-mono)] text-[0.8rem] text-[#f2a716]">
              <span>IDEALITEOS_SYS_ROOT</span>
              <span>COMING SOON...</span>
            </div>
            <div className="grid h-[calc(100%-40px)] grid-cols-1 md:grid-cols-[250px_1fr]">
              <ul className="hidden border-r border-[#f2e7c4]/20 p-4 md:block">
                <li className="mb-2 cursor-pointer border-l-2 border-[#f2a716] bg-[#f2a716]/10 p-3 font-[family-name:var(--font-jetbrains-mono)] text-[0.9rem] text-[#f2a716] transition-all duration-200">
                  Active Quests
                </li>
                {[
                  "Skill Trees",
                  "Party Finder",
                  "Achievements",
                ].map((item) => (
                  <li
                    key={item}
                    className="mb-2 cursor-pointer border-l-2 border-transparent p-3 font-[family-name:var(--font-jetbrains-mono)] text-[0.9rem] transition-all duration-200 hover:border-l-2 hover:border-[#f2a716] hover:bg-[#f2a716]/10 hover:text-[#f2a716]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <div className="relative p-8">
                <div className="mb-4 flex items-center justify-between border border-[#f2e7c4]/10 bg-[#03318c]/50 p-6">
                  <div>
                    <h4 className="mb-2 font-[family-name:var(--font-cinzel)] font-bold">
                      The Feynman Lectures
                    </h4>
                    <p className="text-[0.9rem] opacity-70">
                      Work through Volume 1: Mechanics.
                    </p>
                  </div>
                  <div className="font-[family-name:var(--font-jetbrains-mono)] font-bold text-[#f2a716]">
                    +1200 XP
                  </div>
                </div>
                <div className="mb-4 flex items-center justify-between border border-[#f2e7c4]/10 bg-[#03318c]/50 p-6">
                  <div>
                    <h4 className="mb-2 font-[family-name:var(--font-cinzel)] font-bold">
                      Digital Homestead
                    </h4>
                    <p className="text-[0.9rem] opacity-70">
                      Build and ship your personal site.
                    </p>
                  </div>
                  <div className="font-[family-name:var(--font-jetbrains-mono)] font-bold text-[#f2a716]">
                    +800 XP
                  </div>
                </div>
                <div className="mb-4 flex items-center justify-between border border-[#f2e7c4]/10 bg-[#03318c]/50 p-6">
                  <div>
                    <h4 className="mb-2 font-[family-name:var(--font-cinzel)] font-bold">
                      Office Hours
                    </h4>
                    <p className="text-[0.9rem] opacity-70">
                      Book a 1:1 with a guild member.
                    </p>
                  </div>
                  <div className="font-[family-name:var(--font-jetbrains-mono)] font-bold text-[#f2a716]">
                    +400 XP
                  </div>
                </div>

                <div className="absolute bottom-8 right-8 font-[family-name:var(--font-jetbrains-mono)] text-[0.8rem] text-[#f2a716]">
                  &gt; Pinging servers...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

{/* SOCIAL PROOF - COMMENTED OUT
      <section className="py-32">
        <div className="mx-auto max-w-[1200px] px-8">
          <h2 className="reveal-on-scroll ease-out-quart translate-y-8 font-[family-name:var(--font-cinzel)] text-5xl font-bold leading-tight opacity-0 transition-all duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
            Legendary Members
          </h2>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="reveal-on-scroll ease-out-quart translate-y-8 border border-[#f2e7c4]/20 bg-[#103c96]/10 p-8 opacity-0 transition-all delay-100 duration-300 duration-700 hover:-translate-y-1.5 hover:border-[#f2a716] [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
              <div className="mb-6 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-[#103c96]"></div>
                <div>
                  <h4 className="font-[family-name:var(--font-cinzel)] font-bold">Sarah Jenks</h4>
                  <div className="inline-block border border-[#f2a716] px-1.5 py-0.5 font-[family-name:var(--font-jetbrains-mono)] text-[0.8rem] text-[#f2a716]">
                    Lvl 60 CTO
                  </div>
                </div>
              </div>
              <p className="text-[#f2e7c4]/90">
                "I stopped paying for conferences. I just log into Idealite. The
                raids (hackathons) are intense, and the loot (job offers) is
                real."
              </p>
            </div>
            <div className="reveal-on-scroll ease-out-quart translate-y-8 border border-[#f2e7c4]/20 bg-[#103c96]/10 p-8 opacity-0 transition-all delay-200 duration-300 duration-700 hover:-translate-y-1.5 hover:border-[#f2a716] [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
              <div className="mb-6 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-[#103c96]"></div>
                <div>
                  <h4 className="font-[family-name:var(--font-cinzel)] font-bold">David Chen</h4>
                  <div className="inline-block border border-[#f2a716] px-1.5 py-0.5 font-[family-name:var(--font-jetbrains-mono)] text-[0.8rem] text-[#f2a716]">
                    Lvl 34 Founder
                  </div>
                </div>
              </div>
              <p className="text-[#f2e7c4]/90">
                "Found my co-founder in the Party Finder. We grinded on a
                side-project for 3 months before taking VC money."
              </p>
            </div>
            <div className="reveal-on-scroll ease-out-quart translate-y-8 border border-[#f2e7c4]/20 bg-[#103c96]/10 p-8 opacity-0 transition-all delay-300 duration-300 duration-700 hover:-translate-y-1.5 hover:border-[#f2a716] [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
              <div className="mb-6 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-[#103c96]"></div>
                <div>
                  <h4 className="font-[family-name:var(--font-cinzel)] font-bold">Elena R.</h4>
                  <div className="inline-block border border-[#f2a716] px-1.5 py-0.5 font-[family-name:var(--font-jetbrains-mono)] text-[0.8rem] text-[#f2a716]">
                    Lvl 51 Senior PM
                  </div>
                </div>
              </div>
              <p className="text-[#f2e7c4]/90">
                "The gamification actually works. Seeing my 'Strategy' stat go
                up is weirdly addictive. I've read 12 books this year because of
                it."
              </p>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* TECH SPECS */}
      <section className="border-t border-[#f2e7c4]/20 py-32">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="reveal-on-scroll ease-out-quart grid translate-y-8 grid-cols-1 gap-[1px] border border-[#f2e7c4]/20 bg-[#f2e7c4]/20 opacity-0 transition-all duration-700 md:grid-cols-3 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
            <div className="bg-[#03318c] p-8 text-center transition-colors duration-300 hover:bg-[#103c96]">
              <div className="mb-4 font-[family-name:var(--font-jetbrains-mono)] text-3xl text-[#f2a716]">
                ⌘
              </div>
              <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-bold">Skill Trees</h3>
              <p className="mt-4 text-[0.9rem] opacity-80">
                Your path, not theirs. Build your personal knowledge tree and
                map the territory as you explore it.
              </p>
            </div>
            <div className="bg-[#03318c] p-8 text-center transition-colors duration-300 hover:bg-[#103c96]">
              <div className="mb-4 font-[family-name:var(--font-jetbrains-mono)] text-3xl text-[#f2a716]">
                ⚡
              </div>
              <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-bold">Live Raids</h3>
              <p className="mt-4 text-[0.9rem] opacity-80">
                Synchronous learning with your guild. Read together, build
                together, think together.
              </p>
            </div>
            <div className="bg-[#03318c] p-8 text-center transition-colors duration-300 hover:bg-[#103c96]">
              <div className="mb-4 font-[family-name:var(--font-jetbrains-mono)] text-3xl text-[#f2a716]">
                ⬢
              </div>
              <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-bold">
                Proof of Work
              </h3>
              <p className="mt-4 text-[0.9rem] opacity-80">
                Your intellectual footprint. Books read, projects shipped,
                connections made.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONVERSION */}
      <section className="relative py-32 text-center" id="join">
        <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#f28705] to-transparent"></div>
        <div className="mx-auto max-w-[1200px] px-8">
          <h2 className="reveal-on-scroll ease-out-quart translate-y-8 font-[family-name:var(--font-cinzel)] text-5xl font-bold leading-tight opacity-0 transition-all duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
            Ready to Spawn?
          </h2>
          <p className="reveal-on-scroll ease-out-quart mt-4 translate-y-8 text-[#f2a716] opacity-0 transition-all delay-100 duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
            Season 4 enrollment closes in:{" "}
            <span className="font-[family-name:var(--font-jetbrains-mono)]">04:21:12</span>
          </p>

          <div className="reveal-on-scroll ease-out-quart my-8 translate-y-8 opacity-0 transition-all delay-200 duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
            <WaitlistButton
              variant={variant}
              className="inline-flex items-center justify-center bg-[#f28705] px-8 py-4 font-[family-name:var(--font-jetbrains-mono)] font-bold uppercase tracking-widest text-[#03318c] transition-all duration-300 [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(242,135,5,0.4)]"
            >
              Join the Guild
            </WaitlistButton>
          </div>
          <p className="reveal-on-scroll ease-out-quart translate-y-8 font-[family-name:var(--font-jetbrains-mono)] text-[0.7rem] opacity-0 opacity-50 transition-all delay-300 duration-700 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100">
            NO CREDIT CARD REQUIRED FOR TUTORIAL MODE
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
