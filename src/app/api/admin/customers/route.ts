import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

interface CustomerData {
  id: string
  email: string
  name: string
  phone?: string
  created: number
  totalSpent: number
  orderCount: number
  totalRefunded: number
  defaultPaymentMethod?: string | null
  address?: Stripe.Address | null
  isGuest: boolean
}

interface GuestGroup {
  id: string
  email?: string
  phone?: string
  cardFingerprint?: string
  billingName?: string
  charges: Stripe.Charge[]
  totalSpent: number
  totalRefunded: number
  created: number
}

async function getAllCustomers(): Promise<Stripe.Customer[]> {
  let allCustomers: Stripe.Customer[] = []
  let hasMore = true
  let startingAfter: string | undefined = undefined

  console.log('Fetching all registered customers...')

  while (hasMore) {
    try {
      const customersResponse: Stripe.ApiList<Stripe.Customer> = await stripe.customers.list({
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.subscriptions']
      })

      allCustomers = allCustomers.concat(customersResponse.data)
      hasMore = customersResponse.has_more
      
      if (hasMore && customersResponse.data.length > 0) {
        startingAfter = customersResponse.data[customersResponse.data.length - 1].id
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      break
    }
  }

  console.log(`Total registered customers: ${allCustomers.length}`)
  return allCustomers
}

async function getAllCharges(): Promise<Stripe.Charge[]> {
  let allCharges: Stripe.Charge[] = []
  let hasMore = true
  let startingAfter: string | undefined = undefined

  console.log('Fetching all charges to identify guest payments...')

  while (hasMore) {
    try {
      const chargesResponse: Stripe.ApiList<Stripe.Charge> = await stripe.charges.list({
        limit: 100,
        starting_after: startingAfter
      })

      allCharges = allCharges.concat(chargesResponse.data)
      hasMore = chargesResponse.has_more
      
      if (hasMore && chargesResponse.data.length > 0) {
        startingAfter = chargesResponse.data[chargesResponse.data.length - 1].id
      }
    } catch (error) {
      console.error('Error fetching charges:', error)
      break
    }
  }

  console.log(`Total charges fetched: ${allCharges.length}`)
  return allCharges
}

function groupGuestCharges(guestCharges: Stripe.Charge[]): GuestGroup[] {
  console.log(`Grouping ${guestCharges.length} guest charges...`)
  
  const groups = new Map<string, GuestGroup & { billingName?: string }>()

  guestCharges.forEach((charge, index) => {
    const email = charge.billing_details?.email
    const phone = charge.billing_details?.phone
    const cardFingerprint = charge.payment_method_details?.card?.fingerprint
    const billingName = charge.billing_details?.name

    if (index < 3) {
      console.log(`Guest charge ${index + 1}:`, {
        id: charge.id,
        email,
        phone,
        billingName,
        cardFingerprint,
        amount: charge.amount,
        status: charge.status
      })
    }

    // Create a unique key for grouping
    let groupKey = ''
    if (email) {
      groupKey = `email:${email}`
    } else if (phone) {
      groupKey = `phone:${phone}`
    } else if (cardFingerprint) {
      groupKey = `card:${cardFingerprint}`
    } else {
      // Fallback: group by charge ID (individual guest)
      groupKey = `charge:${charge.id}`
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        id: `guest_${groupKey.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: email || undefined,
        phone: phone || undefined,
        cardFingerprint: cardFingerprint || undefined,
        billingName: billingName || undefined,
        charges: [],
        totalSpent: 0,
        totalRefunded: 0,
        created: charge.created
      })
      console.log(`Created new guest group: ${groupKey}`)
    }

    const group = groups.get(groupKey)!
    group.charges.push(charge)
    
    // Update billing name if we find a better one (non-empty)
    if (billingName && !group.billingName) {
      group.billingName = billingName
    }
    
    if (charge.status === 'succeeded') {
      group.totalSpent += charge.amount
    }
    group.totalRefunded += charge.amount_refunded
    
    // Use earliest charge date
    if (charge.created < group.created) {
      group.created = charge.created
    }
  })

  const result = Array.from(groups.values())
  console.log(`Created ${result.length} guest groups:`, result.map(g => ({
    id: g.id,
    email: g.email,
    phone: g.phone,
    billingName: g.billingName,
    chargeCount: g.charges.length,
    totalSpent: g.totalSpent
  })))
  
  return result
}

async function getCustomerMetrics(customer: Stripe.Customer) {
  try {
    // Get all payment intents for this customer with pagination
    let allPaymentIntents: Stripe.PaymentIntent[] = []
    let hasMorePI = true
    let startingAfterPI: string | undefined = undefined

    while (hasMorePI) {
      const paymentIntents: Stripe.ApiList<Stripe.PaymentIntent> = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 100,
        starting_after: startingAfterPI
      })

      allPaymentIntents = allPaymentIntents.concat(paymentIntents.data)
      hasMorePI = paymentIntents.has_more
      
      if (hasMorePI && paymentIntents.data.length > 0) {
        startingAfterPI = paymentIntents.data[paymentIntents.data.length - 1].id
      }
    }

    const succeededPayments = allPaymentIntents.filter(pi => pi.status === 'succeeded')
    const totalSpent = succeededPayments.reduce((sum, pi) => sum + pi.amount, 0)

    // Get all charges for refund information with pagination
    let allCharges: Stripe.Charge[] = []
    let hasMoreCharges = true
    let startingAfterCharges: string | undefined = undefined

    while (hasMoreCharges) {
      const charges: Stripe.ApiList<Stripe.Charge> = await stripe.charges.list({
        customer: customer.id,
        limit: 100,
        starting_after: startingAfterCharges
      })

      allCharges = allCharges.concat(charges.data)
      hasMoreCharges = charges.has_more
      
      if (hasMoreCharges && charges.data.length > 0) {
        startingAfterCharges = charges.data[charges.data.length - 1].id
      }
    }

    const totalRefunded = allCharges.reduce((sum, charge) => sum + charge.amount_refunded, 0)

    return {
      id: customer.id,
      email: customer.email || '',
      name: customer.name || customer.email || `Guest Customer`,
      phone: customer.phone || undefined,
      created: customer.created,
      totalSpent,
      orderCount: succeededPayments.length,
      totalRefunded,
      defaultPaymentMethod: typeof customer.invoice_settings?.default_payment_method === 'string' 
        ? customer.invoice_settings.default_payment_method 
        : null,
      address: customer.address || null
    }
  } catch (error) {
    console.error(`Error fetching metrics for customer ${customer.id}:`, error)
    // Return basic customer info if metrics fail
    return {
      id: customer.id,
      email: customer.email || '',
      name: customer.name || customer.email || `Guest Customer`,
      phone: customer.phone || undefined,
      created: customer.created,
      totalSpent: 0,
      orderCount: 0,
      totalRefunded: 0,
      defaultPaymentMethod: typeof customer.invoice_settings?.default_payment_method === 'string' 
        ? customer.invoice_settings.default_payment_method 
        : null,
      address: customer.address || null
    }
  }
}

export async function GET() {
  try {
    console.log('Starting customer and guest fetch process...')
    
    // Fetch both registered customers and all charges in parallel
    const [allCustomers, allCharges] = await Promise.all([
      getAllCustomers(),
      getAllCharges()
    ])

    console.log(`Found ${allCustomers.length} registered customers and ${allCharges.length} total charges`)

    // Separate guest charges (those without customer ID)
    const guestCharges = allCharges.filter(charge => !charge.customer)
    const customerCharges = allCharges.filter(charge => charge.customer)

    console.log(`Guest charges: ${guestCharges.length}, Customer charges: ${customerCharges.length}`)
    
    // Debug: Log sample guest charges
    if (guestCharges.length > 0) {
      console.log('Sample guest charges:', guestCharges.slice(0, 3).map(charge => ({
        id: charge.id,
        amount: charge.amount,
        status: charge.status,
        customer: charge.customer,
        billing_details: charge.billing_details,
        created: charge.created
      })))
    } else {
      console.log('No guest charges found. Sample of all charges:', allCharges.slice(0, 3).map(charge => ({
        id: charge.id,
        amount: charge.amount,
        status: charge.status,
        customer: charge.customer ? 'HAS_CUSTOMER' : 'NO_CUSTOMER',
        billing_details: charge.billing_details
      })))
    }

    // Group guest charges by common identifiers
    const guestGroups = groupGuestCharges(guestCharges)
    console.log(`Created ${guestGroups.length} guest customer groups`)

    // Process registered customers with their metrics
    const batchSize = 10
    const customersWithMetrics: CustomerData[] = []
    
    for (let i = 0; i < allCustomers.length; i += batchSize) {
      const batch = allCustomers.slice(i, i + batchSize)
      console.log(`Processing customer batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allCustomers.length / batchSize)}`)
      
      const batchResults = await Promise.all(
        batch.map(async (customer) => {
          const metrics = await getCustomerMetrics(customer)
          return {
            ...metrics,
            isGuest: false
          }
        })
      )
      
      customersWithMetrics.push(...batchResults)
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < allCustomers.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Convert guest groups to CustomerData format
    const guestCustomers: CustomerData[] = guestGroups.map(group => ({
      id: group.id,
      email: group.email || '',
      name: group.billingName || 
            (group.email ? group.email.split('@')[0] : 
            group.phone ? `Guest (${group.phone})` : 
            'Guest Customer'),
      phone: group.phone,
      created: group.created,
      totalSpent: group.totalSpent,
      orderCount: group.charges.filter(c => c.status === 'succeeded').length,
      totalRefunded: group.totalRefunded,
      defaultPaymentMethod: null,
      address: null,
      isGuest: true
    }))

    // Combine registered customers and guest customers
    const allCustomerData = [...customersWithMetrics, ...guestCustomers]

    // Sort by creation date (newest first)
    allCustomerData.sort((a, b) => b.created - a.created)

    console.log(`Successfully processed ${customersWithMetrics.length} registered customers and ${guestCustomers.length} guest customers`)
    console.log(`Total customer records: ${allCustomerData.length}`)
    
    // Debug: Log final customer data structure
    console.log('Final customer data sample:', allCustomerData.slice(0, 3).map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      isGuest: c.isGuest,
      totalSpent: c.totalSpent,
      orderCount: c.orderCount
    })))

    return NextResponse.json(allCustomerData)
  } catch (error) {
    console.error('Error fetching customers and guests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers and guests' },
      { status: 500 }
    )
  }
}
