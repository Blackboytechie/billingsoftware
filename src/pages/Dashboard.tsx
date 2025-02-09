import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../utils/supabase'
import { getCurrentUser } from '../utils/supabase'

interface RecentActivity {
	type: 'invoice' | 'product' | 'customer'
	action: string
	details: string
	date: string
}

interface DashboardStats {
	totalSales: number
	productsCount: number
	customersCount: number
	pendingPayments: number
}

export default function Dashboard() {
	const [stats, setStats] = useState<DashboardStats>({
		totalSales: 0,
		productsCount: 0,
		customersCount: 0,
		pendingPayments: 0
	})
	const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchStats()
		fetchRecentActivity()
	}, [])

	async function fetchRecentActivity() {
		try {
			const user = await getCurrentUser()
			if (!user?.company_id) return

			const [invoices, products, customers] = await Promise.all([
				supabase.from('invoices')
					.select('invoice_number, total_amount, created_at')
					.eq('company_id', user.company_id)
					.order('created_at', { ascending: false })
					.limit(5),
				supabase.from('products')
					.select('name, created_at')
					.eq('company_id', user.company_id)
					.order('created_at', { ascending: false })
					.limit(5),
				supabase.from('customers')
					.select('name, created_at')
					.eq('company_id', user.company_id)
					.order('created_at', { ascending: false })
					.limit(5)
			])

			const activity: RecentActivity[] = [
				...(invoices.data?.map(inv => ({
					type: 'invoice' as const,
					action: 'Created invoice',
					details: `${inv.invoice_number} - ₹${inv.total_amount}`,
					date: new Date(inv.created_at).toLocaleDateString()
				})) || []),
				...(products.data?.map(prod => ({
					type: 'product' as const,
					action: 'Added product',
					details: prod.name,
					date: new Date(prod.created_at).toLocaleDateString()
				})) || []),
				...(customers.data?.map(cust => ({
					type: 'customer' as const,
					action: 'Added customer',
					details: cust.name,
					date: new Date(cust.created_at).toLocaleDateString()
				})) || [])
			].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
				.slice(0, 5)

			setRecentActivity(activity)
		} catch (error) {
			console.error('Error fetching recent activity:', error)
		}
	}

	async function fetchStats() {
		try {
			const user = await getCurrentUser()
			if (!user?.company_id) return

			const [products, customers, invoices] = await Promise.all([
				supabase.from('products').select('id').eq('company_id', user.company_id),
				supabase.from('customers').select('id').eq('company_id', user.company_id),
				supabase.from('invoices').select('total_amount, status').eq('company_id', user.company_id)
			])

			const totalSales = invoices.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
			const pendingPayments = invoices.data?.reduce((sum, inv) => 
				inv.status === 'pending' ? sum + (inv.total_amount || 0) : sum, 0) || 0

			setStats({
				totalSales,
				productsCount: products.data?.length || 0,
				customersCount: customers.data?.length || 0,
				pendingPayments
			})
		} catch (error) {
			console.error('Error fetching stats:', error)
		} finally {
			setLoading(false)
		}
	}

	const displayStats = [
		{ name: 'Total Sales', value: `₹${stats.totalSales.toLocaleString()}`, icon: '💰' },
		{ name: 'Products', value: stats.productsCount.toString(), icon: '📦' },
		{ name: 'Customers', value: stats.customersCount.toString(), icon: '👥' },
		{ name: 'Pending Payments', value: `₹${stats.pendingPayments.toLocaleString()}`, icon: '⏳' }
	]

	if (loading) {
		return <div className="flex justify-center items-center h-64">
			<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
		</div>
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{displayStats.map((stat, index) => (
					<motion.div
						key={stat.name}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className="bg-white overflow-hidden shadow rounded-lg"
					>
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<span className="text-2xl">{stat.icon}</span>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											{stat.name}
										</dt>
										<dd className="flex items-baseline">
											<div className="text-2xl font-semibold text-gray-900">
												{stat.value}
											</div>
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</motion.div>
				))}
			</div>

			{/* Recent Activity */}
			<div className="bg-white shadow rounded-lg">
				<div className="px-4 py-5 sm:p-6">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						Recent Activity
					</h3>
					<div className="mt-5">
						{recentActivity.length > 0 ? (
							<div className="flow-root">
								<ul className="-mb-8">
									{recentActivity.map((activity, index) => (
										<li key={index}>
											<div className="relative pb-8">
												{index !== recentActivity.length - 1 && (
													<span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
												)}
												<div className="relative flex space-x-3">
													<div>
														<span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-blue-500">
															{activity.type === 'invoice' && '💰'}
															{activity.type === 'product' && '📦'}
															{activity.type === 'customer' && '👥'}
														</span>
													</div>
													<div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
														<div>
															<p className="text-sm text-gray-500">
																{activity.action} <span className="font-medium text-gray-900">{activity.details}</span>
															</p>
														</div>
														<div className="text-right text-sm whitespace-nowrap text-gray-500">
															{activity.date}
														</div>
													</div>
												</div>
											</div>
										</li>
									))}
								</ul>
							</div>
						) : (
							<p className="text-gray-500">No recent activity</p>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}