import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { signOut, getCurrentUser, getCompany, type Company } from '../utils/supabase'

const navItems = [
	{ path: '/', label: 'Dashboard', icon: '📊' },
	{ path: '/products', label: 'Products', icon: '📦' },
	{ path: '/invoices', label: 'Invoices', icon: '📝' },
	{ path: '/customers', label: 'Customers', icon: '👥' },
	{ path: '/reports', label: 'Reports', icon: '📈' },
	{ path: '/settings', label: 'Settings', icon: '⚙️' }
]

export default function Layout() {
	const location = useLocation()
	const navigate = useNavigate()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [company, setCompany] = useState<Company | null>(null)

	useEffect(() => {
		loadCompanyData()
	}, [])

	async function loadCompanyData() {
		try {
			const user = await getCurrentUser()
			if (user?.company_id) {
				const companyData = await getCompany(user.company_id)
				setCompany(companyData)
			}
		} catch (error) {
			console.error('Error loading company data:', error)
		}
	}

	const handleSignOut = async () => {
		try {
			await signOut()
			navigate('/login')
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}


	return (
		<div className="flex h-screen bg-gray-100">
			{/* Mobile menu button */}
			<button
				onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
				className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-white shadow-lg"
			>
				{isMobileMenuOpen ? '✕' : '☰'}
			</button>

			{/* Sidebar */}
			<nav className={`
				fixed lg:static w-64 bg-white shadow-lg h-full z-10
				transform transition-transform duration-200 ease-in-out
				${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
			`}>
				<div className="p-4">
					<h1 className="text-2xl font-bold text-blue-600">BillMaster</h1>
					{company && (
						<p className="mt-2 text-sm text-gray-600">{company.name}</p>
					)}
				</div>
				<div className="space-y-1">
					{navItems.map((item) => (
						<Link
							key={item.path}
							to={item.path}
							onClick={() => setIsMobileMenuOpen(false)}
							className={`flex items-center px-4 py-3 text-gray-700 relative ${
								location.pathname === item.path ? 'text-blue-600' : ''
							}`}
						>
							{location.pathname === item.path && (
								<motion.div
									layoutId="active"
									className="absolute left-0 w-1 h-full bg-blue-600"
								/>
							)}
							<span className="mr-3">{item.icon}</span>
							{item.label}
						</Link>
					))}
					<button
						onClick={handleSignOut}
						className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
					>
						<span className="mr-3">🚪</span>
						Sign Out
					</button>
				</div>
			</nav>

			{/* Main Content */}
			<main className="flex-1 overflow-auto lg:ml-0">
				<header className="bg-white shadow-sm">
					<div className="px-6 py-4 ml-12 lg:ml-0">
						<h2 className="text-xl font-semibold text-gray-800">
							{navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
						</h2>
					</div>
				</header>
				<div className="p-6">
					<Outlet />
				</div>
			</main>

			{/* Mobile overlay */}
			{isMobileMenuOpen && (
				<div 
					className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
					onClick={() => setIsMobileMenuOpen(false)}
				/>
			)}
		</div>
	)
}