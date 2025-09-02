// Test file to verify shipping cost calculations work with various product names
import { extractVolumeFromProductName, calculateShippingCost } from './shipping'

// Test various product naming patterns
const testProducts = [
  'Ethanol 95% - 500mL',
  'Ethanol 95% - 1L', 
  'Ethanol 95% - 1 Litre',
  'Ethanol 95% - 1000mL',
  'Ethanol 95% 500 ml Bottle',
  'Ethanol 95% 1 Liter Bottle',
  'Premium Ethanol 500mL',
  'Premium Ethanol 1000mL',
  'Organic Ethanol 1L',
  'Ethanol 95% Large Bottle',
  'Ethanol 95% Small Bottle',
  'Ethanol 95% 2.5L',
  'Ethanol 95% 2500mL'
]

export function testVolumeExtraction() {
  console.log('=== Volume Extraction Tests ===')
  testProducts.forEach(productName => {
    const volume = extractVolumeFromProductName(productName)
    console.log(`"${productName}" -> ${volume}mL`)
  })
}

export function testShippingCalculation() {
  console.log('\n=== Shipping Cost Tests ===')
  
  // Test case 1: Single 500mL bottle
  const test1 = [{ name: 'Ethanol 95% - 500mL', quantity: 1 }]
  const shipping1 = calculateShippingCost(test1)
  console.log(`500mL x1: ${shipping1.description} - $${(shipping1.cost / 100).toFixed(2)}`)
  
  // Test case 2: Single 1L bottle  
  const test2 = [{ name: 'Ethanol 95% - 1L', quantity: 1 }]
  const shipping2 = calculateShippingCost(test2)
  console.log(`1L x1: ${shipping2.description} - $${(shipping2.cost / 100).toFixed(2)}`)
  
  // Test case 3: Two 500mL bottles (1L total)
  const test3 = [{ name: 'Ethanol 95% - 500mL', quantity: 2 }]
  const shipping3 = calculateShippingCost(test3)
  console.log(`500mL x2: ${shipping3.description} - $${(shipping3.cost / 100).toFixed(2)}`)
  
  // Test case 4: Mixed products
  const test4 = [
    { name: 'Ethanol 95% - 500mL', quantity: 1 },
    { name: 'Ethanol 95% - 1L', quantity: 1 }
  ]
  const shipping4 = calculateShippingCost(test4)
  console.log(`500mL + 1L: ${shipping4.description} - $${(shipping4.cost / 100).toFixed(2)}`)
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  testVolumeExtraction()
  testShippingCalculation()
}
