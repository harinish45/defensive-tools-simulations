'use client';

import Link from 'next/link';
import { Shield, Firewall, Lock, Eye, BookOpen, AlertTriangle, FileText, Users } from 'lucide-react';

const modules = [
  {
    name: 'Firewall Simulator',
    description: 'Create and test firewall rules with simulated traffic',
    icon: Firewall,
    href: '/firewall',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    name: 'Auth Attack Simulator',
    description: 'Learn about password security and authentication attacks',
    icon: Lock,
    href: '/auth-simulator',
    color: 'from-purple-500 to-pink-500'
  },
  {
    name: 'Keylogger Detection',
    description: 'Detect malicious keylogging behavior in processes',
    icon: Eye,
    href: '/keylogger',
    color: 'from-red-500 to-orange-500'
  },
  {
    name: 'Security Quiz',
    description: 'Test your cybersecurity knowledge',
    icon: BookOpen,
    href: '/quiz',
    color: 'from-green-500 to-emerald-500'
  },
  {
    name: 'Threat Dashboard',
    description: 'Monitor security alerts and incidents',
    icon: AlertTriangle,
    href: '/threats',
    color: 'from-yellow-500 to-red-500'
  },
  {
    name: 'Log Analyzer',
    description: 'Parse and analyze security logs',
    icon: FileText,
    href: '/logs',
    color: 'from-indigo-500 to-purple-500'
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark to-darker">
      {/* Header */}
      <header className="border-b border-primary/20 backdrop-blur-sm bg-dark/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold glow-text">CyberVerse</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-300 hover:text-primary transition-colors">Home</Link>
            <Link href="/#modules" className="text-gray-300 hover:text-primary transition-colors">Modules</Link>
            <a href="http://localhost:8000/docs" target="_blank" className="text-gray-300 hover:text-primary transition-colors">API Docs</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold mb-6 glow-text">
          Cybersecurity Education Platform
        </h2>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
          Learn cybersecurity concepts through interactive simulations, visualizations, and hands-on exercises.
          Safe, educational, and designed for learning.
        </p>
        <div className="flex justify-center gap-4">
          <Link 
            href="/#modules"
            className="px-8 py-3 bg-primary text-dark font-semibold rounded-lg hover:bg-cyan-400 transition-colors glow-border"
          >
            Explore Modules
          </Link>
          <a 
            href="http://localhost:8000/docs"
            target="_blank"
            className="px-8 py-3 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/10 transition-colors"
          >
            View API
          </a>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12 glow-text">Learning Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Link 
              key={module.name}
              href={module.href}
              className="card-dark p-6 rounded-xl hover:glow-border transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <module.icon className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-primary">{module.name}</h4>
              <p className="text-gray-400">{module.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12 glow-text">Why CyberVerse?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-dark p-6 rounded-xl text-center">
            <Users className="w-10 h-10 text-primary mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Multi-User Support</h4>
            <p className="text-gray-400 text-sm">Role-based access for students and instructors</p>
          </div>
          <div className="card-dark p-6 rounded-xl text-center">
            <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Safe Environment</h4>
            <p className="text-gray-400 text-sm">All simulations run in isolated mock environments</p>
          </div>
          <div className="card-dark p-6 rounded-xl text-center">
            <BookOpen className="w-10 h-10 text-primary mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Educational Focus</h4>
            <p className="text-gray-400 text-sm">Designed for learning, not real attacks</p>
          </div>
          <div className="card-dark p-6 rounded-xl text-center">
            <AlertTriangle className="w-10 h-10 text-primary mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Real-time Feedback</h4>
            <p className="text-gray-400 text-sm">Instant visualization of security concepts</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/20 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>CyberVerse - Educational Cybersecurity Demo Platform</p>
          <p className="text-sm mt-2">For educational purposes only. All simulations use mock data.</p>
        </div>
      </footer>
    </div>
  );
}
