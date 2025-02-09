import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentUser } from '../utils/supabase'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const [loading, setLoading] = useState(true)
	const [user, setUser] = useState<any>(null)
	const location = useLocation()

	useEffect(() => {
		checkUser()
	}, [])

	async function checkUser() {
		try {
			const user = await getCurrentUser()
			setUser(user)
		} catch (error) {
			setUser(null)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		)
	}

	if (!user) {
		return <Navigate to="/login" state={{ from: location }} replace />
	}

	return <>{children}</>
}