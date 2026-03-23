import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Target, 
  Settings,
  Bell,
  Search,
  ChevronDown,
  Activity,
  MousePointer,
  Eye,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  { 
    label: 'Total Visitors', 
    value: '12,847', 
    change: '+12.5%', 
    trend: 'up',
    icon: Users 
  },
  { 
    label: 'Active Now', 
    value: '1,234', 
    change: '+8.2%', 
    trend: 'up',
    icon: Activity 
  },
  { 
    label: 'Avg. Engagement', 
    value: '67%', 
    change: '+5.3%', 
    trend: 'up',
    icon: TrendingUp 
  },
  { 
    label: 'Conversions', 
    value: '892', 
    change: '-2.1%', 
    trend: 'down',
    icon: Target 
  }
]

const recentEvents = [
  { type: 'page_view', url: '/pricing', visitors: 234, time: '2 min ago' },
  { type: 'click', url: '/signup-cta', visitors: 156, time: '5 min ago' },
  { type: 'scroll', url: '/features', visitors: 89, time: '8 min ago' },
  { type: 'form_submit', url: '/contact', visitors: 45, time: '12 min ago' },
]

const segments = [
  { name: 'New Users', count: 4521, percentage: 35, color: 'bg-personax-purple' },
  { name: 'Active', count: 6234, percentage: 49, color: 'bg-personax-emerald' },
  { name: 'High Value', count: 1456, percentage: 11, color: 'bg-personax-amber' },
  { name: 'At Risk', count: 636, percentage: 5, color: 'bg-personax-rose' },
]

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-personax-purple to-personax-rose flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-semibold text-xl">PERSONAX</span>
        </div>
        
        <nav className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-personax-purple/10 text-personax-purple">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link href="/dashboard/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Users</span>
          </Link>
          <Link href="/dashboard/events" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <MousePointer className="w-5 h-5" />
            <span className="text-sm font-medium">Events</span>
          </Link>
          <Link href="/dashboard/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Analytics</span>
          </Link>
          <Link href="/dashboard/segments" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium">Segments</span>
          </Link>
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-2">API Key</p>
            <code className="text-xs bg-background px-2 py-1 rounded block truncate">
              pk_xxxxxxxxxxxxxxxx
            </code>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-sm w-64"
              />
            </div>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-personax-purple/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-personax-purple" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-personax-emerald' : 'text-personax-rose'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="text-3xl font-display font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Chart Placeholder */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Traffic Overview</CardTitle>
              <Button variant="outline" size="sm">
                Last 7 days
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chart visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segments */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>User Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {segments.map((segment, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{segment.name}</span>
                      <span className="text-sm text-muted-foreground">{segment.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${segment.color} rounded-full`} 
                        style={{ width: `${segment.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card className="mt-6 border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      {event.type === 'page_view' && <Eye className="w-4 h-4" />}
                      {event.type === 'click' && <MousePointer className="w-4 h-4" />}
                      {event.type === 'scroll' && <TrendingUp className="w-4 h-4" />}
                      {event.type === 'form_submit' && <Users className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{event.type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{event.url}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{event.visitors} visitors</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}