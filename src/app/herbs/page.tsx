'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Leaf, Beaker, AlertTriangle, Book, Star, Gem } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  family: string
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

export default function HerbsPage() {
  const [herbs, setHerbs] = useState<Herb[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [selectedPreparation, setSelectedPreparation] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedHerb, setSelectedHerb] = useState<Herb | null>(null)
  const [pagination, setPagination] = useState({ total: 0, limit: 24, offset: 0, hasMore: false })
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

  const fetchHerbs = useCallback(async (offset = 0) => {
    try {
      console.log('fetchHerbs called with:', { offset, debouncedSearchTerm, selectedAction, selectedPreparation })
      
      if (offset === 0) {
        setSearchLoading(true)
        setLoading(true)
      } else {
        setSearchLoading(true)
      }
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString()
      })

      if (debouncedSearchTerm) params.append('query', debouncedSearchTerm)
      if (selectedAction) params.append('action', selectedAction)
      if (selectedPreparation) params.append('preparation', selectedPreparation)

      console.log('API call URL:', `/api/herbs?${params}`)
      
      const response = await fetch(`/api/herbs?${params}`)
      if (response.ok) {
        const data: HerbsResponse = await response.json()
        console.log('API response:', data)
        
        if (offset === 0) {
          setHerbs(data.herbs)
        } else {
          setHerbs(prev => [...prev, ...data.herbs])
        }
        
        setPagination(data.pagination)
      } else {
        console.error('API response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch herbs:', error)
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }, [debouncedSearchTerm, selectedAction, selectedPreparation, pagination.limit])

  // Server-side filtering - no need for client-side filtering
  const filteredHerbs = herbs

  useEffect(() => {
    fetchHerbs(0) // Reset to first page when filters change
  }, [debouncedSearchTerm, selectedAction, selectedPreparation, fetchHerbs])

  const fetchFilterOptions = useCallback(async () => {
    try {
      // Fetch available actions and preparations from the database
      // For now, we'll use a simple approach - you might want to create dedicated endpoints
      const [actionsRes, preparationsRes] = await Promise.all([
        fetch('/api/herbs/actions'),
        fetch('/api/herbs/preparations')
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
      herbs.forEach(herb => {
        herb.medicinal_actions?.forEach(action => actions.add(action))
        herb.best_preparations?.forEach(prep => preparations.add(prep))
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

  const fetchHerbDetails = useCallback(async (herbId: string) => {
    try {
      const response = await fetch(`/api/herbs?id=${herbId}`)
      if (response.ok) {
        const herb = await response.json()
        setSelectedHerb(herb)
      } else {
        console.error('Failed to fetch herb details:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching herb details:', error)
    }
  }, [])


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Leaf className="h-10 w-10 text-green-600" />
          Herbal Medicine Lookup
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Discover the medicinal properties of herbs and learn how to extract their healing compounds 
          using the optimal ethanol concentrations. Empower yourself with traditional plant medicine knowledge.
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
          <Select value={selectedAction || "all"} onValueChange={(value) => setSelectedAction(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Medicinal Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {availableActions.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPreparation || "all"} onValueChange={(value) => setSelectedPreparation(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Preparation Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Preparations</SelectItem>
              {availablePreparations.map(prep => (
                <SelectItem key={prep} value={prep}>{prep}</SelectItem>
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
          filteredHerbs.map(herb => (
          <Card key={herb.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => fetchHerbDetails(herb.id)}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {herb.is_featured && <Gem className="h-4 w-4 text-blue-500 fill-blue-500" />}
                  {herb.is_priority && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                  {herb.common_name}
                </span>
                <Leaf className="h-5 w-5 text-green-600" />
              </CardTitle>
              <CardDescription className="italic">{herb.latin_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {herb.plant_parts_used && herb.plant_parts_used.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Parts Used:</p>
                    <div className="flex flex-wrap gap-1">
                      {herb.plant_parts_used.map(part => (
                        <Badge key={part} variant="secondary" className="text-xs">{part}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {herb.indications && herb.indications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Good For:</p>
                    <div className="flex flex-wrap gap-1">
                      {herb.indications.slice(0, 3).map(indication => (
                        <Badge key={indication} variant="outline" className="text-xs">{indication}</Badge>
                      ))}
                      {herb.indications.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{herb.indications.length - 3} more</Badge>
                      )}
                    </div>
                  </div>
                )}

                {herb.best_preparations && herb.best_preparations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Best Preparations:</p>
                    <div className="flex flex-wrap gap-1">
                      {herb.best_preparations.map(prep => (
                        <Badge key={prep} className="text-xs bg-blue-100 text-blue-800">{prep}</Badge>
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
          <h3 className="text-xl font-medium text-gray-900 mb-2">No herbs found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters.</p>
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
            {loading ? 'Loading...' : `Load More (${pagination.total - herbs.length} remaining)`}
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
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedHerb.common_name}</h2>
                  <p className="text-xl italic text-gray-600 mb-1">{selectedHerb.latin_name}</p>
                  <p className="text-sm text-gray-500">Family: {selectedHerb.family}</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedHerb(null)}>
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Book className="h-5 w-5" />
                      Traditional Uses
                    </h3>
                    <p className="text-gray-700 mb-3">{selectedHerb.folk_uses}</p>
                    {selectedHerb.medicinal_actions && selectedHerb.medicinal_actions.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium text-gray-800">Medicinal Actions:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedHerb.medicinal_actions.map(action => (
                            <Badge key={action} className="bg-green-100 text-green-800">{action}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedHerb.indications && selectedHerb.indications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Good For
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedHerb.indications.map(indication => (
                          <Badge key={indication} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">{indication}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    {selectedHerb.constituents && selectedHerb.constituents.length > 0 && (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <Beaker className="h-5 w-5 mr-2" />
                          Active Constituents
                        </h3>
                        <div className="space-y-3">
                          {selectedHerb.constituents.map((constituent, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">{constituent.name}</h4>
                                {constituent.class && (
                                  <Badge variant="outline" className="text-xs">{constituent.class}</Badge>
                                )}
                              </div>
                              {constituent.notes && (
                                <p className="text-sm text-gray-600 mb-2">{constituent.notes}</p>
                              )}
                              {constituent.solubility && (
                                <div className="text-xs text-gray-500">
                                  <span className="font-medium">Best extracted with:</span> 
                                  {constituent.solubility.ethanol_range && ` ${constituent.solubility.ethanol_range} ethanol`}
                                  {constituent.solubility.water && " or water"}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {selectedHerb.solvent_recommendations && selectedHerb.solvent_recommendations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Beaker className="h-5 w-5" />
                        Extraction Methods
                      </h3>
                      <div className="space-y-3">
                        {selectedHerb.solvent_recommendations.map((rec, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900 capitalize">{rec.preparation_type}</h4>
                              {rec.ethanol_percent && (
                                <Badge className="bg-blue-100 text-blue-800">{rec.ethanol_percent}</Badge>
                              )}
                            </div>
                            {rec.ratio && (
                              <p className="text-sm font-medium text-gray-700 mb-1">Ratio: {rec.ratio}</p>
                            )}
                            {rec.notes && (
                              <p className="text-sm text-gray-600">{rec.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Safety & Dosage
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-800 mb-1">Typical Dosage:</p>
                        <p className="text-gray-700">{selectedHerb.dosage}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 mb-1">Safety Notes:</p>
                        <p className="text-gray-700">{selectedHerb.safety}</p>
                      </div>
                      {selectedHerb.interactions && selectedHerb.interactions.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-800 mb-1">Interactions:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedHerb.interactions.map(interaction => (
                              <Badge key={interaction} variant="destructive" className="text-xs">{interaction}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedHerb.sources && selectedHerb.sources.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Sources</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {selectedHerb.sources.map((source, index) => (
                          <li key={index}>• {source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
