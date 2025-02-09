import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCurrentUser, type Customer } from '../../utils/supabase'

interface CustomerFormData {
	name: string
	email: string
	phone: string
	address: string
}

interface Filters {
	search: string
	sortBy: 'name' | 'totalPurchases' | 'lastPurchase'
	sortOrder: 'asc' | 'desc'
}

const initialFormData: CustomerFormData = {
	name: '',
	email: '',
	phone: '',
	address: ''
}

export default function Customers() {
	const [customers, setCustomers] = useState<Customer[]>([])
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isDataLoading, setIsDataLoading] = useState(true)
	const [formData, setFormData] = useState<CustomerFormData>(initialFormData)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [filters, setFilters] = useState<Filters>({
		search: '',
		sortBy: 'name',
		sortOrder: 'asc'
	})

	useEffect(() => {
		loadCustomers()
	}, [])

	async function loadCustomers() {
		try {
			const user = await getCurrentUser()
			if (user?.company_id) {
				const data = await getCustomers(user.company_id)
				setCustomers(data)
			}
		} catch (error) {
			console.error('Error loading customers:', error)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		try {
			const user = await getCurrentUser()
			if (!user?.company_id) throw new Error('No company ID found')

			if (editingId) {
				await updateCustomer(editingId, { ...formData, company_id: user.company_id })
			} else {
				await createCustomer({ ...formData, company_id: user.company_id })
			}
			await loadCustomers()
			setIsAddModalOpen(false)
			setFormData(initialFormData)
			setEditingId(null)
		} catch (error) {
			console.error('Error saving customer:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleEdit = (customer: Customer) => {
		setFormData({
			name: customer.name,
			email: customer.email || '',
			phone: customer.phone || '',
			address: customer.address || ''
		})
		setEditingId(customer.id)
		setIsAddModalOpen(true)
	}

	const handleDelete = async (id: number) => {
		if (!confirm('Are you sure you want to delete this customer?')) return
		try {
			await deleteCustomer(id)
			await loadCustomers()
		} catch (error) {
			console.error('Error deleting customer:', error)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-medium text-gray-900">Customers</h2>
				<button
					onClick={() => setIsAddModalOpen(true)}
					className="btn btn-primary"
				>
					Add Customer
				</button>
			</div>

			{/* Desktop Table View */}
			<div className="bg-white shadow rounded-lg p-4 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">Search</label>
						<input
							type="text"
							value={filters.search}
							onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
							placeholder="Search customers..."
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">Sort By</label>
						<select
							value={filters.sortBy}
							onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as any }))}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="name">Name</option>
							<option value="totalPurchases">Total Purchases</option>
							<option value="lastPurchase">Last Purchase</option>
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

			<div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Name
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Contact
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Total Purchases
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Last Purchase
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{customers
							.filter(customer => {
								const searchTerm = filters.search.toLowerCase()
								return customer.name.toLowerCase().includes(searchTerm) ||
									customer.email?.toLowerCase().includes(searchTerm) ||
									customer.phone?.toLowerCase().includes(searchTerm) ||
									false
							})
							.sort((a, b) => {
								const order = filters.sortOrder === 'asc' ? 1 : -1
								switch (filters.sortBy) {
									case 'totalPurchases':
										return ((a.totalPurchases || 0) - (b.totalPurchases || 0)) * order
									case 'lastPurchase':
										return (new Date(a.lastPurchase || 0).getTime() - new Date(b.lastPurchase || 0).getTime()) * order
									default:
										return a.name.localeCompare(b.name) * order
								}
							})
							.map((customer) => (
							<motion.tr
								key={customer.id}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
							>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm font-medium text-gray-900">{customer.name}</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-900">{customer.email}</div>
									<div className="text-sm text-gray-500">{customer.phone}</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-900">₹{customer.totalPurchases?.toFixed(2) ?? '0.00'}</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-500">{customer.lastPurchase}</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<button 
										onClick={() => handleEdit(customer)}
										className="text-blue-600 hover:text-blue-900 mr-4"
									>
										Edit
									</button>
									<button 
										onClick={() => handleDelete(customer.id)}
										className="text-red-600 hover:text-red-900"
									>
										Delete
									</button>
								</td>
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Mobile Card View */}
			<div className="md:hidden space-y-4">
				{customers
					.filter(customer => {
						const searchTerm = filters.search.toLowerCase()
						return customer.name.toLowerCase().includes(searchTerm) ||
							customer.email?.toLowerCase().includes(searchTerm) ||
							customer.phone?.toLowerCase().includes(searchTerm) ||
							false
					})
					.sort((a, b) => {
						const order = filters.sortOrder === 'asc' ? 1 : -1
						switch (filters.sortBy) {
							case 'totalPurchases':
								return ((a.totalPurchases || 0) - (b.totalPurchases || 0)) * order
							case 'lastPurchase':
								return (new Date(a.lastPurchase || 0).getTime() - new Date(b.lastPurchase || 0).getTime()) * order
							default:
								return a.name.localeCompare(b.name) * order
						}
					})
					.map((customer) => (
					<motion.div
						key={customer.id}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="bg-white shadow rounded-lg p-4"
					>
						<div className="mb-3">
							<div className="text-lg font-medium text-gray-900">{customer.name}</div>
							<div className="text-sm text-gray-500 mt-1">
								<div>{customer.email}</div>
								<div>{customer.phone}</div>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-2 text-sm mb-4">
							<div>
								<span className="text-gray-500">Total Purchases:</span>
								<div className="text-gray-900">₹{customer.totalPurchases?.toFixed(2) ?? '0.00'}</div>
							</div>
							<div>
								<span className="text-gray-500">Last Purchase:</span>
								<div className="text-gray-900">{customer.lastPurchase}</div>
							</div>
						</div>
						<div className="flex justify-end space-x-3 border-t pt-3">
							<button 
								onClick={() => handleEdit(customer)}
								className="text-blue-600 hover:text-blue-900"
							>
								Edit
							</button>
							<button 
								onClick={() => handleDelete(customer.id)}
								className="text-red-600 hover:text-red-900"
							>
								Delete
							</button>
						</div>
					</motion.div>
				))}
			</div>

			{/* Add/Edit Customer Modal */}
			{isAddModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
					>
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							{editingId ? 'Edit Customer' : 'Add New Customer'}
						</h3>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Name</label>
								<input
									type="text"
									required
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Email</label>
								<input
									type="email"
									value={formData.email}
									onChange={(e) => setFormData({ ...formData, email: e.target.value })}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Phone</label>
								<input
									type="tel"
									value={formData.phone}
									onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Address</label>
								<textarea
									value={formData.address}
									onChange={(e) => setFormData({ ...formData, address: e.target.value })}
									rows={3}
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