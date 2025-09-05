'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, UserCheck, UserX, DollarSign } from 'lucide-react'
import { formatCurrency } from '../utils/customerUtils'

interface CustomerStatsCardsProps {
  stats: {
    total: number
    guests: number
    registered: number
    totalRevenue: number
    averageSpent: number
  }
}

export function CustomerStatsCards({ stats }: CustomerStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-primary" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Customers
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Registered
              </p>
              <p className="text-2xl font-bold">{stats.registered}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <UserX className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Guests
              </p>
              <p className="text-2xl font-bold">{stats.guests}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Avg. Spent
              </p>
              <p className="text-2xl font-bold">{formatCurrency(stats.averageSpent)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
