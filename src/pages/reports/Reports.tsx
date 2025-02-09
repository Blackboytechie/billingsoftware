import { useState } from 'react'
import { motion } from 'framer-motion'

interface SalesData {
	period: string
	revenue: number
	orders: number
	gst: number
}

const sampleData: SalesData[] = [
	{ period: 'Jan 2024', revenue: 45231.50, orders: 28, gst: 8141.67 },
	{ period: 'Feb 2024', revenue: 52145.75, orders: 34, gst: 9386.24 },
	{ period: 'Mar 2024', revenue: 38756.25, orders: 22, gst: 6976.13 }
]

export default function Reports() {
	const [salesData] = useState<SalesData[]>(sampleData)
	const [selectedPeriod, setSelectedPeriod] = useState('monthly')

	return (
		<div className="space-y-6">
			{/* Mobile-friendly header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
				<h2 className="text-lg font-medium text-gray-900">Reports</h2>
				<div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
					<select
						value={selectedPeriod}
						onChange={(e) => setSelectedPeriod(e.target.value)}
						className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 w-full sm:w-auto"
					>
						<option value="daily">Daily</option>
						<option value="monthly">Monthly</option>
						<option value="yearly">Yearly</option>
					</select>
					<button className="btn btn-primary w-full sm:w-auto">
						Download Report
					</button>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-white overflow-hidden shadow rounded-lg"
				>
					<div className="p-5">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<span className="text-2xl">💰</span>
							</div>
							<div className="ml-5 w-0 flex-1">
								<dl>
									<dt className="text-sm font-medium text-gray-500 truncate">
										Total Revenue
									</dt>
									<dd className="text-2xl font-semibold text-gray-900">
										₹{salesData.reduce((acc, curr) => acc + curr.revenue, 0).toFixed(2)}
									</dd>
								</dl>
							</div>
						</div>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-white overflow-hidden shadow rounded-lg"
				>
					<div className="p-5">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<span className="text-2xl">📦</span>
							</div>
							<div className="ml-5 w-0 flex-1">
								<dl>
									<dt className="text-sm font-medium text-gray-500 truncate">
										Total Orders
									</dt>
									<dd className="text-2xl font-semibold text-gray-900">
										{salesData.reduce((acc, curr) => acc + curr.orders, 0)}
									</dd>
								</dl>
							</div>
						</div>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-white overflow-hidden shadow rounded-lg"
				>
					<div className="p-5">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<span className="text-2xl">📊</span>
							</div>
							<div className="ml-5 w-0 flex-1">
								<dl>
									<dt className="text-sm font-medium text-gray-500 truncate">
										Total GST
									</dt>
									<dd className="text-2xl font-semibold text-gray-900">
										₹{salesData.reduce((acc, curr) => acc + curr.gst, 0).toFixed(2)}
									</dd>
								</dl>
							</div>
						</div>
					</div>
				</motion.div>
			</div>

			{/* Desktop Sales Data Table */}
			<div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Period
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Revenue
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Orders
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								GST
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{salesData.map((data, index) => (
							<motion.tr
								key={data.period}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: index * 0.1 }}
							>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm font-medium text-gray-900">{data.period}</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-900">₹{data.revenue.toFixed(2)}</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-900">{data.orders}</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-900">₹{data.gst.toFixed(2)}</div>
								</td>
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Mobile Sales Data Cards */}
			<div className="md:hidden space-y-4">
				{salesData.map((data, index) => (
					<motion.div
						key={data.period}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: index * 0.1 }}
						className="bg-white shadow rounded-lg p-4"
					>
						<div className="text-lg font-medium text-gray-900 mb-3">{data.period}</div>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<div className="text-gray-500">Revenue</div>
								<div className="text-gray-900 font-medium">₹{data.revenue.toFixed(2)}</div>
							</div>
							<div>
								<div className="text-gray-500">Orders</div>
								<div className="text-gray-900 font-medium">{data.orders}</div>
							</div>
							<div className="col-span-2">
								<div className="text-gray-500">GST</div>
								<div className="text-gray-900 font-medium">₹{data.gst.toFixed(2)}</div>
							</div>
						</div>
					</motion.div>
				))}
			</div>
		</div>
	)
}