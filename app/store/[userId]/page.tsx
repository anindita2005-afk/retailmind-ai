"use client"

import { useState, useEffect, use } from "react"
import { ShoppingCart, Plus, Minus, Search, Store, X, CheckCircle2, ChevronDown, Package, User, MapPin, Phone, Mail } from "lucide-react"

interface Product {
    id: string
    name: string
    category: string | null
    price: number
    unit: string
    image_url?: string
}

interface CartItem extends Product {
    quantity: number
}

export default function StoreFront({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = use(params)
    const [profile, setProfile] = useState<any>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [search, setSearch] = useState("")
    const [activeCategory, setActiveCategory] = useState("All")

    const [cart, setCart] = useState<CartItem[]>([])
    const [showCart, setShowCart] = useState(false)

    // Checkout form
    const [customerName, setCustomerName] = useState("")
    const [phone, setPhone] = useState("")
    const [customerEmail, setCustomerEmail] = useState("")
    const [address, setAddress] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [orderId, setOrderId] = useState<string | null>(null)

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/store/${userId}/products`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error)
                setProfile(data.profile)
                setProducts(data.products)
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [userId])

    const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))] as string[]

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
        const matchesCat = activeCategory === "All" || p.category === activeCategory
        return matchesSearch && matchesCat
    })

    // Cart operations
    const updateQuantity = (product: Product, delta: number) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                const newQty = existing.quantity + delta
                if (newQty <= 0) return prev.filter(item => item.id !== product.id)
                return prev.map(item => item.id === product.id ? { ...item, quantity: newQty } : item)
            }
            if (delta > 0) return [...prev, { ...product, quantity: delta }]
            return prev
        })
    }

    const getQty = (id: string) => cart.find(i => i.id === id)?.quantity || 0
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    // Submit Order
    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!customerName || !phone || !customerEmail || cart.length === 0) return

        setSubmitting(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/store/${userId}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName, phone, email: customerEmail, address, cart, totalAmount: cartTotal
                })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setOrderId(data.orderId)
            setCart([])
        } catch (err: any) {
            alert(err.message || "Failed to place order")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-[#060B09] flex flex-col items-center justify-center text-white">
            <Store className="w-12 h-12 text-[#00E58F] mb-4 animate-pulse" />
            <p className="text-[#94A39D] font-medium">Loading store...</p>
        </div>
    )

    if (error) return (
        <div className="min-h-screen bg-[#060B09] flex items-center justify-center text-[#FF4D4D]">
            {error}
        </div>
    )

    if (orderId) return (
        <div className="min-h-screen bg-[#060B09] flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-[#0A110F] border border-[#1A2623] rounded-3xl p-10 max-w-md w-full shadow-2xl">
                <div className="w-20 h-20 bg-[#00E58F]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-[#00E58F]" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h1>
                <p className="text-[#94A39D] text-sm mb-6">Your order has been sent to {profile?.business_name}.</p>
                <p className="text-xs text-[#5B6B66] font-mono bg-[#131B19] p-3 rounded-xl break-all">Order ID: {orderId}</p>
                <button onClick={() => setOrderId(null)} className="mt-8 w-full py-3 rounded-xl bg-[#0A110F] border border-[#1A2623] text-white font-bold hover:bg-[#131B19] transition-colors">
                    Continue Shopping
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#060B09] text-white flex flex-col font-sans">
            {/* ── Header ── */}
            <header className="sticky top-0 z-40 bg-[#0A110F]/90 backdrop-blur-xl border-b border-[#1A2623] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#00E58F] to-[#00a86b] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,229,143,0.3)] overflow-hidden border border-[#00E58F]/20">
                        {profile?.logo_url ? (
                            <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <Store className="w-6 h-6 text-[#0A0A0A]" />
                        )}
                    </div>
                    <div>
                        <h1 className="font-extrabold text-xl leading-tight text-white mb-0.5">{profile?.business_name || "Store"}</h1>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-[#00E58F] font-bold tracking-widest uppercase">{profile?.business_category || "Retail"}</p>
                            {(profile?.phone || profile?.email) && <span className="text-[#5B6B66] text-[10px]">•</span>}
                            {profile?.phone && <span className="text-xs text-[#94A39D]">{profile.phone}</span>}
                        </div>
                    </div>
                </div>
                <button onClick={() => setShowCart(true)} className="relative p-2.5 bg-[#1A2623] hover:bg-[#5B6B66]/20 transition-colors rounded-full">
                    <ShoppingCart className="w-5 h-5 text-white" />
                    {cartItemsCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-[#00E58F] text-[#0A0A0A] text-[10px] font-bold rounded-full border-2 border-[#0A110F]">
                            {cartItemsCount}
                        </span>
                    )}
                </button>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col gap-8 md:flex-row items-start relative pb-24">

                {/* ── Catalog Section ── */}
                <div className="flex-1 w-full">
                    {/* Search & Categories */}
                    <div className="mb-8 space-y-4">
                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6B66]" />
                            <input
                                placeholder="Search products..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full bg-[#0A110F] border border-[#1A2623] rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none focus:border-[#00E58F]/50 transition-colors shadow-inner"
                            />
                        </div>
                        {categories.length > 1 && (
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {categories.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setActiveCategory(c)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${activeCategory === c ? 'bg-[#00E58F] text-[#0A0A0A]' : 'bg-[#0A110F] border border-[#1A2623] text-[#94A39D] hover:bg-[#131B19]'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {filteredProducts.map(p => {
                            const qty = getQty(p.id)
                            return (
                                <div key={p.id} className="bg-[#0A110F] border border-[#1A2623] rounded-2xl overflow-hidden hover:border-[#00E58F]/30 transition-all group flex flex-col">
                                    {p.image_url ? (
                                        <div className="aspect-square bg-[#060B09] relative overflow-hidden">
                                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    ) : (
                                        <div className="aspect-square bg-[#131B19] flex items-center justify-center">
                                            <Package className="w-10 h-10 text-[#5B6B66]/30" />
                                        </div>
                                    )}
                                    <div className="p-4 flex flex-col flex-1">
                                        <h3 className="font-bold text-sm text-white mb-1 line-clamp-2 leading-snug">{p.name}</h3>
                                        <p className="text-xs text-[#5B6B66] uppercase">{p.unit}</p>
                                        <div className="mt-auto pt-4 flex items-center justify-between">
                                            <p className="font-extrabold text-[#00E58F]">₹{p.price}</p>

                                            {qty > 0 ? (
                                                <div className="flex items-center gap-3 bg-[#131B19] rounded-lg p-1 border border-[#1A2623]">
                                                    <button onClick={() => updateQuantity(p, -1)} className="w-6 h-6 rounded-md bg-[#0A110F] flex items-center justify-center hover:bg-[#FF4D4D]/20 hover:text-[#FF4D4D] transition-colors"><Minus className="w-3 h-3" /></button>
                                                    <span className="text-xs font-bold w-4 text-center">{qty}</span>
                                                    <button onClick={() => updateQuantity(p, 1)} className="w-6 h-6 rounded-md bg-[#0A110F] flex items-center justify-center hover:bg-[#00E58F]/20 hover:text-[#00E58F] transition-colors"><Plus className="w-3 h-3" /></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => updateQuantity(p, 1)} className="w-8 h-8 rounded-lg bg-[#00E58F]/10 text-[#00E58F] flex items-center justify-center hover:bg-[#00E58F] hover:text-[#0A0A0A] transition-colors">
                                                    <Plus className="w-4 h-4 stroke-[3]" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20 text-[#5B6B66]">
                            <Search className="w-10 h-10 mx-auto mb-4 opacity-20" />
                            <p>No products found in this category.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* ── Cart Drawer / Modal ── */}
            {showCart && (
                <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                    <div className="w-full max-w-md bg-[#060B09] h-full shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-[#1A2623] flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Cart Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[#1A2623] bg-[#0A110F]">
                            <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-[#00E58F]" /> Your Order</h2>
                            <button onClick={() => setShowCart(false)} className="p-2 hover:bg-[#1A2623] rounded-full text-[#5B6B66] hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-[#5B6B66] opacity-50">
                                    <ShoppingCart className="w-16 h-16 mb-4" />
                                    <p className="font-medium">Your cart is empty.</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-[#0A110F] border border-[#1A2623]">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-[#060B09]" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-[#131B19] flex items-center justify-center"><Package className="w-6 h-6 text-[#5B6B66]/30" /></div>
                                        )}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-sm leading-snug line-clamp-2">{item.name}</h4>
                                                <p className="text-xs text-[#00E58F] font-extrabold mt-1">₹{item.price * item.quantity}</p>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2">
                                                <button onClick={() => updateQuantity(item, -1)} className="p-1 rounded bg-[#131B19] hover:bg-[#FF4D4D]/20 text-[#5B6B66] hover:text-[#FF4D4D] border border-[#1A2623]"><Minus className="w-3 h-3" /></button>
                                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item, 1)} className="p-1 rounded bg-[#131B19] hover:bg-[#00E58F]/20 text-[#5B6B66] hover:text-[#00E58F] border border-[#1A2623]"><Plus className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Checkout Form */}
                        {cart.length > 0 && (
                            <div className="bg-[#0A110F] border-t border-[#1A2623] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10">
                                <form onSubmit={handleCheckout} className="space-y-4">
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6B66]" />
                                        <input required placeholder="Your Name *" value={customerName} onChange={e => setCustomerName(e.target.value)}
                                            className="w-full bg-[#060B09] border border-[#1A2623] rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-[#00E58F]/50 transition-colors" />
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6B66]" />
                                        <input required type="email" placeholder="Email Address *" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                                            className="w-full bg-[#060B09] border border-[#1A2623] rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-[#00E58F]/50 transition-colors" />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6B66]" />
                                        <input required type="tel" placeholder="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)}
                                            className="w-full bg-[#060B09] border border-[#1A2623] rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-[#00E58F]/50 transition-colors" />
                                    </div>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-3 w-4 h-4 text-[#5B6B66]" />
                                        <textarea placeholder="Delivery Address (optional)" value={address} onChange={e => setAddress(e.target.value)} rows={2}
                                            className="w-full bg-[#060B09] border border-[#1A2623] rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-[#00E58F]/50 transition-colors resize-none" />
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-[#1A2623]/50">
                                        <p className="text-[#94A39D] text-sm">Total Amount</p>
                                        <p className="text-2xl font-black text-[#00E58F]">₹{cartTotal.toLocaleString("en-IN")}</p>
                                    </div>
                                    <button type="submit" disabled={submitting} className="w-full bg-[#00E58F] text-[#0A0A0A] font-extrabold py-4 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[#00FFAA] transition-all disabled:opacity-50">
                                        {submitting ? "Placing Order..." : `Place Order (₹${cartTotal})`}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Cart Button for mobile */}
            {!showCart && cart.length > 0 && (
                <button onClick={() => setShowCart(true)} className="fixed bottom-6 right-6 z-30 flex items-center gap-3 bg-[#00E58F] text-[#0A0A0A] pl-5 pr-6 py-4 rounded-full shadow-[0_10px_40px_rgba(0,229,143,0.3)] hover:scale-105 transition-transform">
                    <div className="relative">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="absolute -top-2 -right-3 w-5 h-5 bg-[#0A110F] text-white text-[10px] flex items-center justify-center font-bold rounded-full">{cartItemsCount}</span>
                    </div>
                    <span className="font-extrabold text-sm border-l border-[#0A0A0A]/20 pl-3">₹{cartTotal.toLocaleString("en-IN")}</span>
                </button>
            )}

        </div>
    )
}
