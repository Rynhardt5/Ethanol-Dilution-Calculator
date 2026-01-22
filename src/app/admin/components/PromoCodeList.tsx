'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Ticket,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'

interface PromoCode {
  id: string
  code: string
  discountPercentage: number
  active: boolean
  createdAt: string
  usageCount: number
  maxUsages?: number
  expiresAt?: string
}

export function PromoCodeList() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [newCode, setNewCode] = useState('')
  const [newDiscount, setNewDiscount] = useState('')
  const [newMaxUsages, setNewMaxUsages] = useState('')
  const [newExpiresAt, setNewExpiresAt] = useState('')

  const fetchPromoCodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/promo-codes')
      const data = await response.json()
      setPromoCodes(data.promoCodes || [])
    } catch (error) {
      console.error('Error fetching promo codes:', error)
      toast.error('Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          discountPercentage: parseFloat(newDiscount),
          maxUsages: newMaxUsages ? parseInt(newMaxUsages) : undefined,
          expiresAt: newExpiresAt || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create promo code')
      }

      toast.success('Promo code created successfully')
      setNewCode('')
      setNewDiscount('')
      setNewMaxUsages('')
      setNewExpiresAt('')
      setShowCreateForm(false)
      fetchPromoCodes()
    } catch (error) {
      console.error('Error creating promo code:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create promo code',
      )
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/promo-codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive }),
      })

      if (!response.ok) {
        throw new Error('Failed to update promo code')
      }

      toast.success(
        `Promo code ${!currentActive ? 'activated' : 'deactivated'}`,
      )
      fetchPromoCodes()
    } catch (error) {
      console.error('Error updating promo code:', error)
      toast.error('Failed to update promo code')
    }
  }

  const handleDeletePromoCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) {
      return
    }

    try {
      const response = await fetch(`/api/promo-codes?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete promo code')
      }

      toast.success('Promo code deleted successfully')
      fetchPromoCodes()
    } catch (error) {
      console.error('Error deleting promo code:', error)
      toast.error('Failed to delete promo code')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading promo codes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground">
            Manage discount codes for your customers
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPromoCodes} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Code
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Promo Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePromoCode} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="SUMMER2024"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">
                    Discount Percentage * (1-100)
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    min="1"
                    max="100"
                    step="0.01"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    placeholder="10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsages">Max Usages (optional)</Label>
                  <Input
                    id="maxUsages"
                    type="number"
                    min="1"
                    value={newMaxUsages}
                    onChange={(e) => setNewMaxUsages(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires At (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Promo Code
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {promoCodes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Ticket className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-semibold mb-2">No promo codes yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first promo code to offer discounts to customers
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Promo Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promoCodes.map((promoCode) => {
            const isExpired =
              promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()
            const isMaxedOut =
              promoCode.maxUsages && promoCode.usageCount >= promoCode.maxUsages

            return (
              <Card
                key={promoCode.id}
                className={
                  !promoCode.active || isExpired || isMaxedOut
                    ? 'opacity-60'
                    : ''
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Ticket className="h-5 w-5 text-primary" />
                        <code className="text-lg font-bold">
                          {promoCode.code}
                        </code>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={promoCode.active ? 'default' : 'secondary'}
                        >
                          {promoCode.active ? 'Active' : 'Inactive'}
                        </Badge>
                        {isExpired && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                        {isMaxedOut && (
                          <Badge variant="destructive">Max Uses Reached</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-bold text-lg text-primary">
                        {promoCode.discountPercentage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Uses:
                      </span>
                      <span className="font-medium">
                        {promoCode.usageCount}
                        {promoCode.maxUsages && ` / ${promoCode.maxUsages}`}
                      </span>
                    </div>
                    {promoCode.expiresAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires:
                        </span>
                        <span className="font-medium text-xs">
                          {new Date(promoCode.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium text-xs">
                        {new Date(promoCode.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleActive(promoCode.id, promoCode.active)
                      }
                      className="flex-1"
                    >
                      {promoCode.active ? (
                        <>
                          <ToggleRight className="mr-1 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="mr-1 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePromoCode(promoCode.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
