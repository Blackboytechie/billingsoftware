import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


// Types
export interface User {
	id: string  // Keep as string since it's from auth.users
	email: string
	company_id: number
}

export interface Company {
	id: number
	name: string
	address: string
	phone: string
	email: string
	gst_number: string
	gst_rate: number
	enable_discount: boolean
	default_discount_rate: number
	created_at: string
}

export interface Product {
	id: number
	company_id: number
	name: string
	sku: string
	price: number
	stock: number
	category: string
	created_at: string
}

export interface Customer {
	id: number
	company_id: number
	name: string
	email: string
	phone: string
	address: string
	created_at: string
	totalPurchases?: number
	lastPurchase?: string
}

export interface Invoice {
	id: number
	company_id: number
	customer_id: number
	invoice_number: string
	date: string
	total_amount: number
	gst_amount: number
	discount_amount: number
	status: 'paid' | 'pending' | 'overdue'
	created_at: string
	customer?: { name: string }
	items?: Array<InvoiceItem & { product: { name: string } }>
}

export interface InvoiceItem {
	id: number
	invoice_id: number
	product_id: number
	quantity: number
	price: number
	amount: number
	created_at: string
}

// Authentication
export async function signIn(email: string, password: string) {
	try {
		// Sign in user
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		})
		if (error) throw error
		if (!data.user) throw new Error('Failed to sign in')

		// Get company with ID 1
		const { data: company } = await supabase
			.from('companies')
			.select('id, name, email')
			.eq('id', 1)
			.single()

		if (!company) {
			throw new Error('Company not found')
		}

		// Upsert profile
		const { error: profileError } = await supabase
			.from('profiles')
			.upsert({
				id: data.user.id,
				company_id: company.id,
				created_at: new Date().toISOString()
			}, {
				onConflict: 'id'
			})

		if (profileError) {
			throw profileError
		}

		return { ...data, company }
	} catch (error) {
		console.error('SignIn error:', error)
		throw error
	}
}
















export async function signUp(email: string, password: string, companyName: string) {
	// Create user
	const { data: authData, error: authError } = await supabase.auth.signUp({
		email,
		password,
	})
	if (authError) throw authError
	if (!authData.user) throw new Error('Failed to create user')

	// Get session
	const { data: { session }, error: sessionError } = await supabase.auth.getSession()
	if (sessionError) throw sessionError
	if (!session) throw new Error('No session')

	// Create company
	const { data: companyData, error: companyError } = await supabase
		.from('companies')
		.insert({ 
			name: companyName,
			gst_rate: 18.00,
			enable_discount: true,
			default_discount_rate: 5.00,
			created_at: new Date().toISOString()
		})
		.select()
		.single()
	if (companyError) throw companyError

	// Create profile
	const { error: profileError } = await supabase
		.from('profiles')
		.insert({
			id: authData.user.id,
			company_id: companyData.id,
			created_at: new Date().toISOString()
		})
	if (profileError) throw profileError

	return authData
}


export async function signOut() {
	const { error } = await supabase.auth.signOut()
	if (error) throw error
}

export async function getCurrentUser() {
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) return null;

	// Try to get profile
	const { data: profile, error } = await supabase
		.from('profiles')
		.select('company_id')
		.eq('id', user.id)
		.single();

	// If profile doesn't exist, try to create it
	if (error && error.code === 'PGRST116') {
		// Create profile
		const { data: newProfile, error: createError } = await supabase
			.from('profiles')
			.insert({
				id: user.id,
				company_id: 1, // Known company ID
				created_at: new Date().toISOString()
			})
			.select('company_id')
			.single()

		if (!createError && newProfile) {
			return { ...user, company_id: newProfile.company_id }
		}
	} else if (error) {
		console.error("Error fetching user profile:", error)
		return null
	}

	return profile ? { ...user, company_id: profile.company_id } : null
}


// Company Operations
export async function getCompany(id: number) {
	const { data, error } = await supabase
		.from('companies')
		.select('*')
		.eq('id', id)
		.single()
	if (error) throw error
	return data as Company
}

export async function updateCompany(id: number, updates: Partial<Company>) {
	const { data, error } = await supabase
		.from('companies')
		.update(updates)
		.eq('id', id)
		.select()
		.single()
	if (error) throw error
	return data as Company
}

// Product Operations
export async function getProducts(companyId: number) {
	const { data, error } = await supabase
		.from('products')
		.select('*')
		.eq('company_id', companyId)
	if (error) throw error
	return data as Product[]
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at'>) {
	const { data, error } = await supabase
		.from('products')
		.insert(product)
		.select()
		.single()
	if (error) throw error
	return data as Product
}

export async function updateProduct(id: number, updates: Partial<Product>) {
	const { data, error } = await supabase
		.from('products')
		.update(updates)
		.eq('id', id)
		.select()
		.single()
	if (error) throw error
	return data as Product
}

export async function deleteProduct(id: number) {
	const { error } = await supabase
		.from('products')
		.delete()
		.eq('id', id)
	if (error) throw error
}

// Customer Operations
export async function getCustomers(companyId: number) {
	const { data, error } = await supabase
		.from('customers')
		.select('*')
		.eq('company_id', companyId)
	if (error) throw error
	return data as Customer[]
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'created_at'>) {
	const { data, error } = await supabase
		.from('customers')
		.insert(customer)
		.select()
		.single()
	if (error) throw error
	return data as Customer
}

export async function deleteCustomer(id: number) {
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
    if (error) throw error
}

export async function updateCustomer(id: number, updates: Partial<Customer>) {
    const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data as Customer
}


// Invoice Operations
export async function getInvoices(companyId: number) {
	const { data, error } = await supabase
		.from('invoices')
		.select(`
			*,
			customer:customers(name),
			items:invoice_items(
				*,
				product:products(name)
			)
		`)
		.eq('company_id', companyId)
	if (error) throw error
	return data
}

export async function createInvoice(
	invoice: Omit<Invoice, 'id' | 'created_at'>,
	items: Array<Omit<InvoiceItem, 'id' | 'created_at' | 'invoice_id'>>
) {
	const { data: invoiceData, error: invoiceError } = await supabase
		.from('invoices')
		.insert(invoice)
		.select()
		.single()
	if (invoiceError) throw invoiceError

	const itemsWithInvoiceId = items.map(item => ({
		...item,
		invoice_id: invoiceData.id
	}))

	const { error: itemsError } = await supabase
		.from('invoice_items')
		.insert(itemsWithInvoiceId)
	if (itemsError) throw itemsError

	return invoiceData as Invoice
}

export async function deleteInvoice(id: number) {
	// First delete related invoice items due to foreign key constraint
	const { error: itemsError } = await supabase
		.from('invoice_items')
		.delete()
		.eq('invoice_id', id)
	if (itemsError) throw itemsError

	// Then delete the invoice
	const { error } = await supabase
		.from('invoices')
		.delete()
		.eq('id', id)
	if (error) throw error
}

export async function updateInvoice(id: number, updates: Partial<Invoice>) {
	const { data, error } = await supabase
		.from('invoices')
		.update(updates)
		.eq('id', id)
		.select()
		.single()
	if (error) throw error
	return data as Invoice
}