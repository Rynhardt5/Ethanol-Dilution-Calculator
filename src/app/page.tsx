'use client'

import type React from 'react'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calculator, Beaker, Leaf, Info, BadgeInfo } from 'lucide-react'
import Image from 'next/image'

interface DilutionResult {
  ethanolVolume: number
  waterVolume: number
  isValid: boolean
}

export default function EthanolDilutionCalculator() {
  const [startingConcentration, setStartingConcentration] =
    useState<string>('95')
  const [desiredConcentration, setDesiredConcentration] = useState<string>('')
  const [finalVolume, setFinalVolume] = useState<string>('')
  const [result, setResult] = useState<DilutionResult | null>(null)
  const [interactiveEthanolRatio, setInteractiveEthanolRatio] =
    useState<number>(40)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const calculateDilution = () => {
    const c1 = Number.parseFloat(startingConcentration)
    const c2 = Number.parseFloat(desiredConcentration)
    const v2 = Number.parseFloat(finalVolume)

    if (isNaN(c1) || isNaN(c2) || isNaN(v2) || c1 <= 0 || c2 <= 0 || v2 <= 0) {
      setResult({ ethanolVolume: 0, waterVolume: 0, isValid: false })
      return
    }

    if (c2 > c1) {
      setResult({ ethanolVolume: 0, waterVolume: 0, isValid: false })
      return
    }

    // V₁ = (C₂ / C₁) × V₂
    const v1 = (c2 / c1) * v2
    const waterVolume = v2 - v1

    setResult({
      ethanolVolume: Math.round(v1 * 100) / 100,
      waterVolume: Math.round(waterVolume * 100) / 100,
      isValid: true,
    })
  }

  const resetCalculator = () => {
    setDesiredConcentration('')
    setFinalVolume('')
    setResult(null)
  }

  const calculateEthanolPercentage = (ratio: number) => {
    // Convert ratio (0-100) to actual ethanol percentage
    // Assuming 95% starting ethanol
    return Math.round((ratio / 100) * 95 * 100) / 100
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = (e.target as HTMLElement)
        .closest('.interactive-jar')
        ?.getBoundingClientRect()
      if (rect) {
        const y = e.clientY - rect.top
        const height = rect.height
        const ratio = Math.max(0, Math.min(100, ((height - y) / height) * 100))
        setInteractiveEthanolRatio(ratio)
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // Initial calculation
    handleMouseMove(e.nativeEvent)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const y = touch.clientY - rect.top
    const percentage = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100))
    setInteractiveEthanolRatio(percentage)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const y = touch.clientY - rect.top
    const percentage = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100))
    setInteractiveEthanolRatio(percentage)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/fox-logo.png"
                alt="Fox Logo"
                className="w-16 h-16"
                width={64}
                height={64}
              />
            </div>
            <h1 className="text-2xl md:text-4xl text-left md:text-center  font-bold text-foreground font-serif">
              Ethanol Dilution Calculator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            Dilution calculator for herbalists and natural medicine
            practitioners. Create precise ethanol concentrations for tinctures
            and herbal extracts.
          </p>

          {/* Buy Ethanol Button */}
          <div className="pt-4">
            <a
              href="https://buy.stripe.com/dRmfZid941275m94Ap8og02"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg"
            >
              <Leaf className="h-5 w-5" />
              Buy Premium Organic Ethanol
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calculator Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl font-semibold">
                <Calculator className="h-5 w-5 text-primary" />
                Dilution Calculator
              </CardTitle>
              <CardDescription className="font-sans">
                Enter your values to calculate the exact amounts needed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="starting-concentration" className="font-sans">
                    Starting Concentration (%)
                  </Label>
                  <Input
                    id="starting-concentration"
                    type="number"
                    value={startingConcentration}
                    onChange={(e) => setStartingConcentration(e.target.value)}
                    placeholder="95"
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Usually 95% ethanol
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-concentration" className="font-sans">
                    Target Concentration (%)
                  </Label>
                  <Input
                    id="desired-concentration"
                    type="number"
                    value={desiredConcentration}
                    onChange={(e) => setDesiredConcentration(e.target.value)}
                    placeholder="Enter target % (e.g., 40)"
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Target percentage for your tincture
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="final-volume" className="font-sans">
                    Final Volume (mL)
                  </Label>
                  <Input
                    id="final-volume"
                    type="number"
                    value={finalVolume}
                    onChange={(e) => setFinalVolume(e.target.value)}
                    placeholder="Enter volume (e.g., 100)"
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Total volume you want to make
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={calculateDilution} className="flex-1">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate
                </Button>
                <Button variant="secondary" onClick={resetCalculator}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl font-semibold">
                <Beaker className="h-5 w-5 text-primary" />
                Results
              </CardTitle>
              <CardDescription className="font-sans">
                Your dilution measurements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                result.isValid ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-primary/5 rounded-lg border">
                        <div className="text-2xl font-bold text-primary">
                          {result.ethanolVolume} mL
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {startingConcentration}% Ethanol
                        </div>
                      </div>
                      <div className="text-center p-4 bg-secondary/5 rounded-lg border">
                        <div className="text-2xl font-bold text-secondary">
                          {result.waterVolume} mL
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Distilled Water
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Instructions
                      </h4>
                      <ol className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <Badge
                            variant="outline"
                            className="min-w-6 h-6 flex items-center justify-center text-xs"
                          >
                            1
                          </Badge>
                          Measure {result.ethanolVolume} mL of{' '}
                          {startingConcentration}% ethanol
                        </li>
                        <li className="flex gap-2">
                          <Badge
                            variant="outline"
                            className="min-w-6 h-6 flex items-center justify-center text-xs"
                          >
                            2
                          </Badge>
                          Add {result.waterVolume} mL of distilled water
                        </li>
                        <li className="flex gap-2">
                          <Badge
                            variant="outline"
                            className="min-w-6 h-6 flex items-center justify-center text-xs"
                          >
                            3
                          </Badge>
                          Mix thoroughly to achieve {desiredConcentration}%
                          concentration
                        </li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      Please check your values. Desired concentration cannot
                      exceed starting concentration.
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your values and click Calculate to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Eyeball Jar Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-2xl font-semibold">
              <Beaker className="h-5 w-5 text-primary" />
              Eyeball Jar Method
            </CardTitle>
            <CardDescription className="font-sans">
              Practical shortcut when you don&apos;t have measuring tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Interactive Jar Section - Moved to top for better UX */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 md:p-6 rounded-lg border">
              <h4 className="font-semibold mb-4 text-center text-2xl font-serif">
                Interactive Visual Guide
              </h4>

              {/* Mobile-first responsive layout */}
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
                {/* Interactive Jar */}
                <div className="flex-1 text-center">
                  <h5 className="font-medium mb-4 text-primary text-sm md:text-base">
                    Tap and drag to adjust ratio
                  </h5>
                  <div className="flex justify-center">
                    <div className="text-center">
                      <div
                        className="interactive-jar relative w-24 h-40 md:w-28 md:h-44 border-4 border-foreground/40 rounded-b-xl bg-background mx-auto mb-4 cursor-pointer hover:border-primary/60 transition-colors select-none"
                        style={{ touchAction: 'none' }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-green-800/30 rounded-b-lg transition-all duration-150"
                          style={{ height: `${interactiveEthanolRatio}%` }}
                        ></div>
                        <div
                          className="absolute left-0 right-0 bg-blue-200/80"
                          style={{
                            top: 0,
                            height: `${100 - interactiveEthanolRatio}%`,
                          }}
                        ></div>
                        {/* Quarter marks */}
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/30"
                          style={{ top: '25%' }}
                        ></div>
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/30"
                          style={{ top: '50%' }}
                        ></div>
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/30"
                          style={{ top: '75%' }}
                        ></div>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                        {calculateEthanolPercentage(interactiveEthanolRatio)}%
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        ethanol concentration
                      </div>
                      <div className="text-xs text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                        {Math.round(interactiveEthanolRatio)}% ethanol :{' '}
                        {Math.round(100 - interactiveEthanolRatio)}% water
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Reference Jars */}
                <div className="flex-1">
                  <h5 className="font-medium mb-4 text-center text-sm md:text-base">
                    Quick Reference
                  </h5>
                  <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-xs mx-auto">
                    {/* 40% Jar */}
                    <div className="text-center">
                      <div className="relative w-12 h-20 md:w-16 md:h-24 border-2 md:border-3 border-foreground/30 rounded-b-xl bg-background mx-auto mb-2">
                        <div className="absolute bottom-0 left-0 right-0 h-[38%] bg-green-800/30 rounded-b-lg"></div>
                        <div className="absolute bottom-[38%] left-0 right-0 h-[62%] bg-blue-200/80"></div>
                        {/* Quarter marks */}
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/20"
                          style={{ top: '25%' }}
                        ></div>
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/20"
                          style={{ top: '50%' }}
                        ></div>
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/20"
                          style={{ top: '75%' }}
                        ></div>
                      </div>
                      <div className="text-xs md:text-sm font-medium">~40%</div>
                    </div>

                    {/* 50% Jar */}
                    <div className="text-center">
                      <div className="relative w-12 h-20 md:w-16 md:h-24 border-2 md:border-3 border-foreground/30 rounded-b-xl bg-background mx-auto mb-2">
                        <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-green-800/30 rounded-b-lg"></div>
                        <div className="absolute bottom-[50%] left-0 right-0 h-[50%] bg-blue-200/80"></div>
                        {/* Quarter marks */}
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/20"
                          style={{ top: '25%' }}
                        ></div>
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/20"
                          style={{ top: '50%' }}
                        ></div>
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/20"
                          style={{ top: '75%' }}
                        ></div>
                      </div>
                      <div className="text-xs md:text-sm font-medium">~50%</div>
                    </div>

                    {/* 70% Jar */}
                    <div className="text-center">
                      <div className="relative w-12 h-20 md:w-16 md:h-24 border-2 md:border-3 border-foreground/30 rounded-b-xl bg-background mx-auto mb-2">
                        <div className="absolute bottom-0 left-0 right-0 h-[70%] bg-green-800/30 rounded-b-lg"></div>
                        <div className="absolute bottom-[70%] left-0 right-0 h-[30%] bg-blue-200/80"></div>
                        {/* Quarter marks */}
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/20"
                          style={{ top: '25%' }}
                        ></div>
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/20"
                          style={{ top: '50%' }}
                        ></div>
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-foreground/20"
                          style={{ top: '75%' }}
                        ></div>
                      </div>
                      <div className="text-xs md:text-sm font-medium">~70%</div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 mt-4 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 md:w-4 md:h-4 bg-green-800/30 rounded"></div>
                      <span>Ethanol</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-200/80 rounded border border-blue-300/50"></div>
                      <span>Water</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simplified Examples */}
            <div className="grid gap-3 md:gap-4">
              <h4 className="font-semibold text-center mb-2">Common Ratios</h4>
              <div className="grid gap-2 md:gap-3">
                <div className="flex items-center justify-between p-3 md:p-4 bg-secondary/5 rounded-lg border hover:bg-secondary/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-800/15 rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
                      40%
                    </div>
                    <div>
                      <div className="font-medium text-sm md:text-base">
                        Slightly less than half
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        → ~38% actual strength
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 md:p-4 bg-secondary/5 rounded-lg border hover:bg-secondary/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-800/15 rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
                      50%
                    </div>
                    <div>
                      <div className="font-medium text-sm md:text-base">
                        Exactly half the jar
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        → ~47.5% actual strength
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 md:p-4 bg-secondary/5 rounded-lg border hover:bg-secondary/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-800/15 rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
                      70%
                    </div>
                    <div>
                      <div className="font-medium text-sm md:text-base">
                        Almost three quarters
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        → ~66.5% actual strength
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Pro Tip
              </h4>
              <p className="text-sm">
                Mark your jar into quarters with a permanent marker. Fill with
                ethanol to your target level, then top up with water.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reference Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-2xl font-semibold">
              Quick Reference Table (100 mL final volume)
            </CardTitle>
            <CardDescription className="font-sans">
              Common dilution ratios for different herbal applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="text-left py-3 px-2 font-semibold text-primary">
                      Desired %
                    </th>
                    <th className="text-left py-3 px-2 font-semibold">
                      95% Ethanol
                    </th>
                    <th className="text-left py-3 px-2 font-semibold">Water</th>
                    <th className="text-left py-3 px-2 font-semibold">
                      Ratio (approx)
                    </th>
                    <th className="text-left py-3 px-2 font-semibold">
                      Typical Use
                    </th>
                    <th className="text-left py-3 px-2 font-semibold">
                      Herb Examples
                    </th>
                    <th className="text-left py-3 px-2 font-semibold">
                      Fresh/Dried
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-bold text-lg text-primary">
                      40%
                    </td>
                    <td className="py-3 px-2 font-mono font-semibold">42 mL</td>
                    <td className="py-3 px-2 font-mono font-semibold">58 mL</td>
                    <td className="py-3 px-2 font-mono text-sm bg-muted/50 rounded px-2 py-1">
                      4 : 5.5
                    </td>
                    <td className="py-3 px-2">Fresh leaves, flowers</td>
                    <td className="py-3 px-2 text-muted-foreground italic text-sm">
                      Mugwort, Nettle, Chamomile
                    </td>
                    <td className="py-3 px-2">
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                        Fresh
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-bold text-lg text-primary">
                      50%
                    </td>
                    <td className="py-3 px-2 font-mono font-semibold">53 mL</td>
                    <td className="py-3 px-2 font-mono font-semibold">47 mL</td>
                    <td className="py-3 px-2 font-mono text-sm bg-muted/50 rounded px-2 py-1">
                      10 : 9
                    </td>
                    <td className="py-3 px-2">Aromatics, general herbs</td>
                    <td className="py-3 px-2 text-muted-foreground italic text-sm">
                      Lavender, Lemon Myrtle, Peppermint
                    </td>
                    <td className="py-3 px-2">
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                        Fresh/Dried
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-bold text-lg text-primary">
                      60%
                    </td>
                    <td className="py-3 px-2 font-mono font-semibold">63 mL</td>
                    <td className="py-3 px-2 font-mono font-semibold">37 mL</td>
                    <td className="py-3 px-2 font-mono text-sm bg-muted/50 rounded px-2 py-1">
                      6 : 3.5
                    </td>
                    <td className="py-3 px-2">Dried roots, barks</td>
                    <td className="py-3 px-2 text-muted-foreground italic text-sm">
                      Licorice root, Ginger, Valerian
                    </td>
                    <td className="py-3 px-2">
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                        Dried
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-bold text-lg text-primary">
                      70%
                    </td>
                    <td className="py-3 px-2 font-mono font-semibold">74 mL</td>
                    <td className="py-3 px-2 font-mono font-semibold">26 mL</td>
                    <td className="py-3 px-2 font-mono text-sm bg-muted/50 rounded px-2 py-1">
                      14 : 5
                    </td>
                    <td className="py-3 px-2">Tough dried roots, barks</td>
                    <td className="py-3 px-2 text-muted-foreground italic text-sm">
                      Echinacea, Sarsaparilla, Dandelion root
                    </td>
                    <td className="py-3 px-2">
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                        Dried
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-bold text-lg text-primary">
                      80%
                    </td>
                    <td className="py-3 px-2 font-mono font-semibold">84 mL</td>
                    <td className="py-3 px-2 font-mono font-semibold">16 mL</td>
                    <td className="py-3 px-2 font-mono text-sm bg-muted/50 rounded px-2 py-1">
                      5 : 1
                    </td>
                    <td className="py-3 px-2">Sticky roots, resins</td>
                    <td className="py-3 px-2 text-muted-foreground italic text-sm">
                      Frankincense, Gum, Calendula resin
                    </td>
                    <td className="py-3 px-2">
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                        Dried/Resin
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-bold text-lg text-primary">
                      90%
                    </td>
                    <td className="py-3 px-2 font-mono font-semibold">95 mL</td>
                    <td className="py-3 px-2 font-mono font-semibold">5 mL</td>
                    <td className="py-3 px-2 font-mono text-sm bg-muted/50 rounded px-2 py-1">
                      19 : 1
                    </td>
                    <td className="py-3 px-2">Hard resins, gums, propolis</td>
                    <td className="py-3 px-2 text-muted-foreground italic text-sm">
                      Propolis, Myrrh
                    </td>
                    <td className="py-3 px-2">
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                        Resin
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-4 p-3 bg-muted/30 rounded-lg border-l-4 border-primary/50">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> These are common guidelines. Exact
                  ethanol % may vary depending on herb freshness, water content,
                  and desired constituents. Taste and adjust if needed.
                </p>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-6">
              <div className="bg-card p-5 rounded-xl border-2 ">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-primary">40%</div>
                  <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium">
                    Fresh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      95% Ethanol
                    </div>
                    <div className="font-mono font-bold text-lg">42 mL</div>
                  </div>
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Water
                    </div>
                    <div className="font-mono font-bold text-lg">58 mL</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Ratio (approx)
                  </div>
                  <div className="font-mono text-base bg-muted/50 rounded-lg px-3 py-2 inline-block border">
                    4 : 5.5
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Typical Use
                    </div>
                    <div className="text-sm font-medium">
                      Fresh leaves, flowers
                    </div>
                  </div>
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Examples
                    </div>
                    <div className="text-sm italic text-muted-foreground">
                      Mugwort, Nettle
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-xl border-2 ">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-primary">50%</div>
                  <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium">
                    Fresh/Dried
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      95% Ethanol
                    </div>
                    <div className="font-mono font-bold text-lg">53 mL</div>
                  </div>
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Water
                    </div>
                    <div className="font-mono font-bold text-lg">47 mL</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Ratio (approx)
                  </div>
                  <div className="font-mono text-base bg-muted/50 rounded-lg px-3 py-2 inline-block border">
                    10 : 9
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Typical Use
                    </div>
                    <div className="text-sm font-medium">
                      Aromatics, general herbs
                    </div>
                  </div>
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Examples
                    </div>
                    <div className="text-sm italic text-muted-foreground">
                      Lavender, Lemon Myrtle
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-xl border-2 ">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-primary">60%</div>
                  <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium ">
                    Dried
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      95% Ethanol
                    </div>
                    <div className="font-mono font-bold text-lg">63 mL</div>
                  </div>
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Water
                    </div>
                    <div className="font-mono font-bold text-lg">37 mL</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Ratio (approx)
                  </div>
                  <div className="font-mono text-base bg-muted/50 rounded-lg px-3 py-2 inline-block border">
                    6 : 3.5
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Typical Use
                    </div>
                    <div className="text-sm font-medium">Roots, barks</div>
                  </div>
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Examples
                    </div>
                    <div className="text-sm italic text-muted-foreground">
                      Licorice root, Ginger
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-xl border-2 ">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-primary">70%</div>
                  <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium ">
                    Dried
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      95% Ethanol
                    </div>
                    <div className="font-mono font-bold text-lg">74 mL</div>
                  </div>
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Water
                    </div>
                    <div className="font-mono font-bold text-lg">26 mL</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Ratio (approx)
                  </div>
                  <div className="font-mono text-base bg-muted/50 rounded-lg px-3 py-2 inline-block border">
                    14 : 5
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Typical Use
                    </div>
                    <div className="text-sm font-medium">
                      Dried roots, barks
                    </div>
                  </div>
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Examples
                    </div>
                    <div className="text-sm italic text-muted-foreground">
                      Echinacea, Sarsaparilla
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-xl border-2 ">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-primary">80%</div>
                  <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium">
                    Dried/Resin
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      95% Ethanol
                    </div>
                    <div className="font-mono font-bold text-lg">84 mL</div>
                  </div>
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Water
                    </div>
                    <div className="font-mono font-bold text-lg">16 mL</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Ratio (approx)
                  </div>
                  <div className="font-mono text-base bg-muted/50 rounded-lg px-3 py-2 inline-block border">
                    5 : 1
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Typical Use
                    </div>
                    <div className="text-sm font-medium">
                      Sticky roots, resins
                    </div>
                  </div>
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Examples
                    </div>
                    <div className="text-sm italic text-muted-foreground">
                      Frankincense, Gum
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-xl border-2 ">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-primary">90%</div>
                  <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium">
                    Resin
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      95% Ethanol
                    </div>
                    <div className="font-mono font-bold text-lg">95 mL</div>
                  </div>
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Water
                    </div>
                    <div className="font-mono font-bold text-lg">5 mL</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Ratio (approx)
                  </div>
                  <div className="font-mono text-base bg-muted/50 rounded-lg px-3 py-2 inline-block border">
                    19 : 1
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Typical Use
                    </div>
                    <div className="text-sm font-medium">
                      Gums, resins, propolis
                    </div>
                  </div>
                  <div className="bg-background/80 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Examples
                    </div>
                    <div className="text-sm italic text-muted-foreground">
                      Propolis, Myrrh
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Calculation Methods */}
        <div className="grid md:grid-cols-1 gap-6">
          {/* Tips for Tincturing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl font-semibold">
                Tips for Tincturing
              </CardTitle>
              <CardDescription className="font-sans">
                Essential guidelines for successful herbal extractions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-primary/5 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">
                    Fresh vs. Dried
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use lower alcohol percentages (40–50%) for fresh leaves and
                    flowers.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Use higher percentages (70–90%) for dried roots, barks,
                    resins, or gums.
                  </p>
                </div>

                <div className="p-3 bg-primary/5 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">
                    Prepare the Herb
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Chop, crush, or grind roots and barks to increase surface
                    area for extraction.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For sticky or resinous materials, warm slightly or powder to
                    help the ethanol penetrate.
                  </p>
                </div>

                <div className="p-3 bg-primary/5 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">
                    Maceration &amp; Shaking
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Place your prepared herb in a clean glass jar.</p>
                    <p>
                      Cover with your chosen ethanol-water menstruum (40–95%,
                      depending on the herb).
                    </p>
                    <p>
                      Seal tightly and store in a cool, dark place for 4–6
                      weeks.
                    </p>
                    <p>Fresh leafy herbs may be ready in 2–4 weeks.</p>
                    <p>
                      Roots, barks, and resins usually need the full 6 weeks.
                    </p>
                    <p>
                      Shake the jar daily (or as often as you remember) to keep
                      the herb moving and prevent settling.
                    </p>
                    <p>
                      After the maceration period, strain through muslin cloth
                      or a fine sieve, pressing out as much liquid as possible.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-primary/5 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">
                    Tasting &amp; Adjusting Strength
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      Taste a small drop when straining. If the tincture feels
                      too strong, you can:
                    </p>
                    <p>Dilute with water to lower ethanol concentration.</p>
                    <p>
                      Gently simmer in a water bath (not directly on a flame) to
                      evaporate some ethanol.
                    </p>
                    <p>
                      Keep the simmer light to avoid losing volatile compounds.
                    </p>
                    <p>
                      Stop once the tincture tastes less sharp but still potent.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-primary/5 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">
                    Safe Consumption
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      Tinctures are usually taken in dropperfuls (1–5 mL), often
                      diluted in water, tea, or juice.
                    </p>
                    <p>
                      While tinctures may be extracted at 50–95% ethanol, they
                      are not usually taken straight at that strength.
                    </p>
                    <p>
                      Higher-proof tinctures are safe in small doses but can
                      taste harsh and irritate the stomach.
                    </p>
                    <p>
                      For comfort and tradition, tinctures are generally diluted
                      down toward 40% ethanol (or simply dropped into water/tea
                      before use).
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-primary/5 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">Storage</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      Keep tinctures in dark glass bottles, away from light and
                      heat, for maximum potency.
                    </p>
                    <p>
                      At 40% ethanol or higher, tinctures are well preserved and
                      will generally last 3–5 years.
                    </p>
                    <p>
                      Stronger tinctures (60–95%) can remain stable for 5–10+
                      years if stored properly.
                    </p>
                    <p>
                      Very low-proof tinctures (below 30%) may spoil within 1–2
                      years.
                    </p>
                    <p>
                      <strong>Potency note:</strong> Aromatic and volatile
                      compounds (e.g., essential oils in flowers) may gradually
                      fade over 1–2 years, even if the tincture is still safe to
                      use.
                    </p>
                    <p>
                      <strong>Rule of thumb:</strong> If a tincture ever smells
                      sour, off, or moldy, don&apos;t use it. Most tinctures at
                      40%+ remain good for many years.
                    </p>
                    <p>
                      Always label clearly with herb name, alcohol %, date, and
                      volume.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* The "Parts" Method Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl font-semibold">
                The &quot;Parts&quot; Method (Zero Math)
              </CardTitle>
              <CardDescription className="font-sans">
                Instead of worrying about millilitres, just think in parts. A
                &quot;part&quot; can be anything: a spoon, a cup, a shot glass,
                or even a line on your jar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold mb-2">Simple Ratio Formula:</p>
                <p className="font-mono text-sm">
                  95% Ethanol : Water = Target% : (95 - Target%)
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Examples:</h4>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <div className="font-semibold mb-1">40% alcohol</div>
                    <div className="font-mono text-xs mb-2">
                      Ratio = 40 : 55
                    </div>
                    <div>
                      → Use 4 spoonfuls of ethanol + 5½ spoonfuls of water.
                    </div>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <div className="font-semibold mb-1">50% alcohol</div>
                    <div className="font-mono text-xs mb-2">
                      Ratio = 50 : 45
                    </div>
                    <div>→ Use 10 cupfuls of ethanol + 9 cupfuls of water.</div>
                    <div className="text-muted-foreground mt-1">
                      (Or just 1 cup ethanol + a little less than 1 cup water).
                    </div>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <div className="font-semibold mb-1">70% alcohol</div>
                    <div className="font-mono text-xs mb-2">
                      Ratio = 70 : 25
                    </div>
                    <div>→ About 14 ladles ethanol + 5 ladles water.</div>
                    <div className="text-muted-foreground mt-1">
                      (Or 3 scoops ethanol + 1 scoop water).
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Choose any convenient unit (spoonfuls, jar marks, 10 mL
                measures) and keep the proportions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
