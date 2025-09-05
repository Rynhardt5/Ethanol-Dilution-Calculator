'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Archive,
  Eye,
  Package,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  active: boolean
  created: number
  images: string[]
}

interface ProductListProps {
  products: Product[]
  onRefresh: () => void
}

export function ProductList({ products, onRefresh }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    images: [] as string[],
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = showActiveOnly ? product.active : true
    return matchesSearch && matchesStatus
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      images: [],
    })
    setImagePreview(null)
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)

      // Upload to Stripe File API
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image to Stripe')
      }

      const { fileUrl } = await response.json()

      setFormData((prev) => ({
        ...prev,
        images: [fileUrl],
      }))

      toast.success('Image uploaded successfully')
      setIsUploading(false)
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      images: [],
    }))
    setImagePreview(null)
  }

  const handleCreateProduct = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Name and price are required')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          images: formData.images,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create product')
      }

      toast.success('Product created successfully')
      setIsCreateModalOpen(false)
      resetForm()
      onRefresh()
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Failed to create product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProduct = async () => {
    if (!selectedProduct || !formData.name || !formData.price) {
      toast.error('Name and price are required')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          images: formData.images,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update product')
      }

      toast.success('Product updated successfully')
      setIsEditModalOpen(false)
      setSelectedProduct(null)
      resetForm()
      onRefresh()
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          active: !product.active,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update product status')
      }

      toast.success(
        `Product ${!product.active ? 'activated' : 'deactivated'} successfully`
      )
      onRefresh()
    } catch (error) {
      console.error('Error updating product status:', error)
      toast.error('Failed to update product status')
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm('Are you sure you want to archive this product?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/admin/products?productId=${product.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      toast.success('Product archived successfully')
      onRefresh()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to archive product')
    }
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: (product.price / 100).toString(), // Convert from cents
      images: product.images,
    })
    // Set preview for existing image
    if (product.images && product.images.length > 0) {
      setImagePreview(product.images[0])
    } else {
      setImagePreview(null)
    }
    setIsEditModalOpen(true)
  }

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-gray-600">Manage your Stripe products</p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <Label htmlFor="price">Price (AUD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="image">Product Image</Label>
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative">
                      <Image
                        src={imagePreview}
                        alt="Product preview"
                        width={200}
                        height={200}
                        className="w-32 h-32 rounded-lg object-cover border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                  {isUploading && (
                    <p className="text-sm text-blue-600">Uploading...</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateProduct} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Product'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="active-only"
            checked={showActiveOnly}
            onCheckedChange={setShowActiveOnly}
          />
          <Label htmlFor="active-only">Active only</Label>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <Card className="py-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {products.length === 0
                ? "You haven't created any products yet."
                : 'No products match your current filters.'}
            </p>
            {products.length === 0 && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Price</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">
                      Created
                    </th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-lg object-contain border"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 border flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">
                              {product.name}
                            </div>
                            {product.description && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-green-600">
                          {formatPrice(product.price)}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={product.active ? 'default' : 'secondary'}
                        >
                          {product.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-sm text-gray-500">
                          {formatDate(product.created)}
                        </span>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEditModal(product)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(product)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {product.active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProduct(product)}
                              className="text-red-600"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter product description"
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price (AUD)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="edit-image">Product Image</Label>
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Product preview"
                      width={200}
                      height={200}
                      className="w-32 h-32 rounded-lg object-cover border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                )}
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
                {isUploading && (
                  <p className="text-sm text-blue-600">Uploading...</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleEditProduct} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
