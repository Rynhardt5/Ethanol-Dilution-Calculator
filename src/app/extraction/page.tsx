'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Beaker, Droplets, Info, Leaf, Zap } from 'lucide-react'
import Link from 'next/link'

export default function ExtractionPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif">
            Understanding Polarity in Plant Extraction
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Why different alcohol percentages extract different compounds from
            plants
          </p>
        </div>

        {/* What is Polarity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-2xl">
              <Zap className="h-6 w-6 text-primary" />
              What is Polarity?
            </CardTitle>
            <CardDescription>
              Polarity is the &quot;pull&quot; that molecules have on each other
              — like how magnets can either stick together or repel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Water Molecule */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg mb-2">Water (H₂O)</h3>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    Highly polar — a strong magnet
                  </Badge>
                </div>
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    {/* Water molecule representation - bent structure */}
                    <div className="w-36 h-28 relative mx-auto">
                      {/* Oxygen atom */}
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold z-10">
                        O
                      </div>
                      {/* Hydrogen atoms - positioned for 104.5° bond angle */}
                      <div className="absolute bottom-2 left-1 w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold border-2 border-gray-400 z-10">
                        H
                      </div>
                      <div className="absolute bottom-2 right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold border-2 border-gray-400 z-10">
                        H
                      </div>
                      {/* O-H bonds - properly angled and extended */}
                      <div className="absolute top-10 left-14 w-12 h-1 bg-gray-800 transform rotate-[130deg] origin-left z-0"></div>
                      <div className="absolute top-10 right-14 w-12 h-1 bg-gray-800 transform rotate-[-130deg] origin-right z-0"></div>
                      {/* Partial charges */}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-sm text-red-700 font-bold">
                        δ−
                      </div>
                      <div className="absolute -bottom-3 left-1 text-sm text-blue-700 font-bold">
                        δ+
                      </div>
                      <div className="absolute -bottom-3 right-1 text-sm text-blue-700 font-bold">
                        δ+
                      </div>
                    </div>
                  </div>
                </div>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Attracts other charged molecules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Forms hydrogen bonds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Dissolves sugars, acids, tannins</span>
                  </li>
                </ul>
              </div>

              {/* Ethanol Molecule */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg mb-2">
                    Ethanol (C₂H₅OH)
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    Moderately polar — the middle ground
                  </Badge>
                </div>
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    {/* Ethanol molecule - complete structural representation */}
                    <div className="w-52 h-28 relative mx-auto">
                      {/* First carbon (CH₃) */}
                      <div className="absolute top-10 left-4 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold z-10">
                        C
                      </div>
                      {/* Second carbon (CH₂) */}
                      <div className="absolute top-10 left-18 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold z-10">
                        C
                      </div>
                      {/* Oxygen */}
                      <div className="absolute top-10 left-32 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold z-10">
                        O
                      </div>
                      {/* Hydroxyl hydrogen */}
                      <div className="absolute top-8 left-44 w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold border-2 border-gray-400 z-10">
                        H
                      </div>

                      {/* Hydrogen atoms on first carbon */}
                      <div className="absolute top-2 left-6 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black text-xs font-bold border border-gray-300 z-10">
                        H
                      </div>
                      <div className="absolute bottom-2 left-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black text-xs font-bold border border-gray-300 z-10">
                        H
                      </div>
                      <div className="absolute bottom-2 left-8 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black text-xs font-bold border border-gray-300 z-10">
                        H
                      </div>

                      {/* Hydrogen atoms on second carbon */}
                      <div className="absolute top-2 left-20 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black text-xs font-bold border border-gray-300 z-10">
                        H
                      </div>
                      <div className="absolute bottom-2 left-20 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black text-xs font-bold border border-gray-300 z-10">
                        H
                      </div>

                      {/* C-C and C-O bonds (backbone) */}
                      <div className="absolute top-14 left-14 w-4 h-1 bg-gray-800 z-0"></div>
                      <div className="absolute top-14 left-28 w-4 h-1 bg-gray-800 z-0"></div>
                      <div className="absolute top-13 rotate-[160deg] left-38 w-10 h-1 bg-gray-800 z-0"></div>

                      {/* C-H bonds for first carbon */}
                      <div className="absolute top-8 left-8 w-3 h-1 bg-gray-600 transform rotate-[-90deg] origin-bottom z-0"></div>
                      <div className="absolute top-16 left-5 w-3 h-1 bg-gray-600 transform rotate-[45deg] origin-top z-0"></div>
                      <div className="absolute top-16 left-9 w-3 h-1 bg-gray-600 transform rotate-[-45deg] origin-top z-0"></div>

                      {/* C-H bonds for second carbon */}
                      <div className="absolute top-8 left-22 w-3 h-1 bg-gray-600 transform rotate-[-90deg] origin-bottom z-0"></div>
                      <div className="absolute top-16 left-21 w-3 h-1 bg-gray-600 transform rotate-[45deg] origin-top z-0"></div>

                      {/* Partial charges - only on OH group */}
                      <div className="absolute top-5 left-34 text-sm text-red-700 font-bold">
                        δ−
                      </div>
                      <div className="absolute top-3 left-46 text-sm text-blue-700 font-bold">
                        δ+
                      </div>

                      {/* Labels */}
                      <div className="absolute -bottom-2 left-4 text-xs text-gray-600 font-mono">
                        CH₃
                      </div>
                      <div className="absolute -bottom-2 left-18 text-xs text-gray-600 font-mono">
                        CH₂
                      </div>
                      <div className="absolute -bottom-2 left-36 text-xs text-gray-600 font-mono">
                        OH
                      </div>
                    </div>
                  </div>
                </div>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      One side (–OH group) is magnetic and water-friendly
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      Other side (carbon chain) is smooth and oil-like
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      This &quot;dual personality&quot; lets ethanol dissolve
                      both water-loving and oil-loving compounds
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Key Concept
              </h4>
              <p className="text-sm space-y-2">
                <strong>&quot;Like dissolves like.&quot;</strong>
                <br />
                Polar solvents (like water) pull out polar compounds
                <br />
                Non-polar solvents (like oils) pull out non-polar compounds
                <br />
                Ethanol sits in the middle, making it the perfect all-round
                extractor
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Plant Compounds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-2xl">
              <Leaf className="h-6 w-6 text-primary" />
              Plant Compounds & Their Polarity
            </CardTitle>
            <CardDescription>
              Different compounds prefer different solvents:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {/* Polar Compounds */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">
                    Polar (water-loving)
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <ul className="text-sm space-y-1">
                      <li>• Tannins</li>
                      <li>• Glycosides</li>
                      <li>• Organic acids</li>
                      <li>• Some alkaloids</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Best with 20–50% alcohol</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Semi-Polar Compounds */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-3">
                  <Beaker className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-lg">
                    Semi-polar (in-betweeners)
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <ul className="text-sm space-y-1">
                      <li>• Flavonoids</li>
                      <li>• Phenolics</li>
                      <li>• Some alkaloids</li>
                      <li>• Some essential oils</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Best with 50–70% alcohol</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Non-Polar Compounds */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-lg">
                    Non-polar (oil-loving)
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <ul className="text-sm space-y-1">
                      <li>• Essential oils</li>
                      <li>• Resins</li>
                      <li>• Waxes</li>
                      <li>• Fat-soluble vitamins</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Best with 70–95% alcohol</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Actually Happening */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-2xl">
              <ArrowRight className="h-6 w-6 text-primary" />
              What&apos;s Actually Happening in the Jar?
            </CardTitle>
            <CardDescription>
              Think of your alcohol-water mixture as a specialized extraction
              team, where each member has different strengths
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual representation of the jar */}
            <div className="bg-gradient-to-b from-blue-100 to-green-100 p-6 rounded-lg border-2 border-dashed border-primary/30">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg mb-2">
                  🫙 Inside Your Extraction Jar
                </h3>
                <p className="text-sm text-muted-foreground">
                  The molecular dance happening during extraction
                </p>
              </div>

              {/* Animated-style representation */}
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                    H₂O
                  </div>
                  <p className="text-xs font-medium">Water molecules</p>
                  <p className="text-xs text-muted-foreground">
                    Highly polar &quot;magnets&quot;
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm">
                    EtOH
                  </div>
                  <p className="text-xs font-medium">Ethanol molecules</p>
                  <p className="text-xs text-muted-foreground">
                    Dual-personality bridges
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-600 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                    🌿
                  </div>
                  <p className="text-xs font-medium">Plant compounds</p>
                  <p className="text-xs text-muted-foreground">
                    Waiting to be extracted
                  </p>
                </div>
              </div>
            </div>

            {/* The extraction scenarios */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-center mb-4">
                The Extraction Process at Different Alcohol Levels
              </h3>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-20">
                  <Droplets className="h-12 w-12 text-blue-600" />
                </div>
                <div className="flex justify-start mb-4">
                  <div className="bg-white border-2 border-blue-300 px-4 py-2 rounded-md text-blue-600 font-mono font-bold text-center shadow-sm min-w-[80px]">
                    20–40%
                  </div>
                </div>
                <div className="mb-3">
                  <h4 className="font-semibold text-lg mb-2">
                    💧 Water Takes the Lead
                  </h4>
                  <p className="text-sm mb-3">
                    <strong>The Scene:</strong> Your jar is mostly water with
                    some alcohol backup. Water molecules swarm the plant
                    material like eager magnets.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Water grabs:</strong> Sugars, tannins, acids, and
                      glycosides (the water-loving compounds)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Result:</strong> Gentle, nutritive extracts
                      perfect for fresh herbs and children&apos;s remedies
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Think:</strong> Herbal tea concentrate with longer
                      shelf life
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-20">
                  <Beaker className="h-12 w-12 text-yellow-600" />
                </div>
                <div className="flex justify-start mb-4">
                  <div className="bg-white border-2 border-yellow-300 px-4 py-2 rounded-md text-yellow-600 font-mono font-bold text-center shadow-sm min-w-[80px]">
                    50–60%
                  </div>
                </div>
                <div className="mb-3">
                  <h4 className="font-semibold text-lg mb-2">
                    🤝 Perfect Partnership
                  </h4>
                  <p className="text-sm mb-3">
                    <strong>The Scene:</strong> Water and alcohol work as a
                    balanced team. This is the &quot;sweet spot&quot; for most
                    herbal extractions.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Water handles:</strong> Polar compounds (tannins,
                      acids, some alkaloids)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Alcohol tackles:</strong> Semi-polar compounds
                      (flavonoids, phenolics, many alkaloids)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Together they:</strong> Break through cell walls
                      and extract a broad spectrum of compounds
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Result:</strong> Well-rounded, versatile tinctures
                      for most dried herbs
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg border border-green-200 relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-20">
                  <Leaf className="h-12 w-12 text-green-600" />
                </div>
                <div className="flex justify-start mb-4">
                  <div className="bg-white border-2 border-green-300 px-4 py-2 rounded-md text-green-600 font-mono font-bold text-center shadow-sm min-w-[80px]">
                    70–95%
                  </div>
                </div>
                <div className="mb-3">
                  <h4 className="font-semibold text-lg mb-2">
                    🎯 Alcohol Dominates
                  </h4>
                  <p className="text-sm mb-3">
                    <strong>The Scene:</strong> Alcohol takes charge while water
                    sits on the sidelines. This is for the tough, resinous
                    materials.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Alcohol dissolves:</strong> Resins, waxes,
                      essential oils, and fat-soluble compounds
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Water mostly ignored:</strong> Polar compounds are
                      left behind
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Result:</strong> Potent, concentrated extracts
                      with strong antimicrobial properties
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Think:</strong> Essential oil-rich extracts that
                      pack a punch
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key insight box */}
            <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                The Key Insight
              </h4>
              <p className="text-sm leading-relaxed">
                <strong>
                  It&apos;s not just about what gets extracted—it&apos;s about
                  the balance.
                </strong>{' '}
                Lower alcohol gives you gentle, nutritive compounds. Higher
                alcohol gives you potent, concentrated actives. The middle range
                gives you the best of both worlds. Choose your percentage based
                on what kind of medicine you want to create!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Why Different Percentages Matter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-2xl">
              <ArrowRight className="h-6 w-6 text-primary" />
              Why Different Percentages Matter
            </CardTitle>
            <CardDescription>
              The alcohol percentage changes not just what you extract, but also
              the character of the medicine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    Lower alcohol (20–40%)
                  </Badge>
                </div>
                <p className="text-sm">
                  <strong>→ gentler, nutritive remedies</strong> (good for fresh
                  herbs, children&apos;s remedies, tonics)
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Middle range (50–60%)
                  </Badge>
                </div>
                <p className="text-sm">
                  <strong>→ balanced and versatile</strong> (most dried herbs,
                  general tinctures)
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-800">
                    High alcohol (70–95%)
                  </Badge>
                </div>
                <p className="text-sm">
                  <strong>→ potent and resinous</strong> (resins, barks,
                  antimicrobial extractions, preservation)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Practical Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-2xl">
              <Leaf className="h-6 w-6 text-primary" />
              Practical Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              {/* Visual Extraction Spectrum */}
              <div className="bg-gradient-to-r from-blue-100 via-yellow-100 to-green-100 p-6 rounded-lg border">
                <h3 className="font-semibold mb-4 text-center">
                  Extraction Spectrum
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">20%</div>
                    <div className="text-xs">High water</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      50%
                    </div>
                    <div className="text-xs">Balanced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">80%</div>
                    <div className="text-xs">High alcohol</div>
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  ← More polar compounds extracted | More non-polar compounds
                  extracted →
                </div>
              </div>

              {/* Practical Examples */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">
                    Fresh Herbs (around 40%)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Fresh plants contain water, so they need less alcohol.
                  </p>
                  <div className="text-xs">
                    <strong>Examples:</strong> nettle, chamomile, calendula
                  </div>
                </div>

                <div className="bg-card p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">
                    Dried Herbs (around 60%)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    With the water gone, stronger alcohol helps break through
                    cell walls.
                  </p>
                  <div className="text-xs">
                    <strong>Examples:</strong> echinacea root, ginger, turmeric
                  </div>
                </div>

                <div className="bg-card p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Resins (80–90%)</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sticky, resinous materials need high alcohol to dissolve.
                  </p>
                  <div className="text-xs">
                    <strong>Examples:</strong> propolis, myrrh, frankincense
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Ready to Calculate Your Perfect Dilution?
          </h2>
          <p className="text-muted-foreground">
            Use our calculator to determine the exact amounts for your herbal
            extractions
          </p>
          <div className="flex justify-center pb-20">
            <Link href="/">
              <Button size="lg" className="flex items-center gap-2">
                <Beaker className="h-5 w-5" />
                Go to Calculator
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
