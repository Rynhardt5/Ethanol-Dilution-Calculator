// Shipping cost calculation for Australia wide delivery
// Based on volume ranges: 500mL-1L ($15.25), 1.5L-3L ($23.30), 3.5L-5L ($26.30)

export interface ShippingRate {
  minVolume: number // in mL
  maxVolume: number // in mL
  cost: number // in cents (Stripe format)
  description: string
}

export const SHIPPING_RATES: ShippingRate[] = [
  {
    minVolume: 500,
    maxVolume: 1000,
    cost: 1525, // $15.25 in cents
    description: '500mL - 1L'
  },
  {
    minVolume: 1500,
    maxVolume: 3000,
    cost: 2330, // $23.30 in cents
    description: '1.5L - 3L'
  },
  {
    minVolume: 3500,
    maxVolume: 5000,
    cost: 2630, // $26.30 in cents
    description: '3.5L - 5L'
  }
]

// Extract volume from product name - handles various naming patterns
export function extractVolumeFromProductName(productName: string): number {
  // Convert to lowercase for easier matching
  const name = productName.toLowerCase()
  
  // Pattern 1: Direct volume mentions like "1L", "500mL", "2.5L"
  let volumeMatch = name.match(/(\d+(?:\.\d+)?)\s*(ml|l|litre|liter)/i)
  
  if (volumeMatch) {
    const value = parseFloat(volumeMatch[1])
    const unit = volumeMatch[2].toLowerCase()
    // Convert to mL
    return unit.startsWith('l') ? value * 1000 : value
  }
  
  // Pattern 2: Common bottle sizes - if no explicit volume, infer from context
  if (name.includes('500') && (name.includes('ml') || name.includes('bottle'))) {
    return 500
  }
  
  if (name.includes('1000') && (name.includes('ml') || name.includes('bottle'))) {
    return 1000
  }
  
  // Pattern 3: Look for "1 litre", "1 liter", "500 ml" with spaces
  volumeMatch = name.match(/(\d+(?:\.\d+)?)\s+(ml|l|litre|liter|millilitre|milliliter)/i)
  if (volumeMatch) {
    const value = parseFloat(volumeMatch[1])
    const unit = volumeMatch[2].toLowerCase()
    return unit.startsWith('l') || unit.includes('litre') || unit.includes('liter') ? value * 1000 : value
  }
  
  // Pattern 4: Standard bottle descriptions
  if (name.includes('bottle')) {
    // Default bottle sizes if no other volume found
    if (name.includes('small') || name.includes('500')) return 500
    if (name.includes('large') || name.includes('1l') || name.includes('1000')) return 1000
    if (name.includes('medium')) return 750
  }
  
  // Pattern 5: Fallback - look for any number that might be volume
  const numberMatch = name.match(/(\d+)/)
  if (numberMatch) {
    const num = parseInt(numberMatch[1])
    // If it's a reasonable volume number
    if (num >= 100 && num <= 5000) {
      // Assume mL if under 10, L if reasonable for liters
      return num <= 10 ? num * 1000 : num
    }
  }
  
  return 0
}

export function calculateShippingCost(items: Array<{ name: string; quantity: number; metadata?: Record<string, string> }>): {
  cost: number
  description: string
  breakdown: string[]
  canShip: boolean
  restrictions: string[]
} {
  let totalVolume = 0
  const breakdown: string[] = []
  const restrictions: string[] = []
  let canShip = true
  
  // Check for glass products and calculate volume
  items.forEach(item => {
    // Check if item has glass metadata
    if (item.metadata?.glass === 'true') {
      canShip = false
      restrictions.push(`${item.name} contains glass and cannot be shipped`)
    }
    
    const volumePerItem = extractVolumeFromProductName(item.name)
    const totalItemVolume = volumePerItem * item.quantity
    totalVolume += totalItemVolume
    
    if (volumePerItem > 0) {
      breakdown.push(`${item.name} × ${item.quantity} = ${totalItemVolume}mL`)
    }
  })
  
  // Check if total volume exceeds 5L (5000mL) shipping limit
  if (totalVolume > 5000) {
    canShip = false
    restrictions.push(`Total volume ${(totalVolume / 1000).toFixed(1)}L exceeds 5L shipping limit`)
  }
  
  // If shipping restrictions exist, return restriction info
  if (!canShip) {
    const restrictionReasons = restrictions.join('; ')
    return {
      cost: 0,
      description: `Shipping not available - ${restrictionReasons}`,
      breakdown,
      canShip: false,
      restrictions
    }
  }
  
  // Find appropriate shipping rate
  const applicableRate = SHIPPING_RATES.find(rate => 
    totalVolume >= rate.minVolume && totalVolume <= rate.maxVolume
  )
  
  if (!applicableRate) {
    // If no rate matches, use the highest rate for volumes above 5L
    // or free shipping for volumes below 500mL
    if (totalVolume > 5000) {
      return {
        cost: 2630, // Use highest rate
        description: 'Over 5L (using 3.5L-5L rate)',
        breakdown,
        canShip: true,
        restrictions: []
      }
    } else if (totalVolume < 500) {
      return {
        cost: 0,
        description: 'Free shipping (under 500mL)',
        breakdown,
        canShip: true,
        restrictions: []
      }
    }
  }
  
  return {
    cost: applicableRate?.cost || 0,
    description: applicableRate?.description || 'Standard shipping',
    breakdown,
    canShip: true,
    restrictions: []
  }
}

export function formatShippingCost(costInCents: number): string {
  return `$${(costInCents / 100).toFixed(2)}`
}
