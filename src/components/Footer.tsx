"use client";
import Link from "next/link";
import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { Lochi } from "./Lochi";

function MiniLabPolyhedron() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.4 + pointer.y * 0.4;
      meshRef.current.rotation.y = t * 0.5 + pointer.x * 0.4;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.3;
      ringRef.current.rotation.x = Math.PI / 4 + Math.sin(t * 0.5) * 0.15;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central 3D Distorted Crystal Node */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.1, 1]} />
        <MeshDistortMaterial
          color="#2ba6f5"
          emissive="#1476b8"
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.8}
          distort={0.3}
          speed={2}
          wireframe={false}
        />
      </mesh>

      {/* Outer Orbital Rings with Glowing Particles */}
      <group ref={ringRef}>
        <mesh>
          <torusGeometry args={[1.7, 0.04, 16, 64]} />
          <meshStandardMaterial color="#44c95a" emissive="#44c95a" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[1.7, 0, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={1} />
        </mesh>
        <mesh position={[-1.7, 0, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#a970ff" emissive="#a970ff" emissiveIntensity={1} />
        </mesh>
      </group>
    </group>
  );
}

export function Footer() {
  const [copied, setCopied] = useState(false);

  const copyBranch = (name: string) => {
    navigator.clipboard?.writeText(name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="relative mt-20 border-t-2 border-line bg-gradient-to-b from-surface via-bg to-[#0d1418] text-body overflow-hidden">
      {/* Dynamic 3D Ambient Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[800px] -translate-x-1/2 rounded-full bg-blue/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 -z-10 h-80 w-80 rounded-full bg-green/10 blur-[100px]" />

      {/* Top 3D Interactive Hero Banner */}
      <div className="mx-auto max-w-6xl px-5 pt-12 pb-8">
        <div className="grid gap-8 rounded-3xl border-2 border-line bg-surface/80 p-6 shadow-2xl backdrop-blur-xl md:grid-cols-12 md:items-center md:p-8">
          {/* Left Description & Brand */}
          <div className="space-y-4 md:col-span-8">
            <div className="flex items-center gap-3">
              <Lochi mood="idle" size={42} />
              <div>
                <span className="text-2xl font-black tracking-tight text-head">
                  lockin<span className="text-green-t">.</span>
                </span>
                <span className="ml-2 rounded-full border border-line bg-soft px-2.5 py-0.5 text-xs font-black text-blue-t">
                  v6.0 Full-Stack
                </span>
              </div>
            </div>
            <p className="max-w-2xl text-base leading-relaxed text-muted">
              The premier interactive study ecosystem for engineering, computer science, and BCA students.
              Features realtime 3D physics apparatuses, algorithm visualizers, seeded mock exam engines, and automated university practical report generators.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green/10 px-3 py-1 text-xs font-extrabold text-green-t border border-green/20">
                <span className="h-2 w-2 rounded-full bg-green animate-pulse" />
                WebGL 2.0 Real-Time Engine Active
              </span>
              <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-extrabold text-blue-t border border-blue/20">
                30+ Interactive 3D Labs
              </span>
              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-extrabold text-purple-400 border border-purple-500/20">
                1,500+ Verified Questions
              </span>
            </div>
          </div>

          {/* Right 3D Interactive Viewport */}
          <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-soft to-surface shadow-inner md:col-span-4">
            <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
              <ambientLight intensity={1.2} />
              <pointLight position={[5, 5, 5]} intensity={2.5} color="#2ba6f5" />
              <pointLight position={[-5, -5, -3]} intensity={2} color="#44c95a" />
              <MiniLabPolyhedron />
            </Canvas>
            <div className="pointer-events-none absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-muted/80">
              <span>Interactive 3D Node</span>
              <span>Drag / Hover Orbit</span>
            </div>
          </div>
        </div>

        {/* Structured Multi-Column Directory */}
        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Column 1: Academic Curriculums */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-head">
              Academic Curriculums
            </h4>
            <ul className="space-y-2 text-sm font-bold">
              <li>
                <Link href="/syllabus/AHT-001" className="hover:text-blue-t transition-colors">
                  Engineering Physics (AHT-001)
                </Link>
              </li>
              <li>
                <Link href="/syllabus/AHT-002" className="hover:text-blue-t transition-colors">
                  Engineering Chemistry (AHT-002)
                </Link>
              </li>
              <li>
                <Link href="/syllabus/AHT-003" className="hover:text-blue-t transition-colors">
                  Engineering Mathematics (AHT-003)
                </Link>
              </li>
              <li>
                <Link href="/syllabus/EET-001" className="hover:text-blue-t transition-colors">
                  Basic Electrical Engg (EET-001)
                </Link>
              </li>
              <li>
                <Link href="/syllabus/CST-001" className="hover:text-blue-t transition-colors">
                  Programming for Problem Solving
                </Link>
              </li>
              <li>
                <Link href="/syllabus/BCA-001" className="hover:text-blue-t transition-colors">
                  BCA Computer Science Track
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: 3D Virtual Labs */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-head">
              3D Virtual Labs
            </h4>
            <ul className="space-y-2 text-sm font-bold">
              <li>
                <Link href="/labs" className="hover:text-green-t transition-colors">
                  All 3D Experiments Directory
                </Link>
              </li>
              <li>
                <Link href="/labs?search=polarimeter" className="hover:text-green-t transition-colors">
                  Laurent Half-Shade Polarimeter
                </Link>
              </li>
              <li>
                <Link href="/labs?search=emwave" className="hover:text-green-t transition-colors">
                  Electromagnetic Vector Field
                </Link>
              </li>
              <li>
                <Link href="/labs?search=bjt" className="hover:text-green-t transition-colors">
                  BJT Transistor Curve Tracer
                </Link>
              </li>
              <li>
                <Link href="/labs?search=transformer" className="hover:text-green-t transition-colors">
                  Power Transformer & Flux
                </Link>
              </li>
              <li>
                <Link href="/labs?search=otto" className="hover:text-green-t transition-colors">
                  4-Stroke Reciprocating Engine
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Study & Practice Suite */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-head">
              Exam & Practice Suite
            </h4>
            <ul className="space-y-2 text-sm font-bold">
              <li>
                <Link href="/quiz" className="hover:text-gold transition-colors">
                  Seeded Unit Quizzes
                </Link>
              </li>
              <li>
                <Link href="/exam" className="hover:text-gold transition-colors">
                  Timed University Mock Tests
                </Link>
              </li>
              <li>
                <Link href="/pyqs" className="hover:text-gold transition-colors">
                  Past Year Question (PYQ) Bank
                </Link>
              </li>
              <li>
                <Link href="/revise" className="hover:text-gold transition-colors">
                  Spaced Repetition Flashcards
                </Link>
              </li>
              <li>
                <Link href="/daily" className="hover:text-gold transition-colors">
                  Daily Challenge & Streaks
                </Link>
              </li>
              <li>
                <Link href="/classes" className="hover:text-gold transition-colors">
                  Study Rooms & Doubts
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-head">
              Platform & Legal
            </h4>
            <ul className="space-y-2 text-sm font-bold">
              <li>
                <Link href="/about" className="hover:text-purple-400 transition-colors">
                  About Lockin Study Platform
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-purple-400 transition-colors">
                  Admin CMS Portal
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-purple-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-purple-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-purple-400 transition-colors">
                  Security Architecture
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-purple-400 transition-colors">
                  Cookie Preferences
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Social, Grievance */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} <span className="font-extrabold text-head">lockin.</span> Built for student excellence across UTU and technical universities.
          </p>

          <div className="flex items-center gap-4 font-bold">
            <Link href="/about" className="hover:text-head transition-colors">About</Link>
            <span className="text-line">•</span>
            <Link href="/security" className="hover:text-head transition-colors">Security</Link>
            <span className="text-line">•</span>
            <Link href="/privacy" className="hover:text-head transition-colors">Privacy</Link>
            <span className="text-line">•</span>
            <a href="mailto:contact@lockin.local" className="hover:text-head transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
