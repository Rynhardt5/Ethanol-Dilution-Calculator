'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Phone,
  MapPin,
  CheckCircle,
  Truck,
  Package,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { Order } from '../admin.types'
import {
  getStatusColor,
  copyAddressToClipboard,
  formatCurrency,
} from '../utils/orderUtils'

interface OrderCardProps {
  order: Order
  updating: string | null
  refunding: string | null
  onUpdateStatus?: (orderId: string, status: 'pending' | 'collected' | 'shipped') => void
  onRefund?: (orderId: string, paymentIntentId: string) => void
}

export function OrderCard({
  order,
  updating,
  refunding,
  onUpdateStatus,
  onRefund,
}: OrderCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="h-4 w-4" />
      case 'collected':
        return <CheckCircle className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {order.customerName}
            </CardTitle>
            <CardDescription>
              {order.customerEmail} •{' '}
              {new Date(order.createdAt).toLocaleDateString()}
              {order.customerPhone && (
                <>
                  {' • '}
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.customerPhone}
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          <Badge
            className={`${getStatusColor(
              order.status
            )} flex items-center gap-1`}
          >
            {getStatusIcon(order.status)}
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Collection Method */}
        <div>
          <h4 className="font-semibold mb-2">Collection Method</h4>
          <div className="flex items-center gap-2">
            {order.collectionMethod === 'pickup' ? (
              <>
                <MapPin className="h-4 w-4 text-primary" />
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  Collect in Person
                </Badge>
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 text-primary" />
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Ship to Address
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h4 className="font-semibold mb-2">Items</h4>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <Separator className="my-2" />
          {order.collectionMethod === 'shipping' && order.shippingCost && (
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{formatCurrency(order.shippingCost)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Shipping Address
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="text-sm space-y-1">
                <div className="font-medium">{order.customerName}</div>
                <div>{order.shippingAddress.line1}</div>
                {order.shippingAddress.line2 && (
                  <div>{order.shippingAddress.line2}</div>
                )}
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postal_code}
                </div>
                <div className="font-medium">
                  {order.shippingAddress.country}
                </div>
                {order.customerPhone && (
                  <div className="flex items-center gap-1 pt-1 border-t mt-2">
                    <Phone className="h-3 w-3" />
                    <span className="text-xs">{order.customerPhone}</span>
                  </div>
                )}
              </div>
              <div className="mt-2 pt-2 border-t">
                <button
                  className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                  onClick={() => copyAddressToClipboard(order)}
                >
                  📋 Copy Address
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 flex-wrap">
          {order.status === 'pending' && (
            <>
              <Button
                onClick={() => onUpdateStatus?.(order.id, 'collected')}
                disabled={updating === order.id}
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark as Collected
              </Button>
              <Button
                onClick={() => onUpdateStatus?.(order.id, 'shipped')}
                disabled={updating === order.id}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Truck className="h-4 w-4" />
                Mark as Shipped
              </Button>
            </>
          )}
          {(order.status === 'collected' || order.status === 'shipped') && (
            <Button
              onClick={() => onUpdateStatus?.(order.id, 'pending')}
              disabled={updating === order.id}
              variant="outline"
              size="sm"
            >
              Mark as Pending
            </Button>
          )}

          <Button
            onClick={() => onRefund?.(order.id, order.paymentIntentId)}
            disabled={refunding === order.id || updating === order.id}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            {refunding === order.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {refunding === order.id ? 'Processing...' : 'Refund Order'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
