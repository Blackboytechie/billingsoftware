import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/auth/Login'
import Products from './pages/inventory/Products'

import Invoices from './pages/billing/Invoices'
import Customers from './pages/customers/Customers'
import Reports from './pages/reports/Reports'
import Settings from './pages/settings/Settings'

function App() {
	return (
		<Routes>
			<Route path="/login" element={<Login />} />
			<Route

				path="/"
				element={
					<ProtectedRoute>
						<Layout />
					</ProtectedRoute>
				}
			>
				<Route index element={<Dashboard />} />
				<Route path="products" element={<Products />} />
				<Route path="invoices" element={<Invoices />} />
				<Route path="customers" element={<Customers />} />
				<Route path="reports" element={<Reports />} />
				<Route path="settings" element={<Settings />} />
			</Route>
		</Routes>
	)
}

export default App