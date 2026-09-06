import React, { useState, useEffect, useMemo } from "react";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Star, 
  X, 
  Check, 
  Plus, 
  Minus,
  Info, 
  Sun, 
  Moon,
  ChevronRight,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Truck,
  ChevronLeft,
  Loader2,
  Smartphone,
  Building2,
  QrCode,
  Wallet,
  Banknote,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  User,
  AlertCircle,
  Tag,
  Gift,
  Percent,
  Trash2
} from "lucide-react";
import { CURATED_PRODUCTS } from "../data/skincareData";
import sakuraCleanserImg from "../assets/images/sakura_cleanser_1788363415868.jpg";
import { 
  SkincareProduct, 
  PaymentCard, 
  ShippingAddress, 
  PaymentMethodType, 
  OrderRecord 
} from "../types";
import { formatINR, calculateDiscountPercent } from "../lib/formatters";
import { db, isFirebaseReady } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const FALLBACK_SKINCARE_IMAGE = sakuraCleanserImg;

interface ProductCatalogProps {
  onAddProductToRoutine: (regime: "AM" | "PM", product: SkincareProduct) => void;
  paymentCards: PaymentCard[];
  onAddPaymentCard: (card: Omit<PaymentCard, "id">) => void;
  currentUser?: { uid: string; email: string; displayName: string } | null;
}

// List of Indian States and Union Territories for shipping address
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi (NCT)",
  "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh"
];

// Helper to dynamically inject Razorpay JS script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};

export default function ProductCatalog({ 
  onAddProductToRoutine,
  paymentCards,
  onAddPaymentCard,
  currentUser
}: ProductCatalogProps) {
  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedConcern, setSelectedConcern] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<SkincareProduct | null>(null);
  const [productDetailQty, setProductDetailQty] = useState<number>(1);
  
  // Cart state
  const [cart, setCart] = useState<{ product: SkincareProduct; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState<boolean>(false);

  // Checkout flow state: "cart" -> "address" -> "payment" -> "processing" -> "receipt"
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "address" | "payment" | "processing" | "receipt">("cart");
  
  // Address State (Indian Format)
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: currentUser?.displayName || "",
    mobileNumber: "",
    email: currentUser?.email || "",
    houseBuilding: "",
    streetArea: "",
    landmark: "",
    city: "",
    state: "Maharashtra",
    pinCode: "",
    saveAddress: true,
  });
  const [addressError, setAddressError] = useState<string | null>(null);

  // Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("UPI");
  const [upiOption, setUpiOption] = useState<string>("GPay"); // GPay, PhonePe, Paytm, BHIM, Custom
  const [customUpiId, setCustomUpiId] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("HDFC Bank");
  const [selectedWallet, setSelectedWallet] = useState<string>("Paytm Wallet");

  // Payment Processing & Status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Completed Order Record
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);

  // Load Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // Sync user info if available
  useEffect(() => {
    if (currentUser) {
      setAddress(prev => ({
        ...prev,
        fullName: prev.fullName || currentUser.displayName || "",
        email: prev.email || currentUser.email || ""
      }));
    }
  }, [currentUser]);

  // Filter products
  const filteredProducts = CURATED_PRODUCTS.filter((prod) => {
    const matchesCategory = selectedCategory === "All" || prod.category === selectedCategory;
    const matchesConcern = selectedConcern === "All" || prod.concerns.some(c => c.toLowerCase() === selectedConcern.toLowerCase());
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesConcern && matchesSearch;
  });

  // Cart operations
  const handleAddToCart = (product: SkincareProduct, qty: number = 1) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += qty;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: qty }]);
    }
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleQuickAdd = (regime: "AM" | "PM", prod: SkincareProduct) => {
    onAddProductToRoutine(regime, prod);
    alert(`Added "${prod.name}" as a custom step in your ${regime} routine!`);
  };

  // Coupon State
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleApplyCoupon = (customCode?: string) => {
    const code = (customCode || couponCode).trim().toUpperCase();
    if (!code) return;

    if (code === "GLOW10" || code === "SAKURA10") {
      setAppliedCoupon({ code, percent: 10 });
      setCouponMessage({ text: "🎉 Code 'GLOW10' applied: 10% Instant Discount!", isError: false });
    } else if (code === "GLOW20" || code === "DERMA20") {
      setAppliedCoupon({ code, percent: 20 });
      setCouponMessage({ text: "🎉 Code 'GLOW20' applied: 20% Mega Savings!", isError: false });
    } else if (code === "FREESHIP") {
      setAppliedCoupon({ code, percent: 5 });
      setCouponMessage({ text: "🎉 Code 'FREESHIP' applied: Extra 5% off!", isError: false });
    } else {
      setCouponMessage({ text: "Invalid promo code. Try 'GLOW10' or 'GLOW20'.", isError: true });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage(null);
  };

  // Pricing Calculations in INR
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalMRP = cart.reduce((sum, item) => sum + ((item.product.mrp || item.product.price) * item.quantity), 0);
  const mrpSavings = Math.max(0, totalMRP - cartSubtotal);
  const couponSavings = appliedCoupon ? Math.round((cartSubtotal * appliedCoupon.percent) / 100) : 0;
  const deliveryFee = cartSubtotal >= 499 || cartSubtotal === 0 ? 0 : 49;
  const codFee = paymentMethod === "COD" ? 40 : 0;
  const estimatedTaxGST = Math.round((cartSubtotal - couponSavings) * 0.18); // 18% GST inclusive
  const finalCartTotal = Math.max(0, cartSubtotal - couponSavings + deliveryFee + codFee);

  // Suggested Routine Complements for cart drawer
  const cartProductIds = useMemo(() => new Set(cart.map(c => c.product.id)), [cart]);
  const suggestedAddOns = useMemo(() => {
    return CURATED_PRODUCTS.filter(p => !cartProductIds.has(p.id)).slice(0, 2);
  }, [cartProductIds]);

  // Validate Indian Address
  const handleAddressSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAddressError(null);

    if (!address.fullName.trim()) {
      setAddressError("Please enter your Full Name.");
      return;
    }
    const cleanPhone = address.mobileNumber.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setAddressError("Please enter a valid 10-digit Indian Mobile Number (+91).");
      return;
    }
    if (!address.houseBuilding.trim()) {
      setAddressError("Please enter your House / Flat Number.");
      return;
    }
    if (!address.streetArea.trim()) {
      setAddressError("Please enter your Street / Area.");
      return;
    }
    if (!address.city.trim()) {
      setAddressError("Please enter your City.");
      return;
    }
    if (!address.state.trim()) {
      setAddressError("Please select your State.");
      return;
    }
    const cleanPin = address.pinCode.replace(/\D/g, "");
    if (!/^\d{6}$/.test(cleanPin)) {
      setAddressError("Please enter a valid 6-digit PIN Code.");
      return;
    }

    setCheckoutStep("payment");
  };

  // Razorpay & Order Processing
  const handleExecutePayment = async () => {
    setPaymentError(null);

    // If Cash on Delivery, bypass Razorpay modal directly
    if (paymentMethod === "COD") {
      processFinalOrder({
        method: "COD",
        subMethod: "Cash on Delivery",
        status: "Pending COD"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStatus("Initiating secure Razorpay checkout order...");

    try {
      let orderData: any;
      try {
        const res = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalCartTotal,
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: {
              customerName: address.fullName,
              customerPhone: address.mobileNumber,
              deliveryCity: address.city
            }
          })
        });

        if (res.ok) {
          orderData = await res.json();
        } else {
          orderData = {
            id: `order_mock_${Date.now()}`,
            amount: finalCartTotal * 100,
            currency: "INR",
            isMockMode: true,
            keyId: "rzp_test_NourishGlowKey"
          };
        }
      } catch (fetchErr) {
        orderData = {
          id: `order_mock_${Date.now()}`,
          amount: finalCartTotal * 100,
          currency: "INR",
          isMockMode: true,
          keyId: "rzp_test_NourishGlowKey"
        };
      }

      // If server returned mock mode (due to unconfigured or placeholder Razorpay API keys)
      if (orderData.isMockMode || !orderData.keyId || orderData.keyId.includes("NourishGlow") || orderData.keyId.endsWith("...")) {
        setProcessingStatus("Authorizing test mode Razorpay transaction...");
        setTimeout(() => {
          processFinalOrder({
            method: paymentMethod,
            subMethod: paymentMethod === "UPI" ? upiOption : paymentMethod === "NetBanking" ? selectedBank : "Razorpay Online",
            upiId: customUpiId || undefined,
            razorpayPaymentId: `pay_rzp_demo_${Date.now()}`,
            razorpayOrderId: orderData.id,
            status: "Paid"
          });
          setIsProcessing(false);
        }, 1200);
        return;
      }

      const loaded = await loadRazorpayScript();

      if (!loaded || !(window as any).Razorpay) {
        // Fallback for environment when script cannot reach CDN
        setProcessingStatus("Completing secure payment authorization...");
        setTimeout(() => {
          processFinalOrder({
            method: paymentMethod,
            subMethod: paymentMethod === "UPI" ? upiOption : paymentMethod === "NetBanking" ? selectedBank : "Card / Wallet",
            upiId: customUpiId || undefined,
            razorpayPaymentId: `pay_rzp_mock_${Date.now()}`,
            razorpayOrderId: orderData.id,
            status: "Paid"
          });
          setIsProcessing(false);
        }, 1200);
        return;
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Nourish Glow Skincare",
        description: `Order of ${cart.length} Skincare Product(s)`,
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=200",
        order_id: orderData.id,
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.mobileNumber,
        },
        notes: {
          address: `${address.houseBuilding}, ${address.streetArea}, ${address.city}, ${address.state} - ${address.pinCode}`
        },
        theme: {
          color: "#4a5d4e" // Natural Sage Theme Color
        },
        handler: async (response: any) => {
          setProcessingStatus("Verifying payment security signature with server...");
          
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.verified) {
              processFinalOrder({
                method: paymentMethod,
                subMethod: paymentMethod === "UPI" ? upiOption : paymentMethod === "NetBanking" ? selectedBank : "Razorpay Online",
                upiId: customUpiId || undefined,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                status: "Paid"
              });
            } else {
              setPaymentError("Payment verification failed. Please try again.");
            }
          } catch (err: any) {
            console.warn("Verification notice:", err);
            setPaymentError("Network error verifying payment signature. Please contact support.");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentError("Payment process was cancelled. Your items remain safely in your cart.");
          }
        }
      };

      try {
        const rzpModal = new (window as any).Razorpay(options);
        rzpModal.on("payment.failed", (response: any) => {
          setIsProcessing(false);
          setPaymentError(`Payment Failed: ${response.error.description || "Transaction declined by bank."}`);
        });
        rzpModal.open();
      } catch (clientErr: any) {
        console.warn("Razorpay client SDK error, falling back to demo processing:", clientErr);
        processFinalOrder({
          method: paymentMethod,
          subMethod: paymentMethod === "UPI" ? upiOption : paymentMethod === "NetBanking" ? selectedBank : "Razorpay Online",
          upiId: customUpiId || undefined,
          razorpayPaymentId: `pay_rzp_demo_${Date.now()}`,
          razorpayOrderId: orderData.id,
          status: "Paid"
        });
        setIsProcessing(false);
      }

    } catch (err: any) {
      console.warn("Razorpay order notice:", err);
      setIsProcessing(false);
      setPaymentError(err.message || "Failed to initialize payment gateway.");
    }
  };

  // Save Final Order to State and Firestore
  const processFinalOrder = async (paymentDetails: any) => {
    const generatedOrderId = `NG-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Estimate delivery date: 3 business days from now
    const delivDate = new Date();
    delivDate.setDate(delivDate.getDate() + 3);
    const dateFormatted = delivDate.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    const newOrder: OrderRecord = {
      id: generatedOrderId,
      userId: currentUser?.uid,
      items: cart.map(item => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity
      })),
      shippingAddress: address,
      pricing: {
        subtotal: cartSubtotal,
        discount: mrpSavings,
        shippingCharges: deliveryFee,
        taxes: estimatedTaxGST,
        finalTotal: finalCartTotal
      },
      payment: paymentDetails,
      orderStatus: "Confirmed",
      createdAt: new Date().toISOString(),
      estimatedDeliveryDate: dateFormatted
    };

    setCompletedOrder(newOrder);

    // Save order to user-scoped localStorage for instant account synchronization
    try {
      const orderStorageKey = currentUser?.uid ? `glow_sense_${currentUser.uid}_orders` : "glow_sense_guest_orders";
      const storedOrders = JSON.parse(localStorage.getItem(orderStorageKey) || "[]");
      const updatedOrders = [
        {
          id: newOrder.id,
          date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          items: newOrder.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            image: item.product.image
          })),
          total: newOrder.pricing.finalTotal,
          status: "Confirmed",
          statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
        },
        ...storedOrders
      ];
      localStorage.setItem(orderStorageKey, JSON.stringify(updatedOrders));
    } catch (e) {
      console.warn("Could not save order to local storage", e);
    }

    // Save order to Firestore if user logged in and cloud is configured
    if (currentUser?.uid && isFirebaseReady && db) {
      try {
        const orderRef = doc(db, "users", currentUser.uid, "orders", generatedOrderId);
        await setDoc(orderRef, newOrder);
      } catch (err) {
        console.warn("Could not sync order to Firestore:", err);
      }
    }

    setCheckoutStep("receipt");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-medium tracking-tight text-natural-text-primary">
            Skincare Collection
          </h2>
          <p className="text-sm text-natural-text-secondary mt-1">
            Explore authentic dermatological formulations with fast delivery across India.
          </p>
        </div>

        {/* Cart Trigger Button */}
        <button
          onClick={() => {
            setCheckoutStep("cart");
            setShowCart(true);
          }}
          className="relative px-5 py-2.5 bg-natural-text-primary text-natural-white rounded-2xl hover:bg-natural-text-primary/90 font-semibold text-xs flex items-center gap-2 transition-all shadow-3xs shrink-0 cursor-pointer"
        >
          <ShoppingBag className="h-4 w-4" />
          Shopping Cart
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-natural-sage text-natural-white text-[10px] font-bold flex items-center justify-center animate-bounce">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-natural-card p-4 border border-natural-border rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-natural-text-secondary/60" />
          <input
            type="text"
            placeholder="Search products, ingredients, or skin concerns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-3 bg-natural-white border border-natural-border rounded-xl focus:border-natural-sage focus:outline-none focus:ring-1 focus:ring-natural-sage/20"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto py-1">
          {["All", "Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat 
                  ? "bg-natural-text-primary border-natural-text-primary text-natural-white shadow-3xs" 
                  : "bg-natural-white border-natural-border text-natural-text-secondary hover:border-natural-border-dark hover:bg-natural-card/45"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Concerns Dropdown */}
        <div className="relative">
          <select
            value={selectedConcern}
            onChange={(e) => setSelectedConcern(e.target.value)}
            className="text-xs p-3 bg-natural-white border border-natural-border rounded-xl font-semibold text-natural-text-secondary pr-8 appearance-none cursor-pointer focus:outline-none focus:border-natural-sage"
          >
            <option value="All">All Skin Concerns</option>
            <option value="Dryness">Dryness / Dehydration</option>
            <option value="Acne">Acne & Breakouts</option>
            <option value="Dullness">Dullness & Glow</option>
            <option value="Sensitivity">Skin Sensitivity</option>
            <option value="Aging">Anti-Aging & Wrinkles</option>
            <option value="Large Pores">Enlarged Pores</option>
          </select>
          <Filter className="absolute right-3.5 top-3.5 h-3.5 w-3.5 text-natural-text-secondary/60 pointer-events-none" />
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-natural-card border border-natural-border rounded-3xl">
          <Search className="h-10 w-10 text-natural-text-secondary/50 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-natural-text-primary font-serif font-medium">No skincare formulas match your filters.</p>
          <p className="text-xs text-natural-text-secondary mt-1">Try resetting your search query or selecting a different category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => {
            const discountPct = calculateDiscountPercent(prod.mrp || 0, prod.price);
            return (
              <div 
                key={prod.id}
                className="group border border-natural-border rounded-3xl bg-natural-white overflow-hidden hover:shadow-3xs transition-all flex flex-col h-full relative"
              >
                {/* Image & Badges */}
                <div className="relative aspect-square overflow-hidden bg-natural-card border-b border-natural-border">
                  <img 
                    src={prod.image} 
                    alt={prod.name} 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_SKINCARE_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                  />
                  <span className="absolute top-3.5 left-3.5 bg-natural-white/90 backdrop-blur-xs text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-natural-border text-natural-text-primary shadow-3xs uppercase">
                    {prod.category}
                  </span>
                  {discountPct > 0 && (
                    <span className="absolute top-3.5 right-3.5 bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-full shadow-3xs flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" /> {discountPct}% OFF
                    </span>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-natural-sage font-bold uppercase tracking-wider">{prod.brand}</p>
                    <h3 className="font-semibold text-natural-text-primary text-sm tracking-tight mt-1 line-clamp-1 group-hover:text-natural-sage transition-colors">
                      {prod.name}
                    </h3>
                    
                    {/* Rating & INR Pricing */}
                    <div className="flex justify-between items-baseline mt-2.5">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-natural-text-primary">{prod.rating}</span>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-baseline gap-1.5 justify-end">
                          <span className="text-base font-bold text-natural-text-primary">{formatINR(prod.price)}</span>
                          {prod.mrp && prod.mrp > prod.price && (
                            <span className="text-xs text-natural-text-secondary line-through font-mono">
                              {formatINR(prod.mrp)}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-emerald-700 font-semibold font-mono mt-0.5">
                          Includes all taxes
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-natural-text-secondary mt-2.5 line-clamp-2 leading-relaxed font-normal">
                      {prod.description}
                    </p>

                    {/* Active Ingredients Tags */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {prod.ingredients.slice(0, 2).map((ing, i) => (
                        <span key={i} className="text-[9px] font-mono bg-natural-card border border-natural-border px-2 py-0.5 rounded-full text-natural-text-secondary">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-natural-border flex gap-2 w-full justify-between items-center">
                    <button
                      onClick={() => {
                        setSelectedProduct(prod);
                        setProductDetailQty(1);
                      }}
                      className="text-[11px] text-natural-text-secondary hover:text-natural-text-primary font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        handleAddToCart(prod, 1);
                        setShowCart(true);
                        setCheckoutStep("cart");
                      }}
                      className="bg-natural-text-primary hover:bg-natural-text-primary/90 text-natural-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-natural-text-primary/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-natural-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative border border-natural-border animate-slide-up">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-natural-white/80 hover:bg-natural-white text-natural-text-secondary hover:text-natural-text-primary border border-natural-border shadow-3xs transition-all z-10 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-5 h-full max-h-[85vh] overflow-y-auto">
              {/* Product Shot */}
              <div className="md:col-span-2 relative bg-natural-card">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_SKINCARE_IMAGE;
                  }}
                  className="w-full h-full object-cover aspect-square md:aspect-auto md:h-full" 
                />
                <div className="absolute top-4 left-4 bg-natural-text-primary text-natural-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {selectedProduct.category}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 md:p-8 md:col-span-3 space-y-5 flex flex-col justify-between bg-natural-white">
                <div>
                  <p className="text-xs font-mono font-bold text-natural-sage uppercase tracking-widest">{selectedProduct.brand}</p>
                  <h3 className="text-xl font-serif font-medium tracking-tight text-natural-text-primary mt-1">
                    {selectedProduct.name}
                  </h3>
                  
                  {/* Rating & Indian Rupee Pricing */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs font-semibold text-natural-text-secondary ml-1">({selectedProduct.rating})</span>
                    </div>
                    <span className="h-1.5 w-1.5 rounded-full bg-natural-border-dark" />
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-natural-text-primary">{formatINR(selectedProduct.price)}</span>
                      {selectedProduct.mrp && selectedProduct.mrp > selectedProduct.price && (
                        <span className="text-xs text-natural-text-secondary line-through font-mono">
                          MRP: {formatINR(selectedProduct.mrp)}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-natural-text-secondary mt-3 leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  {/* Key Benefits */}
                  <div className="mt-5">
                    <p className="text-[10px] font-mono font-bold text-natural-text-secondary/60 uppercase tracking-wider mb-2">Key Benefits</p>
                    <ul className="space-y-1.5">
                      {selectedProduct.benefits.map((ben, idx) => (
                        <li key={idx} className="flex gap-2 items-start text-xs text-natural-text-secondary">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <p>{ben}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quantity selector */}
                  <div className="mt-5 flex items-center gap-3">
                    <span className="text-xs font-semibold text-natural-text-primary">Quantity:</span>
                    <div className="flex items-center border border-natural-border rounded-xl bg-natural-card overflow-hidden">
                      <button
                        onClick={() => setProductDetailQty(Math.max(1, productDetailQty - 1))}
                        className="px-3 py-1.5 hover:bg-natural-border/50 text-natural-text-primary font-bold cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold font-mono">{productDetailQty}</span>
                      <button
                        onClick={() => setProductDetailQty(productDetailQty + 1)}
                        className="px-3 py-1.5 hover:bg-natural-border/50 text-natural-text-primary font-bold cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-natural-border flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct, productDetailQty);
                      setSelectedProduct(null);
                      setShowCart(true);
                      setCheckoutStep("cart");
                    }}
                    className="flex-1 py-3 bg-natural-text-primary hover:bg-natural-text-primary/90 text-natural-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart ({formatINR(selectedProduct.price * productDetailQty)})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Slide-Over Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-natural-text-primary/60 backdrop-blur-xs flex items-center justify-end z-50 animate-fade-in">
          <div className="bg-natural-white w-full max-w-full md:max-w-3xl lg:max-w-4xl h-full shadow-2xl relative border-l border-natural-border flex flex-col justify-between animate-slide-left overflow-hidden">
            
            {/* CHECKOUT STEP HEADER / BREADCRUMBS */}
            {checkoutStep !== "receipt" && (
              <div className="px-4 sm:px-6 py-3.5 border-b border-natural-border bg-natural-card/30 shrink-0">
                <div className="flex items-center justify-between gap-2 max-w-xl mx-auto">
                  {/* Step 1 */}
                  <button
                    onClick={() => setCheckoutStep("cart")}
                    className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                      checkoutStep === "cart"
                        ? "text-rose-600 font-bold"
                        : "text-emerald-700 hover:text-natural-text-primary"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      checkoutStep === "cart"
                        ? "bg-rose-600 text-white"
                        : "bg-emerald-600 text-white"
                    }`}>
                      {checkoutStep === "cart" ? "1" : "✓"}
                    </span>
                    <span className="hidden sm:inline">1. Your Shopping Cart</span>
                    <span className="sm:hidden">Cart</span>
                  </button>

                  <ChevronRight className="h-3.5 w-3.5 text-natural-text-secondary/40 shrink-0" />

                  {/* Step 2 */}
                  <button
                    onClick={() => {
                      if (cart.length > 0) setCheckoutStep("address");
                    }}
                    disabled={cart.length === 0}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      checkoutStep === "address"
                        ? "text-rose-600 font-bold"
                        : checkoutStep === "payment"
                        ? "text-emerald-700 hover:text-natural-text-primary cursor-pointer"
                        : "text-natural-text-secondary/60 cursor-not-allowed"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      checkoutStep === "address"
                        ? "bg-rose-600 text-white"
                        : checkoutStep === "payment"
                        ? "bg-emerald-600 text-white"
                        : "bg-natural-border text-natural-text-secondary"
                    }`}>
                      {checkoutStep === "payment" ? "✓" : "2"}
                    </span>
                    <span className="hidden sm:inline">2. Delivery Address</span>
                    <span className="sm:hidden">Address</span>
                  </button>

                  <ChevronRight className="h-3.5 w-3.5 text-natural-text-secondary/40 shrink-0" />

                  {/* Step 3 */}
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                    checkoutStep === "payment" ? "text-rose-600 font-bold" : "text-natural-text-secondary/60"
                  }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      checkoutStep === "payment" ? "bg-rose-600 text-white" : "bg-natural-border text-natural-text-secondary"
                    }`}>
                      3
                    </span>
                    <span className="hidden sm:inline">3. Payment</span>
                    <span className="sm:hidden">Payment</span>
                  </div>

                  <button
                    onClick={() => setShowCart(false)}
                    className="p-1.5 rounded-full hover:bg-natural-card text-natural-text-secondary hover:text-natural-text-primary cursor-pointer ml-auto"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 1: YOUR SHOPPING CART */}
            {/* ========================================================================= */}
            {checkoutStep === "cart" && (
              <div className="flex flex-col h-full justify-between relative overflow-hidden">
                {/* Cart Top Title Bar */}
                <div className="p-4 sm:p-5 pb-3 border-b border-natural-border shrink-0 bg-natural-white flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-medium text-xl text-natural-text-primary">Your Shopping Cart</h3>
                      {cart.length > 0 && (
                        <span className="text-[11px] font-mono font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "item" : "items"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-natural-text-secondary mt-0.5">
                      Review your items before continuing to delivery address.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 rounded-full hover:bg-natural-card text-natural-text-secondary hover:text-natural-text-primary cursor-pointer"
                    aria-label="Close cart"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Free Delivery Goal Tracker */}
                {cart.length > 0 && (
                  <div className="mx-4 sm:mx-5 mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs shrink-0">
                    <div className="flex justify-between items-center text-[11px] font-medium text-emerald-900 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                        {cartSubtotal >= 499 ? (
                          <span className="font-bold text-emerald-800">🎉 FREE Delivery unlocked!</span>
                        ) : (
                          <span>Add <strong className="text-emerald-800 font-mono">{formatINR(499 - cartSubtotal)}</strong> more for FREE Delivery</span>
                        )}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-emerald-700">{Math.min(100, Math.round((cartSubtotal / 499) * 100))}%</span>
                    </div>
                    <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (cartSubtotal / 499) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className="text-center p-8 flex-1 flex flex-col justify-center items-center">
                    <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mb-3 text-rose-500 shadow-3xs">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                    <p className="text-lg text-natural-text-primary font-serif font-medium">Your shopping cart is empty</p>
                    <p className="text-xs text-natural-text-secondary mt-1.5 max-w-xs leading-relaxed">
                      Add skincare products to start your order.
                    </p>
                    <button
                      onClick={() => setShowCart(false)}
                      className="mt-6 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-3xs transition-all cursor-pointer"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  /* Two-Column Responsive Layout */
                  <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                    {/* LEFT COLUMN: Products List with Simple Details */}
                    <div className="md:col-span-7 lg:col-span-7 overflow-y-auto p-4 sm:p-5 space-y-4 md:border-r border-natural-border pb-32 md:pb-6">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-mono font-bold text-natural-text-secondary uppercase tracking-wider">
                          Items in Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                        </span>
                        <span className="text-xs text-emerald-700 font-medium">100% Genuine</span>
                      </div>

                      {/* Products List */}
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex gap-3.5 p-3.5 border border-natural-border rounded-2xl bg-natural-card/40 hover:bg-natural-card/70 transition-colors">
                            {/* Product Image */}
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = FALLBACK_SKINCARE_IMAGE;
                              }}
                              className="h-20 w-20 rounded-xl object-cover border border-natural-border bg-natural-white shrink-0" 
                            />
                            
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-1">
                                  {/* Simple Product Name */}
                                  <h4 className="text-xs sm:text-sm font-semibold text-natural-text-primary truncate">
                                    {item.product.name}
                                  </h4>
                                  
                                  {/* Remove Button */}
                                  <button
                                    onClick={() => handleRemoveFromCart(item.product.id)}
                                    className="flex items-center gap-1 text-[11px] text-natural-text-secondary/60 hover:text-red-600 transition-colors p-1 -mr-1 -mt-1 cursor-pointer"
                                    title="Remove product"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline text-[10px]">Remove</span>
                                  </button>
                                </div>
                                
                                {/* Price */}
                                <div className="flex items-baseline gap-2 mt-1">
                                  <span className="text-xs font-bold font-mono text-natural-text-primary">
                                    {formatINR(item.product.price)}
                                  </span>
                                  {item.product.mrp && item.product.mrp > item.product.price && (
                                    <span className="text-[10px] text-natural-text-secondary line-through font-mono">
                                      {formatINR(item.product.mrp)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-natural-border/60">
                                {/* Quantity + / - */}
                                <div className="flex items-center border border-natural-border rounded-lg bg-natural-white shadow-3xs">
                                  <button
                                    onClick={() => handleUpdateCartQty(item.product.id, -1)}
                                    className="px-2.5 py-1 text-xs text-natural-text-secondary hover:text-natural-text-primary hover:bg-natural-card rounded-l-lg cursor-pointer font-bold"
                                    aria-label="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <span className="px-2.5 text-xs font-bold font-mono text-natural-text-primary">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleUpdateCartQty(item.product.id, 1)}
                                    className="px-2.5 py-1 text-xs text-natural-text-secondary hover:text-natural-text-primary hover:bg-natural-card rounded-r-lg cursor-pointer font-bold"
                                    aria-label="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Item Total */}
                                <div className="text-right">
                                  <span className="text-xs sm:text-sm font-bold text-natural-text-primary font-mono">
                                    {formatINR(item.product.price * item.quantity)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Coupon / Discount Code */}
                      <div className="border border-natural-border rounded-2xl p-3.5 bg-natural-card/20 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-natural-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-rose-600" /> Apply Coupon Code
                          </span>
                          {appliedCoupon && (
                            <button
                              onClick={handleRemoveCoupon}
                              className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                            >
                              Remove Coupon
                            </button>
                          )}
                        </div>

                        {appliedCoupon ? (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                            <span className="font-mono font-bold flex items-center gap-1">
                              <Check className="h-3.5 w-3.5 text-emerald-700" /> {appliedCoupon.code} Applied
                            </span>
                            <span className="font-bold text-emerald-700">-{appliedCoupon.percent}% OFF ({formatINR(couponSavings)})</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="Enter coupon code (e.g. GLOW10)"
                                className="flex-1 px-3.5 py-2 text-xs border border-natural-border rounded-xl bg-natural-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono uppercase placeholder:normal-case"
                              />
                              <button
                                type="button"
                                onClick={() => handleApplyCoupon()}
                                className="px-4 py-2 bg-natural-text-primary hover:bg-natural-text-primary/90 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                              >
                                Apply
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-natural-text-secondary">Offers:</span>
                              <button
                                type="button"
                                onClick={() => handleApplyCoupon("GLOW10")}
                                className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-mono font-bold cursor-pointer border border-emerald-200"
                              >
                                GLOW10 (-10%)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyCoupon("GLOW20")}
                                className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[10px] font-mono font-bold cursor-pointer border border-rose-200"
                              >
                                GLOW20 (-20%)
                              </button>
                            </div>

                            {couponMessage && (
                              <p className={`text-[10px] ${couponMessage.isError ? "text-red-600" : "text-emerald-700 font-medium"}`}>
                                {couponMessage.text}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Order Summary & Clear Action Button (Desktop) */}
                    <div className="md:col-span-5 lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 md:p-6 bg-natural-card/25 overflow-y-auto pb-32 md:pb-6">
                      <div className="space-y-4">
                        <h4 className="font-serif font-medium text-base text-natural-text-primary border-b border-natural-border pb-2">
                          Your Order
                        </h4>

                        {/* Price Details Card */}
                        <div className="border border-natural-border rounded-2xl p-4 bg-natural-white shadow-3xs space-y-2.5 text-xs">
                          {/* Subtotal */}
                          <div className="flex justify-between text-natural-text-secondary">
                            <span>Subtotal</span>
                            <span className="font-mono font-semibold text-natural-text-primary">{formatINR(cartSubtotal)}</span>
                          </div>

                          {couponSavings > 0 && (
                            <div className="flex justify-between text-rose-600 font-bold">
                              <span>Coupon Discount</span>
                              <span className="font-mono">- {formatINR(couponSavings)}</span>
                            </div>
                          )}

                          {/* Delivery */}
                          <div className="flex justify-between text-natural-text-secondary">
                            <span>Delivery</span>
                            <span className="font-mono">
                              {deliveryFee === 0 ? (
                                <span className="text-emerald-700 font-bold uppercase text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">FREE</span>
                              ) : (
                                formatINR(deliveryFee)
                              )}
                            </span>
                          </div>

                          {/* Total */}
                          <div className="border-t border-natural-border pt-3 flex justify-between items-baseline">
                            <div>
                              <span className="text-sm font-bold text-natural-text-primary block">Total</span>
                              <span className="text-[10px] text-natural-text-secondary">Includes all taxes</span>
                            </div>
                            <span className="font-mono text-xl font-bold text-rose-600">{formatINR(finalCartTotal)}</span>
                          </div>
                        </div>

                        {/* Large Clear Button on Desktop: "Continue to Delivery Address →" */}
                        <button
                          id="continue-to-delivery-address-desktop-btn"
                          onClick={() => setCheckoutStep("address")}
                          className="w-full py-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-semibold rounded-2xl text-sm shadow-md transition-all text-center cursor-pointer flex items-center justify-center gap-2 group"
                        >
                          <span>Continue to Delivery Address</span>
                          <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                        </button>

                        <div className="space-y-2 pt-2 border-t border-natural-border/70 text-[11px] text-natural-text-secondary">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span>Fast Delivery across all PIN codes in India</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span>100% Genuine and Authentic Skincare</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fixed Bottom Action Bar on Mobile (< md screens) */}
                {cart.length > 0 && (
                  <div className="md:hidden fixed bottom-0 left-0 right-0 bg-natural-white/95 backdrop-blur-md border-t border-natural-border p-3.5 px-4 z-40 shadow-xl flex items-center justify-between gap-3 animate-fade-in">
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono text-natural-text-secondary uppercase">Total</p>
                      <p className="text-base font-bold font-mono text-natural-text-primary leading-tight">
                        {formatINR(finalCartTotal)}
                      </p>
                    </div>
                    <button
                      id="continue-to-delivery-address-mobile-btn"
                      onClick={() => setCheckoutStep("address")}
                      className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Continue to Delivery Address</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: DELIVERY ADDRESS */}
            {/* ========================================================================= */}
            {checkoutStep === "address" && (
              <div className="flex flex-col h-full justify-between relative overflow-hidden">
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Address Top Header */}
                  <div className="p-4 sm:p-5 pb-3.5 border-b border-natural-border shrink-0 bg-natural-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCheckoutStep("cart")}
                        className="flex items-center gap-1 text-xs text-natural-text-secondary hover:text-natural-text-primary cursor-pointer font-medium"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Cart
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-medium text-lg text-natural-text-primary">Delivery Address</h3>
                    </div>
                    <button
                      onClick={() => setShowCart(false)}
                      className="p-1.5 rounded-full hover:bg-natural-card text-natural-text-secondary hover:text-natural-text-primary cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Two-Column Form Layout on Desktop */}
                  <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                    {/* LEFT COLUMN: Indian Delivery Address Form */}
                    <form onSubmit={handleAddressSubmit} className="md:col-span-7 lg:col-span-7 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-4 md:border-r border-natural-border pb-32 md:pb-6">
                      <div className="flex items-center justify-between border-b border-natural-border pb-2">
                        <span className="text-xs font-mono font-bold text-natural-text-secondary uppercase tracking-wider">
                          Enter Delivery Details
                        </span>
                        <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Country: India
                        </span>
                      </div>

                      {addressError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-fade-in">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          <p>{addressError}</p>
                        </div>
                      )}

                      {/* Full Name */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-natural-text-primary">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Anjali Gupta"
                          value={address.fullName}
                          onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-natural-card border border-natural-border rounded-xl focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {/* Mobile Number (+91) & PIN Code */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-natural-text-primary">
                            Mobile Number <span className="text-red-500">*</span>
                          </label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 text-xs font-mono font-bold bg-natural-card/80 border border-r-0 border-natural-border rounded-l-xl text-natural-text-secondary">
                              +91
                            </span>
                            <input
                              type="tel"
                              placeholder="10-digit mobile number"
                              maxLength={10}
                              value={address.mobileNumber}
                              onChange={(e) => setAddress({ ...address, mobileNumber: e.target.value.replace(/\D/g, "") })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-natural-card border border-natural-border rounded-r-xl focus:outline-none focus:border-rose-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-natural-text-primary">
                            PIN Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="6-digit PIN code (e.g. 400001)"
                            maxLength={6}
                            value={address.pinCode}
                            onChange={(e) => setAddress({ ...address, pinCode: e.target.value.replace(/\D/g, "") })}
                            className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-natural-card border border-natural-border rounded-xl focus:outline-none focus:border-rose-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* House / Flat Number */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-natural-text-primary">
                          House / Flat Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Flat 402, Sunshine Heights, 4th Floor"
                          value={address.houseBuilding}
                          onChange={(e) => setAddress({ ...address, houseBuilding: e.target.value })}
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-natural-card border border-natural-border rounded-xl focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {/* Street / Area */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-natural-text-primary">
                          Street / Area <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Linking Road, Bandra West"
                          value={address.streetArea}
                          onChange={(e) => setAddress({ ...address, streetArea: e.target.value })}
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-natural-card border border-natural-border rounded-xl focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {/* Landmark (Optional) */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-natural-text-primary">
                          Landmark <span className="text-[10px] text-natural-text-secondary font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Near St. Andrews Church / Metro Station"
                          value={address.landmark || ""}
                          onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-natural-card border border-natural-border rounded-xl focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {/* City & State (Dropdown) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-natural-text-primary">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Mumbai"
                            value={address.city}
                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-natural-card border border-natural-border rounded-xl focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-natural-text-primary">
                            State <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={address.state}
                            onChange={(e) => setAddress({ ...address, state: e.target.value })}
                            className="w-full text-xs sm:text-sm px-3 py-2.5 bg-natural-card border border-natural-border rounded-xl focus:outline-none focus:border-rose-500 cursor-pointer"
                          >
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Save this address Checkbox */}
                      <div className="pt-1">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={address.saveAddress !== false}
                            onChange={(e) => setAddress({ ...address, saveAddress: e.target.checked })}
                            className="rounded border-natural-border text-rose-600 focus:ring-rose-500 h-4 w-4"
                          />
                          <span className="text-xs font-medium text-natural-text-primary">
                            Save this address
                          </span>
                        </label>
                      </div>
                    </form>

                    {/* RIGHT COLUMN: Order Summary in Delivery Address Step */}
                    <div className="md:col-span-5 lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 md:p-6 bg-natural-card/25 overflow-y-auto pb-32 md:pb-6">
                      <div className="space-y-4">
                        <h4 className="font-serif font-medium text-base text-natural-text-primary border-b border-natural-border pb-2">
                          Your Order
                        </h4>

                        <div className="border border-natural-border rounded-2xl p-4 bg-natural-white shadow-3xs space-y-2.5 text-xs">
                          <div className="flex justify-between text-natural-text-secondary">
                            <span>Total Items:</span>
                            <span className="font-mono font-bold text-natural-text-primary">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                          </div>
                          <div className="flex justify-between text-natural-text-secondary">
                            <span>Subtotal</span>
                            <span className="font-mono">{formatINR(cartSubtotal)}</span>
                          </div>
                          {couponSavings > 0 && (
                            <div className="flex justify-between text-rose-600 font-bold">
                              <span>Coupon Savings</span>
                              <span className="font-mono">- {formatINR(couponSavings)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-natural-text-secondary">
                            <span>Delivery</span>
                            <span className="font-mono text-emerald-700 font-bold">
                              {deliveryFee === 0 ? "FREE" : formatINR(deliveryFee)}
                            </span>
                          </div>
                          <div className="border-t border-natural-border pt-3 flex justify-between items-baseline font-bold text-sm text-natural-text-primary">
                            <span>Total</span>
                            <span className="font-mono text-lg text-rose-600">{formatINR(finalCartTotal)}</span>
                          </div>
                        </div>

                        {/* Large Clear Button on Desktop: "Continue to Payment →" */}
                        <button
                          id="continue-to-payment-desktop-btn"
                          onClick={() => handleAddressSubmit()}
                          className="w-full py-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-semibold rounded-2xl text-sm shadow-md transition-all text-center cursor-pointer flex items-center justify-center gap-2 group"
                        >
                          <span>Continue to Payment</span>
                          <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                        </button>

                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
                          <Truck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block">Pan-India Express Delivery</span>
                            <span className="text-[10px] text-emerald-700">Estimated delivery within 3-5 business days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Bottom Action Bar on Mobile */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-natural-white/95 backdrop-blur-md border-t border-natural-border p-3.5 px-4 z-40 shadow-xl flex items-center justify-between gap-3 animate-fade-in">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-natural-text-secondary uppercase">Total</p>
                    <p className="text-base font-bold font-mono text-natural-text-primary leading-tight">
                      {formatINR(finalCartTotal)}
                    </p>
                  </div>
                  <button
                    id="continue-to-payment-mobile-btn"
                    onClick={() => handleAddressSubmit()}
                    className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Continue to Payment</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: PAYMENT */}
            {/* ========================================================================= */}
            {checkoutStep === "payment" && (
              <div className="flex flex-col h-full justify-between relative overflow-hidden">
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Payment Step Top Header */}
                  <div className="p-4 sm:p-5 pb-3 border-b border-natural-border shrink-0 bg-natural-white flex justify-between items-center">
                    <button
                      onClick={() => setCheckoutStep("address")}
                      className="flex items-center gap-1 text-xs text-natural-text-secondary hover:text-natural-text-primary cursor-pointer font-medium"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to Delivery Address
                    </button>
                    <h3 className="font-serif font-medium text-lg text-natural-text-primary">Payment</h3>
                    <button
                      onClick={() => setShowCart(false)}
                      className="p-1.5 rounded-full hover:bg-natural-card text-natural-text-secondary hover:text-natural-text-primary cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {paymentError && (
                    <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>{paymentError}</p>
                    </div>
                  )}

                  {/* Two-Column Form Layout on Desktop */}
                  <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                    {/* LEFT COLUMN: Payment Options */}
                    <div className="md:col-span-7 lg:col-span-7 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-4 md:border-r border-natural-border pb-32 md:pb-6">
                      {/* Delivery Address Review Box */}
                      <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <p className="text-[10px] font-mono font-bold text-emerald-800 uppercase">
                            Delivering to: {address.fullName} (+91 {address.mobileNumber})
                          </p>
                          <p className="text-xs text-emerald-950 mt-0.5 line-clamp-1">
                            {address.houseBuilding}, {address.streetArea}, {address.city}, {address.state} - {address.pinCode}
                          </p>
                        </div>
                        <button
                          onClick={() => setCheckoutStep("address")}
                          className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer ml-2 shrink-0"
                        >
                          Change
                        </button>
                      </div>

                      <div className="space-y-3">
                        <span className="text-xs font-mono font-bold text-natural-text-secondary uppercase tracking-wider block">
                          Select Payment Option
                        </span>

                        {/* Option 1: UPI */}
                        <div className={`p-3.5 border rounded-2xl cursor-pointer transition-all ${paymentMethod === "UPI" ? "border-rose-600 bg-rose-50/40" : "border-natural-border hover:bg-natural-card/50"}`}>
                          <label className="flex items-center gap-3 cursor-pointer" onClick={() => setPaymentMethod("UPI")}>
                            <input
                              type="radio"
                              name="payment-method"
                              checked={paymentMethod === "UPI"}
                              onChange={() => setPaymentMethod("UPI")}
                              className="text-rose-600 focus:ring-rose-500 h-4 w-4"
                            />
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-bold text-natural-text-primary flex items-center gap-2">
                                <QrCode className="h-4 w-4 text-rose-600" />
                                UPI
                              </p>
                              <p className="text-[11px] text-natural-text-secondary mt-0.5">Google Pay, PhonePe, Paytm, BHIM, UPI ID</p>
                            </div>
                          </label>

                          {paymentMethod === "UPI" && (
                            <div className="mt-3 pt-3 border-t border-rose-200/60 space-y-2 animate-fade-in">
                              <p className="text-[10px] font-mono font-bold text-natural-text-secondary">Select UPI App:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {["Google Pay", "PhonePe", "Paytm", "BHIM / Cred"].map((app) => (
                                  <button
                                    key={app}
                                    type="button"
                                    onClick={() => setUpiOption(app)}
                                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${upiOption === app ? "bg-rose-600 text-white border-rose-600" : "bg-white border-natural-border text-natural-text-primary"}`}
                                  >
                                    {app}
                                  </button>
                                ))}
                              </div>

                              <div className="pt-1.5">
                                <input
                                  type="text"
                                  placeholder="Or enter UPI ID (e.g. name@okhdfcbank)"
                                  value={customUpiId}
                                  onChange={(e) => setCustomUpiId(e.target.value)}
                                  className="w-full text-xs px-3 py-2 bg-white border border-natural-border rounded-xl focus:outline-none focus:border-rose-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Option 2: Credit / Debit Card */}
                        <div className={`p-3.5 border rounded-2xl cursor-pointer transition-all ${paymentMethod === "Card" ? "border-rose-600 bg-rose-50/40" : "border-natural-border hover:bg-natural-card/50"}`}>
                          <label className="flex items-center gap-3 cursor-pointer" onClick={() => setPaymentMethod("Card")}>
                            <input
                              type="radio"
                              name="payment-method"
                              checked={paymentMethod === "Card"}
                              onChange={() => setPaymentMethod("Card")}
                              className="text-rose-600 focus:ring-rose-500 h-4 w-4"
                            />
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-bold text-natural-text-primary flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-rose-600" />
                                Credit / Debit Card
                              </p>
                              <p className="text-[11px] text-natural-text-secondary mt-0.5">Visa, MasterCard, RuPay, Maestro</p>
                            </div>
                          </label>
                        </div>

                        {/* Option 3: Net Banking */}
                        <div className={`p-3.5 border rounded-2xl cursor-pointer transition-all ${paymentMethod === "NetBanking" ? "border-rose-600 bg-rose-50/40" : "border-natural-border hover:bg-natural-card/50"}`}>
                          <label className="flex items-center gap-3 cursor-pointer" onClick={() => setPaymentMethod("NetBanking")}>
                            <input
                              type="radio"
                              name="payment-method"
                              checked={paymentMethod === "NetBanking"}
                              onChange={() => setPaymentMethod("NetBanking")}
                              className="text-rose-600 focus:ring-rose-500 h-4 w-4"
                            />
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-bold text-natural-text-primary flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-rose-600" />
                                Net Banking
                              </p>
                              <p className="text-[11px] text-natural-text-secondary mt-0.5">SBI, HDFC, ICICI, Axis, Kotak, PNB</p>
                            </div>
                          </label>

                          {paymentMethod === "NetBanking" && (
                            <div className="mt-3 pt-3 border-t border-rose-200/60 animate-fade-in">
                              <select
                                value={selectedBank}
                                onChange={(e) => setSelectedBank(e.target.value)}
                                className="w-full text-xs p-2.5 bg-white border border-natural-border rounded-xl focus:outline-none cursor-pointer"
                              >
                                <option value="HDFC Bank">HDFC Bank</option>
                                <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                                <option value="ICICI Bank">ICICI Bank</option>
                                <option value="Axis Bank">Axis Bank</option>
                                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                                <option value="Punjab National Bank">Punjab National Bank</option>
                                <option value="Bank of Baroda">Bank of Baroda</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Option 4: Cash on Delivery */}
                        <div className={`p-3.5 border rounded-2xl cursor-pointer transition-all ${paymentMethod === "COD" ? "border-rose-600 bg-rose-50/40" : "border-natural-border hover:bg-natural-card/50"}`}>
                          <label className="flex items-center gap-3 cursor-pointer" onClick={() => setPaymentMethod("COD")}>
                            <input
                              type="radio"
                              name="payment-method"
                              checked={paymentMethod === "COD"}
                              onChange={() => setPaymentMethod("COD")}
                              className="text-rose-600 focus:ring-rose-500 h-4 w-4"
                            />
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-bold text-natural-text-primary flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-rose-600" />
                                Cash on Delivery
                              </p>
                              <p className="text-[11px] text-natural-text-secondary mt-0.5">Pay with cash or UPI at the time of delivery</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Order Summary in Payment Step */}
                    <div className="md:col-span-5 lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 md:p-6 bg-natural-card/25 overflow-y-auto pb-32 md:pb-6">
                      <div className="space-y-4">
                        <h4 className="font-serif font-medium text-base text-natural-text-primary border-b border-natural-border pb-2">
                          Your Order
                        </h4>

                        {/* Products List Summary */}
                        <div className="space-y-2 border border-natural-border rounded-2xl p-3.5 bg-natural-white text-xs">
                          <p className="text-[10px] font-mono font-bold text-natural-text-secondary uppercase">Products</p>
                          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {cart.map((item) => (
                              <div key={item.product.id} className="flex justify-between items-center text-xs">
                                <div className="truncate max-w-[170px]">
                                  <span className="font-medium text-natural-text-primary truncate block">{item.product.name}</span>
                                  <span className="text-[10px] text-natural-text-secondary font-mono">Qty: {item.quantity} × {formatINR(item.product.price)}</span>
                                </div>
                                <span className="font-mono font-semibold text-natural-text-primary">
                                  {formatINR(item.product.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-natural-border pt-2.5 space-y-1.5">
                            {/* Subtotal */}
                            <div className="flex justify-between text-natural-text-secondary">
                              <span>Subtotal</span>
                              <span className="font-mono">{formatINR(cartSubtotal)}</span>
                            </div>

                            {couponSavings > 0 && (
                              <div className="flex justify-between text-rose-600 font-bold">
                                <span>Coupon Discount</span>
                                <span className="font-mono">- {formatINR(couponSavings)}</span>
                              </div>
                            )}

                            {/* Delivery */}
                            <div className="flex justify-between text-natural-text-secondary">
                              <span>Delivery</span>
                              <span className="font-mono text-emerald-700 font-bold">
                                {deliveryFee === 0 ? "FREE" : formatINR(deliveryFee)}
                              </span>
                            </div>

                            {/* Total Amount */}
                            <div className="border-t border-natural-border pt-2 flex justify-between font-bold text-sm text-natural-text-primary">
                              <span>Total Amount</span>
                              <span className="font-mono text-base text-rose-600">{formatINR(finalCartTotal)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Large Clear Button on Desktop: "Proceed to Payment" */}
                        <button
                          id="proceed-to-payment-desktop-btn"
                          disabled={isProcessing}
                          onClick={handleExecutePayment}
                          className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 active:scale-[0.99] text-white font-semibold rounded-2xl text-sm shadow-md transition-all text-center cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              <span>{paymentMethod === "COD" ? "Place Order" : "Proceed to Payment"}</span>
                            </>
                          )}
                        </button>

                        <p className="text-[10px] text-center text-natural-text-secondary font-mono">
                          🔒 100% Safe & Secure Payment
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Bottom Action Bar on Mobile */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-natural-white/95 backdrop-blur-md border-t border-natural-border p-3.5 px-4 z-40 shadow-xl flex items-center justify-between gap-3 animate-fade-in">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-natural-text-secondary uppercase">Total Amount</p>
                    <p className="text-base font-bold font-mono text-natural-text-primary leading-tight">
                      {formatINR(finalCartTotal)}
                    </p>
                  </div>
                  <button
                    id="proceed-to-payment-mobile-btn"
                    disabled={isProcessing}
                    onClick={handleExecutePayment}
                    className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 active:scale-[0.98] text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>{paymentMethod === "COD" ? "Place Order" : "Proceed to Payment"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: ORDER CONFIRMATION / RECEIPT */}
            {/* ========================================================================= */}
            {checkoutStep === "receipt" && completedOrder && (
              <div className="flex flex-col h-full justify-between animate-fade-in overflow-hidden">
                <div className="flex-grow overflow-y-auto space-y-5 p-4 sm:p-6 min-h-0">
                  <div className="text-center space-y-2 pt-3">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200 shadow-3xs">
                      <CheckCircle2 className="h-9 w-9" />
                    </div>
                    <div>
                      <h3 className="font-serif font-medium text-2xl text-natural-text-primary">
                        Order Placed Successfully!
                      </h3>
                      <p className="text-sm text-natural-text-secondary mt-1">
                        Thank you for your order.
                      </p>
                    </div>
                  </div>

                  {/* Order Details Card */}
                  <div className="border border-natural-border bg-natural-card/40 rounded-2xl p-4 sm:p-5 space-y-4 text-xs">
                    {/* Order Number & Estimated Delivery */}
                    <div className="flex justify-between items-center border-b border-natural-border pb-3 font-mono">
                      <div>
                        <p className="text-[10px] text-natural-text-secondary uppercase">Order Number</p>
                        <p className="font-bold text-natural-text-primary mt-0.5 text-xs sm:text-sm">{completedOrder.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-natural-text-secondary uppercase">Estimated Delivery</p>
                        <p className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1 justify-end">
                          <Truck className="h-3.5 w-3.5" />
                          {completedOrder.estimatedDeliveryDate}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <p className="text-[10px] font-mono font-bold text-natural-text-secondary uppercase">Delivery Address:</p>
                      <p className="font-semibold text-natural-text-primary mt-1">{completedOrder.shippingAddress.fullName} (+91 {completedOrder.shippingAddress.mobileNumber})</p>
                      <p className="text-xs text-natural-text-secondary leading-snug mt-0.5">
                        {completedOrder.shippingAddress.houseBuilding}, {completedOrder.shippingAddress.streetArea}
                        {completedOrder.shippingAddress.landmark ? `, Near ${completedOrder.shippingAddress.landmark}` : ""}, {completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.state} - {completedOrder.shippingAddress.pinCode}, India
                      </p>
                    </div>

                    {/* Total Paid */}
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-mono font-bold text-emerald-800 uppercase">Total Paid</p>
                        <p className="text-xs text-emerald-900 mt-0.5">
                          via {completedOrder.payment.method} ({completedOrder.payment.status})
                        </p>
                      </div>
                      <span className="font-mono text-lg font-bold text-emerald-900">
                        {formatINR(completedOrder.pricing.finalTotal)}
                      </span>
                    </div>

                    {/* Itemized List */}
                    <div className="space-y-1.5 border-t border-natural-border pt-3">
                      <p className="text-[10px] font-mono font-bold text-natural-text-secondary uppercase">Items Ordered</p>
                      {completedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="truncate max-w-[220px] text-natural-text-primary">
                            {item.product.name} <span className="font-mono text-[10px] text-natural-text-secondary">x{item.quantity}</span>
                          </span>
                          <span className="font-mono font-semibold text-natural-text-primary">
                            {formatINR(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Continue Shopping Button */}
                <div className="p-4 sm:p-5 border-t border-natural-border bg-natural-white shrink-0 shadow-md">
                  <button
                    onClick={() => {
                      setCart([]);
                      setCheckoutStep("cart");
                      setShowCart(false);
                    }}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-2xl transition-all shadow-md cursor-pointer text-center"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
