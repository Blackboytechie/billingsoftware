import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getCurrentUser, getCompany, updateCompany, type Company } from '../../utils/supabase'

interface CompanyDetails {
	name: string
	address: string
	phone: string
	email: string
	gst: string
}

interface TaxSettings {
	gstRate: number
	enableDiscount: boolean
	defaultDiscountRate: number
}

export default function Settings() {
	const [originalDiscountRate, setOriginalDiscountRate] = useState(5)
	const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
		name: '',
		address: '',
		phone: '',
		email: '',
		gst: ''
	})

	const [taxSettings, setTaxSettings] = useState<TaxSettings>({
		gstRate: 18,
		enableDiscount: true,
		defaultDiscountRate: 5
	})

	useEffect(() => {
		loadCompanyDetails()
	}, [])

	const loadCompanyDetails = async () => {
		try {
			const user = await getCurrentUser()
			if (user?.company_id) {
				const company = await getCompany(user.company_id)
				setCompanyDetails({
					name: company.name || '',
					address: company.address || '',
					phone: company.phone || '',
					email: company.email || '',
					gst: company.gst_number || ''
				})
				setTaxSettings({
					gstRate: company.gst_rate,
					enableDiscount: company.enable_discount,
					defaultDiscountRate: company.default_discount_rate
				})
				setOriginalDiscountRate(company.default_discount_rate)
			}
		} catch (error) {
			console.error('Error loading company details:', error)
		}
	}

	const handleCompanyUpdate = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			const user = await getCurrentUser()
			if (!user?.company_id) throw new Error('No company ID found')

			await updateCompany(user.company_id, {
				name: companyDetails.name,
				address: companyDetails.address,
				phone: companyDetails.phone,
				email: companyDetails.email,
				gst_number: companyDetails.gst
			})
			alert('Company details updated successfully')
		} catch (error) {
			console.error('Error updating company details:', error)
			alert('Failed to update company details')
		}
	}

	const handleTaxUpdate = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			const user = await getCurrentUser()
			if (!user?.company_id) throw new Error('No company ID found')

			await updateCompany(user.company_id, {
				gst_rate: taxSettings.gstRate,
				enable_discount: taxSettings.enableDiscount,
				default_discount_rate: taxSettings.defaultDiscountRate
			})
			alert('Tax settings updated successfully')
		} catch (error) {
			console.error('Error updating tax settings:', error)
			alert('Failed to update tax settings')
		}
	}

	return (
		<div className="space-y-6 max-w-full">
			<h2 className="text-lg font-medium text-gray-900 px-1">Settings</h2>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Company Details */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-white shadow-sm rounded-lg p-4 sm:p-6"
				>
					<h3 className="text-lg font-medium text-gray-900 mb-4">Company Details</h3>
					<form onSubmit={handleCompanyUpdate} className="space-y-4">
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">Company Name</label>
							<input
								type="text"
								value={companyDetails.name}
								onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">Address</label>
							<textarea
								value={companyDetails.address}
								onChange={(e) => setCompanyDetails({ ...companyDetails, address: e.target.value })}
								rows={3}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">Phone</label>
							<input
								type="tel"
								value={companyDetails.phone}
								onChange={(e) => setCompanyDetails({ ...companyDetails, phone: e.target.value })}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">Email</label>
							<input
								type="email"
								value={companyDetails.email}
								onChange={(e) => setCompanyDetails({ ...companyDetails, email: e.target.value })}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">GST Number</label>
							<input
								type="text"
								value={companyDetails.gst}
								onChange={(e) => setCompanyDetails({ ...companyDetails, gst: e.target.value })}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
							/>
						</div>
						<button type="submit" className="w-full sm:w-auto btn btn-primary">
							Save Company Details
						</button>
					</form>
				</motion.div>

				{/* Tax Settings */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-white shadow-sm rounded-lg p-4 sm:p-6"
				>
					<h3 className="text-lg font-medium text-gray-900 mb-4">Tax Settings</h3>
					<form onSubmit={handleTaxUpdate} className="space-y-4">
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">GST Rate (%)</label>
							<input
								type="number"
								value={taxSettings.gstRate}
								onChange={(e) => setTaxSettings({ ...taxSettings, gstRate: Number(e.target.value) })}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
							/>
						</div>
						<div className="flex items-center py-2">
							<input
								type="checkbox"
								checked={taxSettings.enableDiscount}
								onChange={(e) => setTaxSettings({
									...taxSettings,
									enableDiscount: e.target.checked,
									defaultDiscountRate: e.target.checked ? originalDiscountRate : 0
								})}
								className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<label className="ml-3 block text-sm text-gray-900">Enable Discount</label>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">Default Discount Rate (%)</label>
							<input
								type="number"
								value={taxSettings.defaultDiscountRate}
								onChange={(e) => setTaxSettings({ ...taxSettings, defaultDiscountRate: Number(e.target.value) })}
								disabled={!taxSettings.enableDiscount}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
						</div>

						<button type="submit" className="w-full sm:w-auto btn btn-primary">
							Save Tax Settings
						</button>
					</form>
				</motion.div>
			</div>
		</div>
	)
}