'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Mail, Phone, MoreHorizontal } from 'lucide-react'
import { Customer } from '../admin.types'
import { formatCurrency, formatDate } from '../utils/customerUtils'

interface CustomerCardProps {
  customer: Customer
  onViewDetails: (customer: Customer) => void
}

export function CustomerCard({ customer, onViewDetails }: CustomerCardProps) {
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <User className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">{customer.name}</span>
                {customer.isGuest && (
                  <Badge variant="secondary" className="text-xs">
                    Guest
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <div className="font-semibold text-green-600">
                {formatCurrency(customer.totalSpent)}
              </div>
              <div className="text-xs text-muted-foreground">
                {customer.orderCount} orders
              </div>
            </div>
            
            <div className="text-right sm:hidden">
              <div className="font-semibold text-green-600 text-sm">
                {formatCurrency(customer.totalSpent)}
              </div>
              <div className="text-xs text-muted-foreground">
                {customer.orderCount} orders
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(customer)}>
                  <User className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t flex justify-between items-center text-xs text-muted-foreground">
          <span>Customer since {formatDate(customer.created)}</span>
          {customer.totalRefunded > 0 && (
            <span className="text-red-600">
              {formatCurrency(customer.totalRefunded)} refunded
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
