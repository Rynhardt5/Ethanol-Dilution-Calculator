'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Upload, Database, ExternalLink } from 'lucide-react'

export default function HerbsUploadPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    totalHerbs?: number
    gistId?: string
  } | null>(null)
  const [gistStatus, setGistStatus] = useState<{
    totalHerbs: number
    gistId: string
    lastUpdated: string
  } | null>(null)

  const handleUpload = async () => {
    setIsUploading(true)
    setUploadResult(null)

    try {
      const response = await fetch('/api/herbs/upload-to-gist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      setUploadResult(result)

      if (result.success) {
        // Refresh gist status after successful upload
        await checkGistStatus()
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Failed to upload herbs data'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const checkGistStatus = async () => {
    try {
      const response = await fetch('/api/herbs/upload-to-gist')
      const result = await response.json()
      
      if (result.success) {
        setGistStatus(result)
      }
    } catch (error) {
      console.error('Failed to check gist status:', error)
    }
  }

  // Check gist status on component mount
  useState(() => {
    checkGistStatus()
  })

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Herbs Database Management</h1>
        <p className="text-muted-foreground">
          Upload the merged Duke herbs database to GitHub Gist for public access
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current Gist Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Current Gist Status
            </CardTitle>
            <CardDescription>
              Current state of the herbs database in GitHub Gist
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gistStatus ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Total Herbs:</span>
                  <span>{gistStatus.totalHerbs.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Gist ID:</span>
                  <span className="font-mono text-sm">{gistStatus.gistId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Last Checked:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(gistStatus.lastUpdated).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://gist.github.com/${gistStatus.gistId}`, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Gist
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">Loading gist status...</div>
            )}
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Merged Database
            </CardTitle>
            <CardDescription>
              Upload the merged herbs database (original + Duke data) to GitHub Gist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">What will be uploaded:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Original curated herbs data</li>
                <li>• Transformed Duke phytochemical database</li>
                <li>• Combined dataset with ~2,400+ herbs</li>
                <li>• Standardized schema with constituents and solvent recommendations</li>
              </ul>
            </div>

            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload to GitHub Gist
                </>
              )}
            </Button>

            {uploadResult && (
              <Alert className={uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {uploadResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-red-600" />
                  )}
                  <AlertDescription className={uploadResult.success ? 'text-green-800' : 'text-red-800'}>
                    {uploadResult.message}
                    {uploadResult.totalHerbs && (
                      <div className="mt-1 text-sm">
                        Total herbs uploaded: {uploadResult.totalHerbs.toLocaleString()}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              Required environment variables for GitHub Gist integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <code className="bg-muted px-2 py-1 rounded text-sm">GITHUB_GIST_ID</code>
                <p className="text-sm text-muted-foreground mt-1">
                  The ID of your GitHub Gist where herbs data will be stored
                </p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded text-sm">GITHUB_TOKEN</code>
                <p className="text-sm text-muted-foreground mt-1">
                  Personal access token with gist permissions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
