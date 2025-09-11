'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Leaf, Beaker, BookOpen, Bug, ChevronDown, ChevronUp, Gem, Star, Info, Book, Scale, Shield } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Constituent {
  name: string
  class: string
  solubility: {
    water: boolean
    ethanol_range: string
  }
  notes: string
}

interface SolventRecommendation {
  preparation_type: string
  ethanol_percent: string
  ratio: string
  notes: string
}

interface Herb {
  id: string
  common_name: string
  latin_name: string
  alternative_name?: string
  family: string
  summary?: string
  habitat?: string
  parts_used?: string
  related_species?: string
  key_constituents?: string[]
  history_folklore?: string
  key_actions?: string[]
  research?: string[]
  traditional_uses?: string[]
  current_uses?: string[]
  preparations?: string[]
  cautions?: string
  therapeutic_categories?: string[]
  plant_parts_used: string[]
  medicinal_actions: string[]
  indications: string[]
  folk_uses: string
  best_preparations: string[]
  tags: string[]
  is_priority: boolean
  is_featured: boolean
  constituents?: Constituent[]
  solvent_recommendations?: SolventRecommendation[]
  dosage?: string
  safety?: string
  interactions?: string[]
  sources?: string[]
}

interface HerbsResponse {
  herbs: Herb[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface EnrichedData {
  description: string
  detailedUses: string[]
  preparations: Array<{
    type: string
    method: string
    dosage?: string
    notes?: string
  }>
  constituents?: Array<{
    name: string
    type: string
    ethanolPercentage: number
    description: string
  }>
  botanicalInfo?: {
    habitat?: string
    cultivation?: string
    description?: string
    family?: string
    duration?: string
    growthHabit?: string
  }
  contraindications?: string[]
  interactions?: string[]
  scientificEvidence: {
    title?: string
    summary?: string
    source?: string
  }[]
}

export default function HerbsPage() {
  const [herbs, setHerbs] = useState<Herb[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [selectedPreparation, setSelectedPreparation] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedHerb, setSelectedHerb] = useState<Herb | null>(null)
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null)
  const [enrichmentLoading, setEnrichmentLoading] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 24,
    offset: 0,
    hasMore: false,
  })
  const [availableActions, setAvailableActions] = useState<string[]>([])
  const [availablePreparations, setAvailablePreparations] = useState<string[]>([])

  useEffect(() => {
    fetchHerbs()
    fetchFilterOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce search term and trigger new search
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Setting debounced search term:', searchTerm)
      setDebouncedSearchTerm(searchTerm)
    }, 800)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchHerbs = useCallback(
    async (offset = 0) => {
      try {
        console.log('fetchHerbs called with:', {
          offset,
          debouncedSearchTerm,
          selectedAction,
          selectedPreparation,
        })

        if (offset === 0) {
          setSearchLoading(true)
          setLoading(true)
        } else {
          setSearchLoading(true)
        }

        const params = new URLSearchParams({
          limit: pagination.limit.toString(),
          offset: offset.toString(),
        })

        if (debouncedSearchTerm) params.append('query', debouncedSearchTerm)
        if (selectedAction) params.append('action', selectedAction)
        if (selectedPreparation)
          params.append('preparation', selectedPreparation)

        console.log('API call URL:', `/api/herbs?${params}`)

        const response = await fetch(`/api/herbs?${params}`)
        if (response.ok) {
          const data: HerbsResponse = await response.json()
          console.log('API response:', data)

          if (offset === 0) {
            setHerbs(data.herbs)
          } else {
            setHerbs((prev) => [...prev, ...data.herbs])
          }

          setPagination(data.pagination)
        } else {
          console.error(
            'API response not ok:',
            response.status,
            response.statusText
          )
        }
      } catch (error) {
        console.error('Failed to fetch herbs:', error)
      } finally {
        setLoading(false)
        setSearchLoading(false)
      }
    },
    [debouncedSearchTerm, selectedAction, selectedPreparation, pagination.limit]
  )

  const fetchEnrichedData = useCallback(async (herb: Herb) => {
    try {
      setEnrichmentLoading(true)
      const response = await fetch('/api/herbs/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          common_name: herb.common_name,
          latin_name: herb.latin_name,
          medicinal_actions: herb.medicinal_actions || [],
        }),
      })

      if (response.ok) {
        const data: EnrichedData = await response.json()
        console.log('Enriched data received:', data)
        setEnrichedData(data)
      } else {
        console.error(
          'Failed to fetch enriched data:',
          response.status,
          response.statusText
        )
      }
    } catch (error) {
      console.error('Error fetching enriched data:', error)
    } finally {
      setEnrichmentLoading(false)
    }
  }, [])

  const handleHerbSelect = useCallback(
    (herb: Herb) => {
      console.log('Herb selected:', herb.common_name, herb.latin_name)
      setSelectedHerb(herb)
      setEnrichedData(null)
      fetchEnrichedData(herb)
    },
    [fetchEnrichedData]
  )

  // Server-side filtering - no need for client-side filtering
  const filteredHerbs = herbs
  console.log(
    'Current herbs:',
    herbs.length,
    'filteredHerbs:',
    filteredHerbs.length
  )

  useEffect(() => {
    fetchHerbs(0) // Reset to first page when filters change
  }, [debouncedSearchTerm, selectedAction, selectedPreparation, fetchHerbs])

  const fetchFilterOptions = useCallback(async () => {
    try {
      // Fetch available actions and preparations from the database
      // For now, we'll use a simple approach - you might want to create dedicated endpoints
      const [actionsRes, preparationsRes] = await Promise.all([
        fetch('/api/herbs/actions'),
        fetch('/api/herbs/preparations'),
      ])

      if (actionsRes.ok) {
        const actions = await actionsRes.json()
        setAvailableActions(actions)
      }

      if (preparationsRes.ok) {
        const preparations = await preparationsRes.json()
        setAvailablePreparations(preparations)
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error)
      // Fallback to extracting from current herbs
      const actions = new Set<string>()
      const preparations = new Set<string>()
      herbs.forEach((herb) => {
        herb.medicinal_actions?.forEach((action) => actions.add(action))
        herb.best_preparations?.forEach((prep) => preparations.add(prep))
      })
      setAvailableActions(Array.from(actions).sort())
      setAvailablePreparations(Array.from(preparations).sort())
    }
  }, [herbs])

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchHerbs(pagination.offset + pagination.limit)
    }
  }

  console.log(
    'RENDER: Component is rendering, handleHerbSelect exists:',
    !!handleHerbSelect
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Leaf className="h-10 w-10 text-green-600" />
          Herbal Medicine Lookup
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Discover the medicinal properties of herbs and learn how to extract
          their healing compounds using the optimal ethanol concentrations.
          Empower yourself with traditional plant medicine knowledge.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search herbs, conditions, or compounds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-lg py-3"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Select
            value={selectedAction || 'all'}
            onValueChange={(value) =>
              setSelectedAction(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Medicinal Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {availableActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedPreparation || 'all'}
            onValueChange={(value) =>
              setSelectedPreparation(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Preparation Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Preparations</SelectItem>
              {availablePreparations.map((prep) => (
                <SelectItem key={prep} value={prep}>
                  {prep}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(selectedAction || selectedPreparation || debouncedSearchTerm) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setDebouncedSearchTerm('')
                setSelectedAction('')
                setSelectedPreparation('')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchLoading && herbs.length === 0 ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching herbs...</p>
            </div>
          </div>
        ) : (
          filteredHerbs.map((herb) => (
            <Card
              key={herb.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={async () => {
                console.log('Card clicked!', herb.common_name)
                setSelectedHerb(herb)

                // Fetch enriched data
                try {
                  setEnrichmentLoading(true)
                  const response = await fetch('/api/herbs/enrich', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: herb.id,
                      common_name: herb.common_name,
                      latin_name: herb.latin_name,
                      medicinal_actions: herb.medicinal_actions || [],
                    }),
                  })

                  if (response.ok) {
                    const data = await response.json()
                    console.log('Enriched data received:', data)
                    setEnrichedData(data)
                  }
                } catch (error) {
                  console.error('Error fetching enriched data:', error)
                } finally {
                  setEnrichmentLoading(false)
                }
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {herb.is_featured && (
                      <Gem className="h-4 w-4 text-blue-500 fill-blue-500" />
                    )}
                    {herb.is_priority && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    {herb.common_name}
                  </span>
                  <Leaf className="h-5 w-5 text-green-600" />
                </CardTitle>
                <CardDescription className="italic">
                  {herb.latin_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {herb.plant_parts_used &&
                    herb.plant_parts_used.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Parts Used:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {herb.plant_parts_used.map((part) => (
                            <Badge
                              key={part}
                              variant="secondary"
                              className="text-xs"
                            >
                              {part}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {herb.indications && herb.indications.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Good For:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {herb.indications.slice(0, 3).map((indication) => (
                          <Badge
                            key={indication}
                            variant="outline"
                            className="text-xs"
                          >
                            {indication}
                          </Badge>
                        ))}
                        {herb.indications.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{herb.indications.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {herb.best_preparations &&
                    herb.best_preparations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Best Preparations:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {herb.best_preparations.map((prep) => (
                            <Badge
                              key={prep}
                              className="text-xs bg-blue-100 text-blue-800"
                            >
                              {prep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredHerbs.length === 0 && !loading && (
        <div className="text-center py-12">
          <Leaf className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No herbs found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search terms or filters.
          </p>
        </div>
      )}

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="text-center mt-8">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="px-8 py-2"
          >
            {loading
              ? 'Loading...'
              : `Load More (${pagination.total - herbs.length} remaining)`}
          </Button>
        </div>
      )}

      {/* Results Summary */}
      {herbs.length > 0 && (
        <div className="text-center mt-4 text-sm text-gray-500">
          Showing {herbs.length} of {pagination.total} herbs
        </div>
      )}

      {/* Detailed Herb Modal/View */}
      {selectedHerb && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedHerb.common_name}
                  </h2>
                  <p className="text-lg text-gray-600 italic">
                    {selectedHerb.latin_name}
                  </p>
                  {selectedHerb.family && (
                    <p className="text-sm text-gray-500">
                      Family: {selectedHerb.family}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    <Bug className="h-4 w-4" />
                    {showDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setSelectedHerb(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Debug Window */}
              {showDebug && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg border">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Debug Data
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Selected Herb Data:</h4>
                      <pre className="bg-white p-3 rounded border text-xs overflow-x-auto max-h-40">
                        {JSON.stringify(selectedHerb, null, 2)}
                      </pre>
                    </div>
                    {enrichedData && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Enriched Data:</h4>
                        <pre className="bg-white p-3 rounded border text-xs overflow-x-auto max-h-40">
                          {JSON.stringify(enrichedData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Summary/Description */}
                  {selectedHerb.summary && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Description
                      </h3>
                      <p className="text-gray-700">
                        {selectedHerb.summary}
                      </p>
                    </div>
                  )}
                  
                  {/* Enhanced Description (fallback) */}
                  {!selectedHerb.summary && enrichedData?.description && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Description
                      </h3>
                      <p className="text-gray-700">
                        {enrichedData.description}
                      </p>
                    </div>
                  )}

                  {/* Habitat & Cultivation */}
                  {selectedHerb.habitat && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Leaf className="h-5 w-5" />
                        Habitat & Cultivation
                      </h3>
                      <p className="text-gray-700">
                        {selectedHerb.habitat}
                      </p>
                    </div>
                  )}

                  {/* Parts Used */}
                  {selectedHerb.parts_used && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Gem className="h-5 w-5" />
                        Parts Used
                      </h3>
                      <p className="text-gray-700">
                        {selectedHerb.parts_used}
                      </p>
                    </div>
                  )}

                  {/* Key Constituents */}
                  {selectedHerb.key_constituents && selectedHerb.key_constituents.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Beaker className="h-5 w-5" />
                        Key Constituents
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {selectedHerb.key_constituents.map((constituent, index) => (
                          <li key={index}>{constituent}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* History & Folklore */}
                  {selectedHerb.history_folklore && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Book className="h-5 w-5" />
                        History & Folklore
                      </h3>
                      <p className="text-gray-700">
                        {selectedHerb.history_folklore}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Book className="h-5 w-5" />
                      Traditional Uses
                    </h3>
                    <p className="text-gray-700 mb-3">
                      {selectedHerb.folk_uses}
                    </p>

                    {/* Traditional Uses from new data */}
                    {selectedHerb.traditional_uses && selectedHerb.traditional_uses.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium text-gray-800">
                          Traditional Applications:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {selectedHerb.traditional_uses.map((use, index) => (
                            <li key={index}>{use}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Enhanced detailed uses (fallback) */}
                    {(!selectedHerb.traditional_uses || selectedHerb.traditional_uses.length === 0) && 
                     enrichedData?.detailedUses && enrichedData.detailedUses.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-medium text-gray-800">
                            Specific Applications:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {enrichedData.detailedUses.map(
                              (use: string, index: number) => (
                                <li key={index}>{use}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {/* Key Actions from new data */}
                    {selectedHerb.key_actions && selectedHerb.key_actions.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <p className="font-medium text-gray-800">
                          Key Actions:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedHerb.key_actions.map((action, index) => (
                            <Badge
                              key={index}
                              className="bg-green-100 text-green-800"
                            >
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medicinal Actions (fallback) */}
                    {(!selectedHerb.key_actions || selectedHerb.key_actions.length === 0) &&
                      selectedHerb.medicinal_actions && selectedHerb.medicinal_actions.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <p className="font-medium text-gray-800">
                            Medicinal Actions:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedHerb.medicinal_actions.map((action) => (
                              <Badge
                                key={action}
                                className="bg-green-100 text-green-800"
                              >
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Current Uses */}
                  {selectedHerb.current_uses && selectedHerb.current_uses.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Current Uses
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {selectedHerb.current_uses.map((use, index) => (
                          <li key={index}>{use}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Research */}
                  {selectedHerb.research && selectedHerb.research.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Research
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {selectedHerb.research.map((study, index) => (
                          <li key={index}>{study}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Related Species */}
                  {selectedHerb.related_species && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Leaf className="h-5 w-5" />
                        Related Species
                      </h3>
                      <p className="text-gray-700">
                        {selectedHerb.related_species}
                      </p>
                    </div>
                  )}

                  {/* Therapeutic Categories */}
                  {selectedHerb.therapeutic_categories && selectedHerb.therapeutic_categories.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Therapeutic Categories
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedHerb.therapeutic_categories.map((category, index) => (
                          <Badge
                            key={index}
                            className="bg-purple-100 text-purple-800"
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cautions from new data */}
                  {selectedHerb.cautions && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Cautions
                      </h3>
                      <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                        {selectedHerb.cautions}
                      </p>
                    </div>
                  )}

                  {/* Drug Interactions */}

                  {/* Scientific Evidence */}
                  {enrichedData?.scientificEvidence &&
                    enrichedData.scientificEvidence.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Scientific Evidence
                        </h3>
                        <div className="space-y-3">
                          {enrichedData.scientificEvidence
                            .slice(0, 3)
                            .map((article: any, index: number) => (
                              <div
                                key={index}
                                className="border rounded-lg p-3 bg-blue-50"
                              >
                                <h4 className="font-medium text-sm text-blue-900 mb-1">
                                  {article.title}
                                </h4>
                                <p className="text-xs text-blue-700 mb-1">
                                  {article.journal} • {article.pubDate}
                                </p>
                                {article.abstract && (
                                  <p className="text-xs text-gray-600 line-clamp-3">
                                    {article.abstract.substring(0, 200)}...
                                  </p>
                                )}
                                <a
                                  href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  View on PubMed →
                                </a>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Dosage and Safety */}
                  {selectedHerb.dosage && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Scale className="h-5 w-5" />
                        Dosage
                      </h3>
                      <p className="text-gray-700">{selectedHerb.dosage}</p>
                    </div>
                  )}

                  {selectedHerb.safety && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Safety Notes
                      </h3>
                      <p className="text-gray-700">{selectedHerb.safety}</p>
                    </div>
                  )}
                </div>
                <div>
                  {/* Enhanced Preparations */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Beaker className="h-5 w-5" />
                      Preparations & Methods
                    </h3>

                    {/* Preparations from new data */}
                    {selectedHerb.preparations && selectedHerb.preparations.length > 0 && (
                      <div className="space-y-4 mb-6">
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                            Recommended Preparations
                          </h4>
                          <div className="space-y-2">
                            {selectedHerb.preparations.map((prep, index) => (
                              <div
                                key={index}
                                className="border rounded-lg p-3 bg-gray-50"
                              >
                                <p className="text-sm text-gray-700">{prep}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {enrichmentLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">
                          Loading detailed preparations...
                        </p>
                      </div>
                    ) : enrichedData?.preparations ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                            Preparations
                          </h4>
                          <div className="space-y-3">
                            {enrichedData.preparations.map((prep: { type: string; method: string; dosage?: string; notes?: string }, index: number) => (
                              <div
                                key={index}
                                className="border rounded-lg p-3 bg-gray-50"
                              >
                                <h5 className="font-medium text-gray-900">
                                  {prep.type}
                                </h5>
                                <p className="text-sm text-gray-700 mt-1">
                                  {prep.method}
                                </p>
                                {prep.dosage && (
                                  <p className="text-sm text-blue-600 mt-1">
                                    <strong>Dosage:</strong> {prep.dosage}
                                  </p>
                                )}
                                {prep.notes && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {prep.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {enrichedData.constituents &&
                          enrichedData.constituents.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                                Active Compounds
                              </h4>
                              <div className="space-y-2">
                                {enrichedData.constituents.map(
                                  (compound: { name: string; type: string; ethanolPercentage: number; description: string }, index: number) => (
                                    <div
                                      key={index}
                                      className="border rounded-lg p-3 bg-purple-50"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <h6 className="font-medium text-purple-900">
                                            {compound.name}
                                          </h6>
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm text-purple-700 capitalize">
                                              {compound.type}
                                            </p>
                                            <div className="group relative">
                                              <div className="w-4 h-4 rounded-full bg-purple-200 flex items-center justify-center cursor-help">
                                                <span className="text-xs text-purple-600">
                                                  ?
                                                </span>
                                              </div>
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                {compound.description}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right ml-3">
                                          <div className="bg-purple-200 px-2 py-1 rounded text-xs font-medium text-purple-800">
                                            {compound.ethanolPercentage === 0
                                              ? 'Water only'
                                              : `${compound.ethanolPercentage}% ethanol`}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {enrichedData.botanicalInfo && (
                          <div>
                            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                              Botanical Information
                            </h4>
                            <div className="bg-green-50 p-3 rounded-lg">
                              {enrichedData.botanicalInfo.family && (
                                <p className="text-sm">
                                  <strong>Family:</strong>{' '}
                                  {enrichedData.botanicalInfo.family}
                                </p>
                              )}
                              {enrichedData.botanicalInfo.duration && (
                                <p className="text-sm">
                                  <strong>Duration:</strong>{' '}
                                  {enrichedData.botanicalInfo.duration}
                                </p>
                              )}
                              {enrichedData.botanicalInfo.growthHabit && (
                                <p className="text-sm">
                                  <strong>Growth Habit:</strong>{' '}
                                  {enrichedData.botanicalInfo.growthHabit}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {enrichedData.contraindications &&
                          enrichedData.contraindications.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                Safety & Contraindications
                              </h4>
                              <div className="bg-red-50 p-3 rounded-lg">
                                <ul className="text-sm text-red-700 space-y-1">
                                  {enrichedData.contraindications.map(
                                    (item: string, index: number) => (
                                      <li
                                        key={index}
                                        className="flex items-start gap-2"
                                      >
                                        <span className="text-red-500 mt-0.5">
                                          •
                                        </span>
                                        {item}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}

                        {enrichedData.interactions &&
                          enrichedData.interactions.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                                Drug Interactions
                              </h4>
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <ul className="text-sm text-orange-700 space-y-1">
                                  {enrichedData.interactions.map(
                                    (item: string, index: number) => (
                                      <li
                                        key={index}
                                        className="flex items-start gap-2"
                                      >
                                        <span className="text-orange-500 mt-0.5">
                                          •
                                        </span>
                                        {item}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        Basic preparation information available in dosage
                        section.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
