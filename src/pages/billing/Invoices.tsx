import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'
import { getInvoices, createInvoice, deleteInvoice, getCustomers, getProducts, getCurrentUser, type Invoice, type Customer, type Product } from '../../utils/supabase'

interface InvoiceFormData {
	customer_id: number | ''  // Allow empty string for initial state
	date: string
	items: Array<{
		product_id: number | ''  // Allow empty string for initial state
		quantity: number
		price: number
	}>
	status: 'paid' | 'pending' | 'overdue'
}

const initialFormData: InvoiceFormData = {
	customer_id: '',
	date: new Date().toISOString().split('T')[0],
	items: [],
	status: 'pending'
}

const statusColors = {
	paid: 'bg-green-100 text-green-800',
	pending: 'bg-yellow-100 text-yellow-800',
	overdue: 'bg-red-100 text-red-800'
}

export default function Invoices() {
	const [invoices, setInvoices] = useState<Invoice[]>([])
	const [customers, setCustomers] = useState<Customer[]>([])
	const [products, setProducts] = useState<Product[]>([])
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isDataLoading, setIsDataLoading] = useState(true)
	const [formData, setFormData] = useState<InvoiceFormData>(initialFormData)
	const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)

	useEffect(() => {
		loadData()
	}, [])

	async function loadData() {
		setIsDataLoading(true)
		try {
			const user = await getCurrentUser()
			if (user?.company_id) {
				const [invoicesData, customersData, productsData] = await Promise.all([
					getInvoices(user.company_id),
					getCustomers(user.company_id),
					getProducts(user.company_id)
				])
				setInvoices(invoicesData)
				setCustomers(customersData)
				setProducts(productsData)
			}
		} catch (error) {
			console.error('Error loading data:', error)
		} finally {
			setIsDataLoading(false)
		}
	}

	const handleAddItem = () => {
		setFormData({
			...formData,
			items: [
				...formData.items,
				{ product_id: '', quantity: 1, price: 0 }
			]
		})
	}

	const handleRemoveItem = (index: number) => {
		setFormData({
			...formData,
			items: formData.items.filter((_, i) => i !== index)
		})
	}

	const handleItemChange = (index: number, field: string, value: any) => {
		const newItems = [...formData.items]
		if (field === 'product_id') {
			const numValue = value === '' ? '' : Number(value)
			newItems[index] = { ...newItems[index], [field]: numValue }
			const product = products.find(p => p.id === numValue)
			if (product) {
				newItems[index].price = product.price
			}
		} else {
			newItems[index] = { ...newItems[index], [field]: value }
		}
		setFormData({ ...formData, items: newItems })
	}

	const calculateTotals = () => {
		const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
		const gst = subtotal * 0.18 // 18% GST
		const total = subtotal + gst
		return { subtotal, gst, total }
	}

	const handleView = (invoice: Invoice) => {
		setViewInvoice(invoice)
	}

	const handlePrint = (invoice: Invoice) => {
		const doc = new jsPDF()
		const lineHeight = 10
		let y = 20

		// Header
		doc.setFontSize(20)
		doc.text('Invoice', 105, y, { align: 'center' })
		y += lineHeight * 2

		// Invoice details
		doc.setFontSize(12)
		doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, y)
		y += lineHeight
		doc.text(`Date: ${invoice.date}`, 20, y)
		y += lineHeight
		doc.text(`Customer: ${invoice.customer?.name}`, 20, y)
		y += lineHeight * 2

		// Items header
		doc.setFillColor(240, 240, 240)
		doc.rect(20, y, 170, 10, 'F')
		doc.text('Item', 25, y + 7)
		doc.text('Qty', 100, y + 7)
		doc.text('Price', 130, y + 7)
		doc.text('Amount', 160, y + 7)
		y += lineHeight

		// Items
		invoice.items?.forEach((item: any) => {
			y += lineHeight
			doc.text(item.product?.name || '', 25, y)
			doc.text(item.quantity.toString(), 100, y)
			doc.text(`₹${item.price.toFixed(2)}`, 130, y)
			doc.text(`₹${item.amount.toFixed(2)}`, 160, y)
		})

		y += lineHeight * 2

		// Totals
		const subtotal = invoice.total_amount - invoice.gst_amount
		doc.text('Subtotal:', 130, y)
		doc.text(`₹${subtotal.toFixed(2)}`, 160, y)
		y += lineHeight
		doc.text('GST:', 130, y)
		doc.text(`₹${invoice.gst_amount.toFixed(2)}`, 160, y)
		y += lineHeight
		doc.setFont('helvetica', 'bold')
		doc.text('Total:', 130, y)
		doc.text(`₹${invoice.total_amount.toFixed(2)}`, 160, y)

		// Save the PDF
		doc.save(`invoice-${invoice.invoice_number}.pdf`)
	}

	const handleDelete = async (id: number) => {
		if (!confirm('Are you sure you want to delete this invoice?')) return
		try {
			await deleteInvoice(id)
			await loadData()
		} catch (error) {
			console.error('Error deleting invoice:', error)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		try {
			const user = await getCurrentUser()
			if (!user?.company_id) throw new Error('No company ID found')

			const { total, gst } = calculateTotals()
			const invoiceNumber = `INV${Date.now()}`

			if (formData.customer_id === '') throw new Error('Please select a customer')

			await createInvoice(
				{
					company_id: user.company_id,
					customer_id: Number(formData.customer_id),
					invoice_number: invoiceNumber,
					date: formData.date,
					total_amount: total,
					gst_amount: gst,
					discount_amount: 0,
					status: formData.status
				},
				formData.items.map(item => {
					if (item.product_id === '') throw new Error('Please select a product for all items')
					return {
						product_id: Number(item.product_id),
						quantity: item.quantity,
						price: item.price,
						amount: item.price * item.quantity
					}
				})
			)

			await loadData()
			setIsAddModalOpen(false)
			setFormData(initialFormData)
		} catch (error) {
			console.error('Error creating invoice:', error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-medium text-gray-900">Invoices</h2>
				<button 
					className="btn btn-primary"
					onClick={() => setIsAddModalOpen(true)}
				>
					Create Invoice
				</button>
			</div>

			{/* Desktop Table View */}
			<div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Invoice #
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Customer
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Date
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Amount
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{isDataLoading ? (
							<tr>
								<td colSpan={6} className="px-6 py-4 text-center text-gray-500">
									Loading invoices...
								</td>
							</tr>
						) : invoices.length === 0 ? (
							<tr>
								<td colSpan={6} className="px-6 py-4 text-center text-gray-500">
									No invoices found. Click "Create Invoice" to create one.
								</td>
							</tr>
						) : (
							invoices.map((invoice) => (
								<motion.tr
									key={invoice.id}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
								>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-900">{invoice.customer?.name}</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-500">{invoice.date}</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-900">₹{invoice.total_amount.toFixed(2)}</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[invoice.status]}`}>
											{invoice.status}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<button 
											onClick={() => handleView(invoice)}
											className="text-blue-600 hover:text-blue-900 mr-4"
										>
											View
										</button>
										<button 
											onClick={() => handlePrint(invoice)}
											className="text-blue-600 hover:text-blue-900 mr-4"
										>
											Print
										</button>
										<button 
											onClick={() => handleDelete(invoice.id)}
											className="text-red-600 hover:text-red-900"
										>
											Delete
										</button>
									</td>
								</motion.tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Mobile Card View */}
			<div className="md:hidden space-y-4">
				{isDataLoading ? (
					<div className="bg-white shadow rounded-lg p-4 text-center text-gray-500">
						Loading invoices...
					</div>
				) : invoices.length === 0 ? (
					<div className="bg-white shadow rounded-lg p-4 text-center text-gray-500">
						No invoices found. Click "Create Invoice" to create one.
					</div>
				) : (
					invoices.map((invoice) => (
						<motion.div
						key={invoice.id}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="bg-white shadow rounded-lg p-4"
					>
						<div className="flex justify-between items-start mb-3">
							<div>
								<div className="text-lg font-medium text-gray-900">{invoice.invoice_number}</div>
								<div className="text-sm text-gray-500 mt-1">{invoice.customer?.name}</div>
							</div>
							<span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[invoice.status]}`}>
								{invoice.status}
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2 text-sm mb-4">
							<div>
								<span className="text-gray-500">Date:</span>
								<span className="ml-2 text-gray-900">{invoice.date}</span>
							</div>
							<div>
								<span className="text-gray-500">Amount:</span>
								<span className="ml-2 text-gray-900">₹{invoice.total_amount.toFixed(2)}</span>
							</div>
						</div>
						<div className="flex justify-end space-x-3 border-t pt-3">
							<button 
								onClick={() => handleView(invoice)}
								className="text-blue-600 hover:text-blue-900"
							>
								View
							</button>
							<button 
								onClick={() => handlePrint(invoice)}
								className="text-blue-600 hover:text-blue-900"
							>
								Print
							</button>
							<button 
								onClick={() => handleDelete(invoice.id)}
								className="text-red-600 hover:text-red-900"
							>
								Delete
							</button>
						</div>
					</motion.div>
				))
			)}
			</div>

			{/* Add Invoice Modal */}
			{isAddModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"
					>
						<h3 className="text-lg font-medium text-gray-900 mb-4">Create New Invoice</h3>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700">Customer</label>
									<select
										required
										value={formData.customer_id}
										onChange={(e) => setFormData({ ...formData, customer_id: e.target.value === '' ? '' : Number(e.target.value) })}
										className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									>
										<option value="">Select Customer</option>
										{customers.map(customer => (
											<option key={customer.id} value={customer.id}>
												{customer.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Date</label>
									<input
										type="date"
										required
										value={formData.date}
										onChange={(e) => setFormData({ ...formData, date: e.target.value })}
										className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<h4 className="text-sm font-medium text-gray-900">Items</h4>
									<button
										type="button"
										onClick={handleAddItem}
										className="text-sm text-blue-600 hover:text-blue-500"
									>
										Add Item
									</button>
								</div>
								{formData.items.map((item, index) => (
									<div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-2">
										<div className="col-span-5">
											<label className="block text-sm font-medium text-gray-700">Product</label>
											<select
												required
												value={item.product_id}
												onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
												className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
											>
												<option value="">Select Product</option>
												{products.map(product => (
													<option key={product.id} value={product.id}>
														{product.name} - ₹{product.price}
													</option>
												))}
											</select>
										</div>
										<div className="col-span-2">
											<label className="block text-sm font-medium text-gray-700">Quantity</label>
											<input
												type="number"
												required
												min="1"
												value={item.quantity}
												onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
												className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
											/>
										</div>
										<div className="col-span-3">
											<label className="block text-sm font-medium text-gray-700">Price</label>
											<input
												type="number"
												required
												value={item.price}
												onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
												className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
											/>
										</div>
										<div className="col-span-2">
											<button
												type="button"
												onClick={() => handleRemoveItem(index)}
												className="text-red-600 hover:text-red-500"
											>
												Remove
											</button>
										</div>
									</div>
								))}
							</div>

							<div className="border-t pt-4">
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Subtotal:</span>
										<span>₹{calculateTotals().subtotal.toFixed(2)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>GST (18%):</span>
										<span>₹{calculateTotals().gst.toFixed(2)}</span>
									</div>
									<div className="flex justify-between font-medium">
										<span>Total:</span>
										<span>₹{calculateTotals().total.toFixed(2)}</span>
									</div>
								</div>
							</div>

							<div className="flex justify-end space-x-3 pt-4">
								<button
									type="button"
									onClick={() => {
										setIsAddModalOpen(false)
										setFormData(initialFormData)
									}}
									className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isLoading || formData.items.length === 0}
									className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
								>
									{isLoading ? 'Creating...' : 'Create Invoice'}
								</button>
							</div>
						</form>
					</motion.div>
				</div>
			)}

			{/* View Invoice Modal */}
			{viewInvoice && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
					>
						<div className="flex justify-between items-start mb-4">
							<div>
								<h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
								<p className="text-sm text-gray-500">{viewInvoice.invoice_number}</p>
							</div>
							<button
								onClick={() => setViewInvoice(null)}
								className="text-gray-400 hover:text-gray-500"
							>
								✕
							</button>
						</div>
						
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<h4 className="text-sm font-medium text-gray-500">Customer</h4>
									<p className="text-sm text-gray-900">{viewInvoice.customer?.name}</p>
								</div>
								<div>
									<h4 className="text-sm font-medium text-gray-500">Date</h4>
									<p className="text-sm text-gray-900">{viewInvoice.date}</p>
								</div>
							</div>

							<div>
								<h4 className="text-sm font-medium text-gray-500 mb-2">Items</h4>
								<div className="border rounded-md divide-y">
									{viewInvoice.items?.map((item: any) => (
										<div key={item.id} className="p-3">
											<div className="flex justify-between">
												<span className="text-sm font-medium">{item.product?.name}</span>
												<span className="text-sm">₹{item.amount.toFixed(2)}</span>
											</div>
											<div className="text-sm text-gray-500">
												{item.quantity} × ₹{item.price.toFixed(2)}
											</div>
										</div>
									))}
								</div>
							</div>

							<div className="border-t pt-4">
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Subtotal:</span>
										<span>₹{(viewInvoice.total_amount - viewInvoice.gst_amount).toFixed(2)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>GST:</span>
										<span>₹{viewInvoice.gst_amount.toFixed(2)}</span>
									</div>
									<div className="flex justify-between font-medium">
										<span>Total:</span>
										<span>₹{viewInvoice.total_amount.toFixed(2)}</span>
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			)}
		</div>
	)
}