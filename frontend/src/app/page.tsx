'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Brain, 
  Zap, 
  BarChart3, 
  Target, 
  Code2, 
  Globe, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  Layers,
  TrendingUp,
  Users,
  Clock,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Learning',
    description: 'Our engine learns from every interaction, building dynamic user profiles that evolve in real-time.'
  },
  {
    icon: Zap,
    title: 'Instant Personalization',
    description: 'Sub-50ms response times ensure every user sees content tailored to their preferences instantly.'
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    description: 'Track engagement, conversion rates, and segment performance with comprehensive dashboards.'
  },
  {
    icon: Target,
    title: 'Smart Segmentation',
    description: 'Auto-group users into segments like high-value, at-risk, or new visitors using AI clustering.'
  },
  {
    icon: Code2,
    title: 'Easy Integration',
    description: 'Simple JavaScript SDK with just a few lines of code. Works with any website or app.'
  },
  {
    icon: Globe,
    title: 'Real-Time Decision Engine',
    description: 'Rules-based personalization with AI recommendations. Show the right CTA at the right time.'
  }
]

const stats = [
  { value: '50ms', label: 'Avg Response Time', icon: Clock },
  { value: '10M+', label: 'Events Tracked', icon: TrendingUp },
  { value: '99.9%', label: 'Uptime SLA', icon: Shield },
  { value: '50+', label: 'Integrations', icon: Users }
]

const howItWorks = [
  {
    step: '01',
    title: 'Integrate SDK',
    description: 'Add our lightweight JavaScript snippet to your website. Takes less than 5 minutes.'
  },
  {
    step: '02',
    title: 'Track Events',
    description: 'We automatically track clicks, scrolls, time on page, and custom events.'
  },
  {
    step: '03',
    title: 'Build Profiles',
    description: 'AI analyzes behavior patterns and builds dynamic user profiles with interests and scores.'
  },
  {
    step: '04',
    title: 'Personalize',
    description: 'Show personalized content, CTAs, and layouts based on user profiles in real-time.'
  }
]

export default function Home() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-personax-purple to-personax-rose flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-semibold text-xl">PERSONAX</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-personax-purple hover:bg-personax-violet">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center gradient-mesh pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background to-transparent" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-personax-purple/10 border border-personax-purple/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-personax-purple" />
            <span className="text-sm text-personax-purple">Now with AI-powered recommendations</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight animate-fade-in stagger-1">
            Personalization that{' '}
            <span className="bg-gradient-to-r from-personax-purple via-personax-rose to-personax-amber bg-clip-text text-transparent">
              thinks
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in stagger-2">
            Turn anonymous visitors into engaged users. Track behavior, learn preferences, 
            predict intent — and adapt your UI in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in stagger-3">
            <Link href="/dashboard">
              <Button size="lg" className="bg-personax-purple hover:bg-personax-violet px-8 h-12 text-lg">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 h-12 text-lg">
              Watch Demo
            </Button>
          </div>

          {/* Code snippet preview */}
          <div className="mt-16 max-w-xl mx-auto animate-fade-in stagger-4">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-personax-purple/20 via-personax-rose/20 to-personax-cyan/20 rounded-xl blur-2xl opacity-50" />
              <div className="relative bg-dark rounded-xl border border-darkLighter p-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <pre className="text-sm text-gray-400 font-mono">
                  <code>
{`// Add PERSONAX to your site
<script>
  personax.init({
    apiKey: 'pk_xxx',
    track: ['clicks', 'scroll', 'time']
  });
</script>

// Done. Start seeing results.`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-personax-purple/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-personax-rose/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-personax-purple" />
                <div className="text-3xl font-display font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Everything you need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete personalization platform built for modern SaaS teams
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="group border-border/50 hover:border-personax-purple/50 transition-all duration-300 hover:shadow-lg hover:shadow-personax-purple/5"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-personax-purple/10 flex items-center justify-center mb-4 group-hover:bg-personax-purple/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-personax-purple" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 bg-card/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              From zero to personalization
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get up and running in minutes, not weeks
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="relative animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-personax-purple/50 to-transparent" />
                )}
                <div className="text-6xl font-display font-bold text-personax-purple/20 mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-personax-purple/20 via-transparent to-personax-rose/20" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Ready to personalize?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join 500+ companies using PERSONAX to create dynamic, 
            personalized experiences that convert.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-personax-purple hover:bg-personax-violet px-10 h-14 text-lg">
              Start Free Trial
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="px-10 h-14 text-lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-personax-purple to-personax-rose flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-semibold">PERSONAX</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 PERSONAX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}