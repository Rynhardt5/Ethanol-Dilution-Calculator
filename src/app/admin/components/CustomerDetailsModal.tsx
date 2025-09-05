'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { User } from 'lucide-react'
import { Customer } from '../admin.types'
import { formatCurrency, formatDate } from '../utils/customerUtils'

interface CustomerDetailsModalProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerDetailsModal({
  customer,
  open,
  onOpenChange,
}: CustomerDetailsModalProps) {
  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Name
              </Label>
              <p className="font-medium">{customer.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Email
              </Label>
              <p className="font-medium">{customer.email}</p>
            </div>
            {customer.phone && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Phone
                </Label>
                <p className="font-medium">{customer.phone}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Customer Since
              </Label>
              <p className="font-medium">{formatDate(customer.created)}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(customer.totalSpent)}
                </div>
                <div className="text-sm text-muted-foreground">Total Spent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {customer.orderCount}
                </div>
                <div className="text-sm text-muted-foreground">Orders</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(customer.totalRefunded)}
                </div>
                <div className="text-sm text-muted-foreground">Refunded</div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={customer.isGuest ? 'secondary' : 'default'}>
              {customer.isGuest ? 'Guest Customer' : 'Registered Customer'}
            </Badge>
          </div>

          {/* Additional Info */}
          {customer.address && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Address
              </Label>
              <div className="mt-1 p-3 bg-muted rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(customer.address, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {customer.defaultPaymentMethod && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Default Payment Method
              </Label>
              <p className="font-medium">{customer.defaultPaymentMethod}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
