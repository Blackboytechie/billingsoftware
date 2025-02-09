import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getProducts, createProduct, updateProduct, deleteProduct, getCurrentUser, type Product } from '../../utils/supabase'

interface ProductFormData {
	name: string
	sku: string
	price: number
	stock: number
	category: string
}

interface Filters {
	search: string
	category: string
	sortBy: 'name' | 'price' | 'stock'
	sortOrder: 'asc' | 'desc'
}

const initialFormData: ProductFormData = {
	name: '',
	sku: '',
	price: 0,
	stock: 0,
	category: ''
}

export default function Products() {
	const [products, setProducts] = useState<Product[]>([])
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isDataLoading, setIsDataLoading] = useState(true)
	const [formData, setFormData] = useState<ProductFormData>(initialFormData)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [filters, setFilters] = useState<Filters>({
		search: '',
		category: '',
		sortBy: 'name',
		sortOrder: 'asc'
	})
	const [categories, setCategories] = useState<string[]>([])

	useEffect(() => {
		loadProducts()
	}, [])

	useEffect(() => {
		if (products.length > 0) {
			const uniqueCategories = Array.from(new Set(products.map(p => p.category || 'Uncategorized')))
			setCategories(uniqueCategories)
		}
	}, [products])

	const filteredProducts = products
		.filter(product => {
			const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
				product.sku?.toLowerCase().includes(filters.search.toLowerCase()) ||
				false
			const matchesCategory = !filters.category || product.category === filters.category
			return matchesSearch && matchesCategory
		})
		.sort((a, b) => {
			const order = filters.sortOrder === 'asc' ? 1 : -1
			switch (filters.sortBy) {
				case 'price':
					return (a.price - b.price) * order
				case 'stock':
					return (a.stock - b.stock) * order
				default:
					return a.name.localeCompare(b.name) * order
			}
		})

	async function loadProducts() {
		setIsDataLoading(true)
		try {
			const user = await getCurrentUser()
			if (user?.company_id) {
				const data = await getProducts(user.company_id)
				setProducts(data)
			}
		} catch (error) {
			console.error('Error loading products:', error)
		} finally {
			setIsDataLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		try {
			const user = await getCurrentUser()
			if (!user?.company_id) throw new Error('No company ID found')

			if (editingId) {
				await updateProduct(editingId, { ...formData, company_id: user.company_id })
			} else {
				await createProduct({ ...formData, company_id: user.company_id })
			}
			await loadProducts()
			setIsAddModalOpen(false)
			setFormData(initialFormData)
			setEditingId(null)
		} catch (error) {
			console.error('Error saving product:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleEdit = (product: Product) => {
		setFormData({
			name: product.name,
			sku: product.sku || '',
			price: product.price,
			stock: product.stock,
			category: product.category || ''
		})
		setEditingId(product.id)
		setIsAddModalOpen(true)
	}

	const handleDelete = async (id: number) => {
		if (!confirm('Are you sure you want to delete this product?')) return
		try {
			await deleteProduct(id)
			await loadProducts()
		} catch (error) {
			console.error('Error deleting product:', error)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-medium text-gray-900">Products</h2>
				<button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
					Add Product
				</button>
			</div>

			<div className="bg-white shadow rounded-lg p-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">Search</label>
						<input
							type="text"
							value={filters.search}
							onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
							placeholder="Search products..."
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">Category</label>
						<select
							value={filters.category}
							onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="">All Categories</option>
							{categories.map(cat => (
								<option key={cat} value={cat}>{cat}</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">Sort By</label>
						<select
							value={filters.sortBy}
							onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as any }))}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="name">Name</option>
							<option value="price">Price</option>
							<option value="stock">Stock</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">Order</label>
						<select
							value={filters.sortOrder}
							onChange={e => setFilters(f => ({ ...f, sortOrder: e.target.value as any }))}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="asc">Ascending</option>
							<option value="desc">Descending</option>
						</select>
					</div>
				</div>
			</div>

			{isDataLoading ? (
				<div className="text-center text-gray-500">Loading products...</div>
			) : filteredProducts.length === 0 ? (
				<div className="text-center text-gray-500">
					{products.length === 0 ? "No products found. Click \"Add Product\" to create one." : "No products match your filters."}
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filteredProducts.map(product => (
						<motion.div
							key={product.id}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="bg-white shadow rounded-lg p-4"
						>
							<div className="flex justify-between items-start mb-2">
								<div className="text-lg font-medium text-gray-900">{product.name}</div>
								<div className="text-sm text-gray-500">{product.sku}</div>
							</div>
							<div className="grid grid-cols-2 gap-2 text-sm mb-3">
								<div>
									<span className="text-gray-500">Price:</span>
									<span className="ml-2 text-gray-900">₹{product.price.toFixed(2)}</span>
								</div>
								<div>
									<span className="text-gray-500">Stock:</span>
									<span className="ml-2 text-gray-900">{product.stock}</span>
								</div>
								<div className="col-span-2">
									<span className="text-gray-500">Category:</span>
									<span className="ml-2 text-gray-900">{product.category}</span>
								</div>
							</div>
							<div className="flex justify-end space-x-3">
								<button 
									onClick={() => handleEdit(product)}
									className="text-blue-600 hover:text-blue-900"
								>
									Edit
								</button>
								<button 
									onClick={() => handleDelete(product.id)}
									className="text-red-600 hover:text-red-900"
								>
									Delete
								</button>
							</div>
						</motion.div>
					))}
				</div>
			)}

			{isAddModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
					>
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							{editingId ? 'Edit Product' : 'Add New Product'}
						</h3>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Name</label>
								<input
									type="text"
									required
									value={formData.name}
									onChange={e => setFormData({ ...formData, name: e.target.value })}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">SKU</label>
								<input
									type="text"
									value={formData.sku}
									onChange={e => setFormData({ ...formData, sku: e.target.value })}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Price</label>
								<input
									type="number"
									required
									min="0"
									step="0.01"
									value={formData.price}
									onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Stock</label>
								<input
									type="number"
									required
									min="0"
									value={formData.stock}
									onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Category</label>
								<input
									type="text"
									value={formData.category}
									onChange={e => setFormData({ ...formData, category: e.target.value })}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>
							<div className="flex justify-end space-x-3 pt-4">
								<button
									type="button"
									onClick={() => {
										setIsAddModalOpen(false)
										setFormData(initialFormData)
										setEditingId(null)
									}}
									className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isLoading}
									className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
								>
									{isLoading ? 'Saving...' : 'Save'}
								</button>
							</div>
						</form>
					</motion.div>
				</div>
			)}
		</div>
	)
}