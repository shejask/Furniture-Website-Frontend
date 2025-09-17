'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import Footer from '@/components/Footer/Footer'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { useCart } from '@/context/CartContext'
import { useSearchParams } from 'next/navigation'
import { useRazorpay } from '@/hooks/useRazorpay'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase/config'
import { useAddresses } from '@/hooks/useAddresses'
import { Address, getUserAddresses } from '@/firebase/addresses'
import { saveOrder, saveIndividualOrders, Order, OrderItem, OrderAddress } from '@/firebase/orders'
import { getVendorById, Vendor } from '@/firebase/vendors'
import { getShippingRates, getShippingCostForCitySync, ShippingData } from '@/firebase/shipping'
import { getCouponByCode, computeCouponDiscount, CouponRecord } from '@/firebase/coupons'
import { getTaxById, TaxType } from '@/firebase/taxes'
import { ref, set, get } from 'firebase/database'
import { database } from '@/firebase/config'
import { locationsData } from '@/components/data/locations'

const Checkout = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    let discount = searchParams.get('discount')
    let ship = searchParams.get('ship')
    let buyNow = searchParams.get('buyNow')

    const { cartState, clearCart } = useCart();
    
    // Filter cart items for Buy Now mode - show only the most recently added item
    const displayCartItems = React.useMemo(() => {
        return buyNow === 'true' && cartState.cartArray.length > 0 
            ? [cartState.cartArray[cartState.cartArray.length - 1]] // Show only the last added item
            : cartState.cartArray; // Show all items in normal mode
    }, [buyNow, cartState.cartArray]);
    const { initiatePayment, isLoading, error } = useRazorpay();
    const [user, userLoading, authError] = useAuthState(auth);
    const { addresses, loading: addressLoading, addAddress, editAddress, makeDefault, getDefaultAddress, refreshAddresses, removeAddress } = useAddresses();
    

    // Test Firebase connection on component mount
    React.useEffect(() => {
        // Initialize user-dependent logic here
    }, [user]);

    
    const [activePayment, setActivePayment] = useState<string>('razorpay')
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [showAddressForm, setShowAddressForm] = useState<boolean>(false)
    const [saveAddress, setSaveAddress] = useState<boolean>(true)
    const [orderNote, setOrderNote] = useState<string>('')
    const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null)
    const [shippingData, setShippingData] = useState<ShippingData>({})
    const [currentShippingCost, setCurrentShippingCost] = useState<number>(0)
    const [isFreeShippingApplied, setIsFreeShippingApplied] = useState<boolean>(false)
    const [couponCode, setCouponCode] = useState<string>('')
    const [couponError, setCouponError] = useState<string>('')
    const [appliedCoupon, setAppliedCoupon] = useState<CouponRecord | null>(null)
    const [discountAmount, setDiscountAmount] = useState<number>(0)
    const [isPaymentProcessing, setIsPaymentProcessing] = useState<boolean>(false)
    const [taxDataCache, setTaxDataCache] = useState<{[taxId: string]: TaxType}>({})
    const [taxLoadingCache, setTaxLoadingCache] = useState<{[taxId: string]: boolean}>({})
    
    // Location dropdown states
    const [selectedCountry, setSelectedCountry] = useState('India')
    const [selectedState, setSelectedState] = useState('')
    const [availableStates, setAvailableStates] = useState<Array<{name: string, code: string, cities: string[]}>>([])
    const [availableCities, setAvailableCities] = useState<string[]>([])
    
    // Initialize shipping cost on component mount
    React.useEffect(() => {
        if (currentShippingCost === null || currentShippingCost === undefined) {
            setCurrentShippingCost(0);
        }
    }, [currentShippingCost]);

    // Initialize location dropdowns on component mount
    React.useEffect(() => {
        
        // Hardcode states for testing
        const hardcodedStates = [
            { name: "Andhra Pradesh", code: "AP", cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"] },
            { name: "Karnataka", code: "KA", cities: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"] },
            { name: "Kerala", code: "KL", cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Palakkad"] },
            { name: "Maharashtra", code: "MH", cities: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"] },
            { name: "Tamil Nadu", code: "TN", cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"] },
            { name: "Gujarat", code: "GJ", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"] },
            { name: "Rajasthan", code: "RJ", cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"] },
            { name: "West Bengal", code: "WB", cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"] },
            { name: "Uttar Pradesh", code: "UP", cities: ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut"] },
            { name: "Madhya Pradesh", code: "MP", cities: ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"] }
        ]
        
        setSelectedCountry('India')
        setAvailableStates(hardcodedStates)
        
        // Also try the original method
        if (locationsData && locationsData.countries) {
            const india = locationsData.countries.find(c => c.name === 'India')
            if (india) {
                // Original method also working
            }
        }
    }, []);

    // Function to fetch tax data for a product
    const fetchTaxData = React.useCallback(async (taxId: string) => {
        if (!taxId || taxDataCache[taxId] || taxLoadingCache[taxId]) {
            return; // Already cached or loading
        }

        try {
            setTaxLoadingCache(prev => ({ ...prev, [taxId]: true }));
            
            const taxData = await getTaxById(taxId);
            
            if (taxData) {
                setTaxDataCache(prev => ({ ...prev, [taxId]: taxData }));
            }
        } catch (error) {
            // Error fetching tax data
        } finally {
            setTaxLoadingCache(prev => ({ ...prev, [taxId]: false }));
        }
    }, [taxDataCache, taxLoadingCache]);

    // Function to fetch product data and update cart items with taxId and commissionAmount
    const updateCartItemsWithTaxId = React.useCallback(async () => {
        for (const cartItem of displayCartItems) {
            if (!(cartItem as any).taxId || !(cartItem as any).commissionAmount) {
                try {
                    // Fetch the product data from Firebase to get the taxId and commissionAmount
                    const productRef = ref(database, `/products/${cartItem.id}`);
                    const snapshot = await get(productRef);
                    
                    if (snapshot.exists()) {
                        const productData = snapshot.val();
                        
                        if (productData.taxId) {
                            // Update the cart item with taxId
                            (cartItem as any).taxId = productData.taxId;
                            
                            // Fetch tax data
                            fetchTaxData(productData.taxId);
                        }
                        
                        // Update commissionAmount if available
                        if (productData.commissionAmount !== undefined) {
                            (cartItem as any).commissionAmount = productData.commissionAmount;
                        }
                        
                        // Update rating if available, otherwise use default
                        (cartItem as any).rating = productData.rating || 4;
                    }
                } catch (error) {
                    // Error fetching product data
                }
            } else {
                fetchTaxData((cartItem as any).taxId);
            }
        }
    }, [displayCartItems, fetchTaxData]);

    // Fetch tax data for all products in cart
    React.useEffect(() => {
        updateCartItemsWithTaxId();
    }, [displayCartItems, updateCartItemsWithTaxId]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        country: 'India',
        city: '',
        streetAddress: '',
        state: '',
        zip: '',
    })

    // Helper function to show messages
    const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 5000) // Auto-hide after 5 seconds
    }


    // Update email when user changes
    React.useEffect(() => {
        if (user?.email) {
            // Email is handled separately, not in formData
        }
    }, [user?.email])

    const populateFormWithAddress = React.useCallback((address: Address) => {
        setFormData({
            firstName: address.firstName || '',
            lastName: address.lastName || '',
            phone: address.phone || '',
            country: address.country || 'India',
            city: address.city || '',
            streetAddress: address.streetAddress || '',
            state: address.state || '',
            zip: address.zip || '',
        })
        
        // Set dropdown states for editing
        setSelectedCountry(address.country || 'India')
        setSelectedState(address.state || '')
        
        // Find and set available states for the country
        const country = locationsData.countries.find(c => c.name === (address.country || 'India'))
        if (country) {
            setAvailableStates(country.states)
            // Find and set available cities for the state
            if (address.state) {
                const state = country.states.find(s => s.name === address.state)
                if (state) {
                    setAvailableCities(state.cities)
                }
            }
        }
        
    }, [])

    // Set default address when addresses load (only if not showing form)
    React.useEffect(() => {
        if (addresses.length > 0 && !selectedAddress && !showAddressForm) {
            const defaultAddr = getDefaultAddress()
            if (defaultAddr) {
                setSelectedAddress(defaultAddr)
                populateFormWithAddress(defaultAddr)
            }
        }
        // Removed automatic form display - now always show address list by default
    }, [addresses, selectedAddress, showAddressForm, addressLoading, user, getDefaultAddress, populateFormWithAddress])

    const handleAddressSelect = (address: Address) => {
        setSelectedAddress(address)
        populateFormWithAddress(address)
        setShowAddressForm(false)
        
        // Calculate shipping cost based on city and state
        const shippingCost = getShippingCostForCitySync(address.city, address.state, shippingData, address.country);
        setCurrentShippingCost(shippingCost);
    }

    const handleNewAddress = () => {
        setSelectedAddress(null)
        setFormData({
            firstName: '',
            lastName: '',
            phone: '',
            country: 'India',
            city: '',
            streetAddress: '',
            state: '',
            zip: '',
        })
        setShowAddressForm(true)
    }

    const handleEditAddress = (address: Address) => {
        setSelectedAddress(address)
        populateFormWithAddress(address)
        setShowAddressForm(true)
    }

    const handleSaveAddressOnly = async () => {
        if (!user) {
            showMessage('error', 'Please log in to save addresses')
            return
        }

        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.streetAddress || !formData.city || !formData.state || !formData.zip) {
            showMessage('error', 'Please fill in all required fields')
            return
        }

        try {
            // If we have a selected address, update it
            if (selectedAddress?.id) {
                const success = await editAddress(selectedAddress.id, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    country: formData.country,
                    city: formData.city,
                    streetAddress: formData.streetAddress,
                    state: formData.state,
                    zip: formData.zip,
                    addressName: `${formData.streetAddress}, ${formData.city}`
                });

                if (success) {
                    showMessage('success', 'Address updated successfully!')
                    setShowAddressForm(false)
                    await refreshAddresses() // Refresh the address list
                } else {
                    showMessage('error', 'Failed to update address. Please try again.')
                }
            } else {
                // Create new address
                const newAddressId = await addAddress({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    country: formData.country,
                    city: formData.city,
                    streetAddress: formData.streetAddress,
                    state: formData.state,
                    zip: formData.zip,
                    addressName: `${formData.streetAddress}, ${formData.city}`,
                    isDefault: addresses.length === 0
                });
                
                if (newAddressId) {
                    showMessage('success', 'Address saved successfully!')
                    setShowAddressForm(false)
                    
                    // Create a temporary address object to set as selected
                    const newAddress: Address = {
                        id: newAddressId,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        country: formData.country,
                        city: formData.city,
                        streetAddress: formData.streetAddress,
                        state: formData.state,
                        zip: formData.zip,
                        addressName: `${formData.streetAddress}, ${formData.city}`,
                        isDefault: addresses.length === 0
                    }
                    setSelectedAddress(newAddress)
                    await refreshAddresses() // Refresh the address list
                }
            }
        } catch (error) {
            // Error saving/updating address
            showMessage('error', `Failed to save/update address. Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    // Load shipping data on component mount
    React.useEffect(() => {
        const loadShippingData = async () => {
            try {
                const data = await getShippingRates();
                setShippingData(data);
                
                // If we have shipping data and a selected address, calculate shipping
                if (Object.keys(data).length > 0 && selectedAddress) {
                    const shippingCost = getShippingCostForCitySync(selectedAddress.city, selectedAddress.state, data, selectedAddress.country);
                    setCurrentShippingCost(shippingCost);
                }
            } catch (error) {
                // Error loading shipping data
                setCurrentShippingCost(50); // Set default if loading fails
            }
        };
        
        loadShippingData();
    }, [selectedAddress]);



    // Calculate total cart amount properly
    const calculatedTotalCart = displayCartItems.reduce((total, item) => {
        return total + (((item as any).salePrice ?? item.price) * item.quantity);
    }, 0);
    // Calculate total shipping cost (per product × number of products)
    const totalShippingCost = isFreeShippingApplied ? 0 : (currentShippingCost || 0) * displayCartItems.length;
    const finalAmount = calculatedTotalCart - discountAmount + totalShippingCost

    const handleApplyCoupon = async () => {
        setCouponError('')
        try {
            const record = await getCouponByCode(couponCode?.trim() || '');
            if (!record) {
                setCouponError('Invalid coupon code');
                setDiscountAmount(0);
                setAppliedCoupon(null);
                setIsFreeShippingApplied(false);
                return;
            }
            
            const { valid, reason, discount, isFreeShipping } = computeCouponDiscount(calculatedTotalCart, record);
            if (!valid) {
                setCouponError(reason || 'Coupon not applicable');
                setDiscountAmount(0);
                setAppliedCoupon(null);
                setIsFreeShippingApplied(false);
                return;
            }
            
            setDiscountAmount(discount);
            setIsFreeShippingApplied(isFreeShipping);
            setAppliedCoupon(record);
            
            if (isFreeShipping) {
                showMessage('success', `Free shipping applied! Code: ${record.code}`);
            } else {
                showMessage('success', `Coupon applied! You save ₹${discount}.00`);
            }
        } catch (e) {
            setCouponError('Failed to apply coupon');
            setDiscountAmount(0);
            setAppliedCoupon(null);
            setIsFreeShippingApplied(false);
        }
    }

    const handleClearCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setIsFreeShippingApplied(false);
        setCouponError('');
        setCouponCode('');
    }

    const handlePayment = (item: string) => {
        setActivePayment(item)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const newFormData = {
            ...formData,
            [e.target.id]: e.target.value
        };
        setFormData(newFormData);
        
        // If city or state is being changed, update shipping cost
        if ((e.target.id === 'city' || e.target.id === 'state') && newFormData.city && newFormData.state) {
            const shippingCost = getShippingCostForCitySync(newFormData.city, newFormData.state, shippingData, newFormData.country);
            setCurrentShippingCost(shippingCost);
        }
    }

    // Handle country selection
    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const countryName = e.target.value
        setSelectedCountry(countryName)
        setSelectedState('')
        setFormData(prev => ({
            ...prev,
            country: countryName,
            state: '',
            city: ''
        }))

        // Find and set available states for selected country
        const country = locationsData.countries.find(c => c.name === countryName)
        if (country) {
            setAvailableStates(country.states)
            setAvailableCities([])
        } else {
            setAvailableStates([])
            setAvailableCities([])
        }
    }

    // Handle state selection
    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const stateName = e.target.value
        setSelectedState(stateName)
        
        // Find cities from locations.json for the selected state
        const india = locationsData.countries.find(c => c.name === 'India')
        if (india) {
            const state = india.states.find(s => s.name === stateName)
            if (state) {
                setAvailableCities(state.cities)
                // Auto-select the first city
                const firstCity = state.cities[0]
                setFormData(prev => ({
                    ...prev,
                    state: stateName,
                    city: firstCity
                }))
                
                // Update shipping cost with first city
                if (firstCity && selectedCountry) {
                    const shippingCost = getShippingCostForCitySync(firstCity, stateName, shippingData, selectedCountry);
                    setCurrentShippingCost(shippingCost);
                }
            } else {
                setAvailableCities([])
                setFormData(prev => ({
                    ...prev,
                    state: stateName,
                    city: ''
                }))
            }
        } else {
            // Fallback to hardcoded states
            const state = availableStates.find(s => s.name === stateName)
            if (state) {
                setAvailableCities(state.cities)
                const firstCity = state.cities[0]
                setFormData(prev => ({
                    ...prev,
                    state: stateName,
                    city: firstCity
                }))
                
                // Update shipping cost with first city
                if (firstCity && selectedCountry) {
                    const shippingCost = getShippingCostForCitySync(firstCity, stateName, shippingData, selectedCountry);
                    setCurrentShippingCost(shippingCost);
                }
            } else {
                setAvailableCities([])
                setFormData(prev => ({
                    ...prev,
                    state: stateName,
                    city: ''
                }))
            }
        }
    }

    // Handle city selection
    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cityName = e.target.value
        setFormData(prev => ({
            ...prev,
            city: cityName
        }))

        // Update shipping cost when city changes
        if (cityName && selectedState) {
            const shippingCost = getShippingCostForCitySync(cityName, selectedState, shippingData, selectedCountry);
            setCurrentShippingCost(shippingCost);
        }
    }

    const createOrderData = (paymentMethod: 'razorpay' | 'cash-delivery', razorpayPaymentId?: string, razorpayOrderId?: string): Omit<Order, 'id' | 'createdAt' | 'updatedAt'> => {
        if (!user?.uid) {
            throw new Error('User must be logged in to create an order');
        }

        const orderId = razorpayOrderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Convert cart items to order items
        const orderItems: OrderItem[] = displayCartItems.map((item) => {
            const orderItem: any = {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            };

            // Only add optional properties if they have values
            if ((item as any).salePrice !== undefined && (item as any).salePrice !== null) {
                orderItem.salePrice = (item as any).salePrice;
            }
            
            if (item.selectedSize) {
                orderItem.selectedSize = item.selectedSize;
            }
            
            if (item.selectedColor) {
                orderItem.selectedColor = item.selectedColor;
            }
            
            if (item.thumbImage) {
                orderItem.thumbImage = item.thumbImage;
            }

            if ((item as any).commissionAmount !== undefined && (item as any).commissionAmount !== null) {
                orderItem.commissionAmount = (item as any).commissionAmount;
            }

            return orderItem;
        });

        // Calculate total commission from all items
        const totalCommission = orderItems.reduce((total, item) => {
            const itemCommission = item.commissionAmount || 0;
            return total + (itemCommission * item.quantity);
        }, 0);

        // Create order address from form data
        const orderAddress: OrderAddress = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            country: formData.country,
            city: formData.city,
            streetAddress: formData.streetAddress,
            state: formData.state,
            zip: formData.zip,
            addressName: `${formData.streetAddress}, ${formData.city}`
        };

        // Validate address data
        const requiredAddressFields = ['firstName', 'lastName', 'phone', 'country', 'city', 'streetAddress', 'state', 'zip'];
        const missingAddressFields = requiredAddressFields.filter(field => !orderAddress[field as keyof OrderAddress]);
        if (missingAddressFields.length > 0) {
            throw new Error(`Missing required address fields: ${missingAddressFields.join(', ')}`);
        }

        // Create order object with only defined values
        const orderData: any = {
            orderId,
            userId: user.uid,
            userEmail: user.email || '',
            items: orderItems,
            address: orderAddress,
            paymentMethod,
            paymentStatus: paymentMethod === 'razorpay' ? 'completed' : 'pending',
            orderStatus: 'pending',
            subtotal: calculatedTotalCart,
            discount: discountAmount,
            shipping: isFreeShippingApplied ? 0 : currentShippingCost,
            total: finalAmount,
            totalCommission: totalCommission
        };

        // Only add optional properties if they have values
        if (orderNote && orderNote.trim()) {
            orderData.orderNote = orderNote.trim();
        }
        
        if (appliedCoupon && appliedCoupon.code) {
            orderData.couponCode = appliedCoupon.code;
            orderData.couponType = appliedCoupon.type;
            if (isFreeShippingApplied) {
                orderData.freeShippingApplied = true;
            }
        }
        
        if (razorpayPaymentId) {
            orderData.razorpayPaymentId = razorpayPaymentId;
        }
        
        if (razorpayOrderId) {
            orderData.razorpayOrderId = razorpayOrderId;
        }

        // Validate that all required fields are present and not undefined
        
        // Check for any undefined values
        const undefinedKeys = Object.keys(orderData).filter(key => orderData[key] === undefined);
        if (undefinedKeys.length > 0) {
            throw new Error(`Order data contains undefined values: ${undefinedKeys.join(', ')}`);
        }

        return orderData;
    };

    // Create individual orders for each product
    const createIndividualOrders = async (paymentMethod: 'razorpay' | 'cash-delivery', razorpayPaymentId?: string, razorpayOrderId?: string): Promise<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>[]> => {
        if (!user?.uid) {
            throw new Error('User must be logged in to create an order');
        }

        // Generate a clean parent order ID
        const generateOrderId = () => {
            const timestamp = Date.now();
            const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
            return `ORD${timestamp.toString().slice(-8)}${randomPart}`;
        };
        
        const parentOrderId = razorpayOrderId || generateOrderId();
        
        // Debug: Log cart items to check vendor information
        console.log('Cart items in createIndividualOrders:', displayCartItems.map(item => ({
            name: item.name,
            vendor: item.vendor,
            id: item.id
        })));
        
        // Create order address from form data
        const orderAddress: OrderAddress = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            country: formData.country,
            city: formData.city,
            streetAddress: formData.streetAddress,
            state: formData.state,
            zip: formData.zip,
            addressName: `${formData.streetAddress}, ${formData.city}`
        };

        // Validate address data
        const requiredAddressFields = ['firstName', 'lastName', 'phone', 'country', 'city', 'streetAddress', 'state', 'zip'];
        const missingAddressFields = requiredAddressFields.filter(field => !orderAddress[field as keyof OrderAddress]);
        if (missingAddressFields.length > 0) {
            throw new Error(`Missing required address fields: ${missingAddressFields.join(', ')}`);
        }

        // Calculate per-product shipping cost
        // If free shipping is applied, per-product shipping is 0
        // Otherwise, calculate shipping per product (not per quantity)
        const perProductShipping = isFreeShippingApplied ? 0 : currentShippingCost;
        const totalItems = displayCartItems.reduce((sum, item) => sum + item.quantity, 0);
        const perItemDiscount = totalItems > 0 ? discountAmount / totalItems : 0;

        // Create individual orders for each cart item
        const individualOrders: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        
        for (let index = 0; index < displayCartItems.length; index++) {
            const item = displayCartItems[index];
            const actualPrice = (item as any).salePrice ?? item.price;
            const itemSubtotal = actualPrice * item.quantity;
            // Calculate shipping per product (not per quantity)
            // If customer has 2 products and shipping is ₹100 per product, total shipping = ₹200
            const itemShipping = perProductShipping;
            const itemDiscount = perItemDiscount * item.quantity;
            const itemTotal = itemSubtotal + itemShipping - itemDiscount;

            // Generate individual order ID - use parent order ID for single item, or append item number for multiple items
            const orderId = displayCartItems.length === 1 ? parentOrderId : `${parentOrderId}-${index + 1}`;

            // Fetch vendor information for this product
            let vendorInfo: Vendor | null = null;
            console.log('Processing product:', item.name, 'Vendor ID:', item.vendor);
            if (item.vendor) {
                try {
                    vendorInfo = await getVendorById(item.vendor);
                    console.log('Fetched vendor info:', vendorInfo);
                } catch (error) {
                    console.error('Error fetching vendor info for product:', item.id, error);
                }
            } else {
                console.log('No vendor ID found for product:', item.name);
            }

            // Convert single item to order item
            const orderItem: OrderItem = {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                ...(item.salePrice !== undefined && item.salePrice !== null && { salePrice: item.salePrice }),
                ...(item.selectedSize && { selectedSize: item.selectedSize }),
                ...(item.selectedColor && { selectedColor: item.selectedColor }),
                ...(item.thumbImage && { thumbImage: item.thumbImage }),
                ...(item.vendor && { vendor: item.vendor }),
                ...((item as any).commissionAmount !== undefined && (item as any).commissionAmount !== null && { commissionAmount: (item as any).commissionAmount }),
                ...(vendorInfo && { 
                    vendorName: vendorInfo.businessName || vendorInfo.storeName || vendorInfo.name,
                    vendorEmail: vendorInfo.email 
                })
            };

            // Calculate total commission for this individual order (single item)
            const itemTotalCommission = ((item as any).commissionAmount || 0) * item.quantity;

            const orderData: any = {
                orderId,
                parentOrderId,
                userId: user.uid,
                userEmail: user.email || '',
                items: [orderItem],
                address: orderAddress,
                paymentMethod,
                paymentStatus: paymentMethod === 'razorpay' ? 'completed' : 'pending',
                orderStatus: 'pending',
                subtotal: itemSubtotal,
                discount: itemDiscount,
                shipping: itemShipping,
                total: itemTotal,
                totalCommission: itemTotalCommission,
                // Add vendor information to the order
                ...(item.vendor && { vendor: item.vendor }),
                ...(vendorInfo && { 
                    vendorName: vendorInfo.businessName || vendorInfo.storeName || vendorInfo.name,
                    vendorEmail: vendorInfo.email 
                })
            };

            // Only add optional properties if they have values
            if (orderNote && orderNote.trim()) {
                orderData.orderNote = orderNote.trim();
            }
            
            if (appliedCoupon && appliedCoupon.code) {
                orderData.couponCode = appliedCoupon.code;
                orderData.couponType = appliedCoupon.type;
                if (isFreeShippingApplied) {
                    orderData.freeShippingApplied = true;
                }
            }
            
            if (razorpayPaymentId) {
                orderData.razorpayPaymentId = razorpayPaymentId;
            }
            
            if (razorpayOrderId) {
                orderData.razorpayOrderId = razorpayOrderId;
            }

            individualOrders.push(orderData);
        }

        return individualOrders;
    };

    const handleRazorpayPayment = async () => {
        if (!formData.firstName || !formData.lastName || !formData.phone) {
            showMessage('error', 'Please fill in all required address fields')
            return
        }

        const userDetails = {
            name: `${formData.firstName} ${formData.lastName}`,
            email: user?.email || '',
            contact: formData.phone
        }

        await initiatePayment(
            finalAmount,
            userDetails,
            async (response) => {
                
                // Show loading overlay immediately after payment success
                setIsPaymentProcessing(true)
                
                let individualOrders: any[] | null = null;
                try {
                    // Create individual orders for each product
                    individualOrders = await createIndividualOrders('razorpay', response.razorpay_payment_id, response.razorpay_order_id);
                    const parentOrderId = individualOrders[0]?.parentOrderId || response.razorpay_order_id;
                    const savedOrderIds = await saveIndividualOrders(parentOrderId, individualOrders);
                    
                    // Clear cart and redirect
                    clearCart()
                    router.push(`/payment/success?payment_id=${response.razorpay_payment_id}&order_id=${parentOrderId}&amount=${finalAmount}`)
                } catch (error) {
                    // Error saving order
                    showMessage('error', `Payment successful but failed to save order. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please contact support with order ID: ${response.razorpay_order_id}`);
                    clearCart()
                    router.push(`/payment/success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}&amount=${finalAmount}`)
                } finally {
                    // Hide loading overlay after navigation
                    setTimeout(() => {
                        setIsPaymentProcessing(false)
                    }, 1000)
                }
            },
            (error) => {
                // Payment failed
                router.push(`/payment/failure?error=${encodeURIComponent(error.error || 'Payment failed')}`)
            }
        )
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validate required fields before proceeding
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.streetAddress || !formData.city || !formData.state || !formData.zip) {
            showMessage('error', 'Please fill in all required address fields')
            return
        }

        // Save or update address if user wants to
        if (user && saveAddress && showAddressForm) {
            try {
                if (selectedAddress?.id) {
                    // Update existing address
                    const success = await editAddress(selectedAddress.id, {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        country: formData.country,
                        city: formData.city,
                        streetAddress: formData.streetAddress,
                        state: formData.state,
                        zip: formData.zip,
                        addressName: `${formData.streetAddress}, ${formData.city}`
                    });

                    if (!success) {
                        showMessage('error', 'Failed to update address. Please try again.')
                        return
                    }
                } else {
                    // Create new address
                    const newAddressId = await addAddress({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        country: formData.country,
                        city: formData.city,
                        streetAddress: formData.streetAddress,
                        state: formData.state,
                        zip: formData.zip,
                        addressName: `${formData.streetAddress}, ${formData.city}`,
                        isDefault: addresses.length === 0
                    });
                    
                    if (!newAddressId) {
                        showMessage('error', 'Failed to save address. Please try again.')
                        return
                    }

                    // Create a temporary address object to set as selected
                    const newAddress: Address = {
                        id: newAddressId,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        country: formData.country,
                        city: formData.city,
                        streetAddress: formData.streetAddress,
                        state: formData.state,
                        zip: formData.zip,
                        addressName: `${formData.streetAddress}, ${formData.city}`,
                        isDefault: addresses.length === 0
                    }
                    setSelectedAddress(newAddress)
                }

                // Refresh addresses and hide form
                await refreshAddresses()
                setShowAddressForm(false)
            } catch (error) {
                // Error saving/updating address
                showMessage('error', `Failed to save/update address. Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
                return
            }
        }
        
        if (activePayment === 'razorpay') {
            await handleRazorpayPayment()
        } else if (activePayment === 'cash-delivery') {
            // Handle COD
            setIsPaymentProcessing(true)
            let individualOrders: any[] | null = null;
            try {
                // Create individual orders for each product
                individualOrders = await createIndividualOrders('cash-delivery');
                const parentOrderId = individualOrders[0]?.parentOrderId;
                const savedOrderIds = await saveIndividualOrders(parentOrderId, individualOrders);
                
                showMessage('success', 'COD order placed successfully!')
                clearCart()
                
                // Calculate total amount for success page
                const totalAmount = individualOrders.reduce((sum, order) => sum + order.total, 0);
                
                // Navigate to success page with order details
                router.push(`/payment/success?order_id=${parentOrderId}&amount=${totalAmount}&payment_method=cod`)
            } catch (error) {
                // Error saving COD order
                showMessage('error', `Failed to save COD order. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
            } finally {
                // Hide loading overlay after navigation
                setTimeout(() => {
                    setIsPaymentProcessing(false)
                }, 1000)
            }
        } else {
            showMessage('info', 'This payment method is not yet implemented')
        }
    }

    // Redirect to login if user is not authenticated
    React.useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login');
        }
    }, [userLoading, user, router]);

    if (userLoading) {
    return (
        <>
            <div id="header" className='relative w-full'>
                    <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                    <MenuFurniture props="bg-white" />
                    <MenuCategory />
                    <Breadcrumb heading='Checkout' subHeading='Checkout' />
            </div>
            <div className="cart-block md:py-20 py-10">
                <div className="container">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                                <p className="text-secondary">Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    // Show loading if user is not authenticated (will redirect)
    if (!user) {
        return (
            <>
                <div id="header" className='relative w-full'>
                    <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                    <MenuFurniture props="bg-white" />
                    <MenuCategory />
                    <Breadcrumb heading='Checkout' subHeading='Checkout' />
                </div>
                <div className="cart-block md:py-20 py-10">
                    <div className="container">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                                <p className="text-secondary">Redirecting to login...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    return (
        <>
            <div id="header" className='relative w-full'>
                <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                <MenuFurniture props="bg-white" />
                <MenuCategory />
                <Breadcrumb heading='Checkout' subHeading='Checkout' />
            </div>
            
            <div className="cart-block md:py-20 py-10">
                <div className="container">
                            <div className="content-main flex justify-between max-xl:flex-col gap-y-8">
                        <div className="xl:w-2/3 xl:pr-3 w-full">
                            
                            {/* Message Display */}
                            {message && (
                                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
                                    message.type === 'success' ? 'bg-green text-white' :
                                    message.type === 'error' ? 'bg-red text-white' :
                                    'bg-blue text-white'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span>{message.text}</span>
                                        <button 
                                            onClick={() => setMessage(null)}
                                            className="ml-4 text-white hover:text-gray-200"
                                        >
                                            <Icon.X size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Address Section */}
                            <div className="address-section mt-5">
                                <div className="heading5">Choose Address</div>
                                
                                
                                
                                {/* Loading State */}
                                {userLoading ? (
                                    <div className="loading-addresses mt-4">
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                                                <p className="text-secondary text-sm">Loading...</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : user && addressLoading ? (
                                    <div className="loading-addresses mt-4">
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                                                <p className="text-secondary text-sm">Loading your addresses...</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : user && !addressLoading && addresses.length > 0 && !showAddressForm ? (
                                    /* Saved Addresses List */
                                    <div className="saved-addresses mt-4">
                                        <div className="addresses-list space-y-3">
                                            {addresses.map((address) => (
                                                <div 
                                                    key={address.id} 
                                                    className={`address-card p-4 border rounded-lg cursor-pointer transition-colors ${
                                                        selectedAddress?.id === address.id 
                                                            ? 'border-green bg-green/5' 
                                                            : 'border-line hover:border-green/50'
                                                    }`}
                                                    onClick={() => handleAddressSelect(address)}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <input
                                                                    type="radio"
                                                                    checked={selectedAddress?.id === address.id}
                                                                    onChange={() => handleAddressSelect(address)}
                                                                    className="text-green"
                                                                />
                                                                <span className="font-medium">{address.firstName} {address.lastName}</span>
                                                                {address.isDefault && (
                                                                    <span className="text-xs bg-green text-white px-2 py-1 rounded">Default</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-secondary">
                                                                <div>{address.streetAddress}, {address.city}, {address.state} {address.zip}</div>
                                                                <div className="mt-1">Phone: {address.phone}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Prevent address selection
                                                                        e.preventDefault(); // Prevent any form submission
                                                                        handleEditAddress(address);
                                                                    }}
                                                                    className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1"
                                                                    disabled={addressLoading}
                                                                >
                                                                    <Icon.PencilSimple size={14} />
                                                                    Edit
                                                                </button>
                                                                {!address.isDefault && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation(); // Prevent address selection
                                                                            try {
                                                                                const success = await makeDefault(address.id!);
                                                                                if (success) {
                                                                                    showMessage('success', 'Address set as default');
                                                                                } else {
                                                                                    showMessage('error', 'Failed to set as default. Please try again.');
                                                                                }
                                                                            } catch (error) {
                                                                                // Error setting default address
                                                                                showMessage('error', 'Failed to set as default. Please try again.');
                                                                            }
                                                                        }}
                                                                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                                                                        disabled={addressLoading}
                                                                    >
                                                                        Set as Default
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Add New Address Button */}
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                onClick={handleNewAddress}
                                                className="w-full bg-green text-white py-3 px-4 rounded-lg font-medium hover:bg-green/90 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Icon.Plus size={20} />
                                                Add New Address
                                            </button>
                                        </div>
                                    </div>
                                ) : user && !addressLoading && addresses.length === 0 && !showAddressForm ? (
                                    /* No addresses - show empty state with add button */
                                    <div className="no-addresses mt-4">
                                        <div className="text-center py-8">
                                            <div className="text-secondary mb-4">No saved addresses found.</div>
                                            <button
                                                type="button"
                                                onClick={handleNewAddress}
                                                className="w-full bg-green text-white py-3 px-4 rounded-lg font-medium hover:bg-green/90 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Icon.Plus size={20} />
                                                Add Your First Address
                                            </button>
                                        </div>
                                    </div>
                                ) : user && !addressLoading && showAddressForm ? (
                                    /* Address Form - shown when creating new address or editing */
                                    <div className="new-address mt-4">
                                        {addresses.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAddressForm(false)}
                                                className="mb-4 text-green hover:underline text-sm"
                                            >
                                                ← Back to saved addresses
                                            </button>
                                        )}
                                        
                                        {addresses.length === 0 && (
                                            <p className="text-secondary text-sm mb-4">Please add your address below.</p>
                                        )}
                                        
                                        {/* Address Form */}
                                        <div className="address-form">
                                            <div className="grid sm:grid-cols-2 gap-4 gap-y-5 flex-wrap">
                                                <div className="">
                                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                                        First Name *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg" 
                                                        id="firstName" 
                                                        type="text" 
                                                        placeholder="Enter your first name" 
                                                        value={formData.firstName}
                                                        onChange={handleInputChange}
                                                        required 
                                                    />
                                                </div>
                                                <div className="">
                                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Last Name *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg" 
                                                        id="lastName" 
                                                        type="text" 
                                                        placeholder="Enter your last name" 
                                                        value={formData.lastName}
                                                        onChange={handleInputChange}
                                                        required 
                                                    />
                                                </div>
                                                <div className="">
                                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Phone Number *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg" 
                                                        id="phone" 
                                                        type="tel" 
                                                        placeholder="Enter your phone number" 
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        required 
                                                    />
                                                </div>
                                                <div className="col-span-full">
                                                    <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Full Address *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg" 
                                                        id="streetAddress" 
                                                        type="text" 
                                                        placeholder="Street, Area, Landmark" 
                                                        value={formData.streetAddress}
                                                        onChange={handleInputChange}
                                                        required 
                                                    />
                                                </div>
                                                <div className="">
                                                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Country *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg bg-gray-100" 
                                                        id="country" 
                                                        name="country"
                                                        value="India"
                                                        readOnly
                                                        disabled
                                                    />
                                                </div>
                                                <div className="select-block">
                                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                                                        State *
                                                    </label>
                                                    <select 
                                                        className="border border-line px-4 py-3 w-full rounded-lg bg-white" 
                                                        id="state" 
                                                        name="state" 
                                                        value={selectedState}
                                                        onChange={handleStateChange}
                                                        required
                                                        disabled={availableStates.length === 0}
                                                    >
                                                        <option value="">Select State (Debug: {availableStates.length} states)</option>
                                                        {availableStates.map((state) => (
                                                            <option key={state.code} value={state.name}>
                                                                {state.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <Icon.CaretDown className='arrow-down' />
                                                </div>
                                                <div className="">
                                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                                        City *
                                                    </label>
                                                    <select 
                                                        className="border-line px-4 py-3 w-full rounded-lg bg-white" 
                                                        id="city" 
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleCityChange}
                                                        required 
                                                        disabled={availableCities.length === 0}
                                                    >
                                                        <option value="">Select City ({availableCities.length} cities available)</option>
                                                        {availableCities.map((city) => (
                                                            <option key={city} value={city}>
                                                                {city}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="">
                                                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                                                        PIN Code *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg" 
                                                        id="zip" 
                                                        type="text" 
                                                        placeholder="Enter PIN code" 
                                                        value={formData.zip}
                                                        onChange={handleInputChange}
                                                        required 
                                                    />
                                                </div>
                                                
                                                {/* Save Address Checkbox and Button */}
                                                {user && (
                                                    <div className="col-span-full space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="checkbox" 
                                                                id="saveAddress" 
                                                                checked={saveAddress}
                                                                onChange={(e) => setSaveAddress(e.target.checked)}
                                                            />
                                                            <label htmlFor="saveAddress" className="text-sm text-secondary">
                                                                Save this address for future orders
                                                            </label>
                                                        </div>
                                                        {saveAddress && (
                                                            <button
                                                                type="button"
                                                                onClick={handleSaveAddressOnly}
                                                                className="button-main bg-white text-black border border-black w-full text-center"
                                                                disabled={addressLoading}
                                                            >
                                                                {addressLoading ? 'Saving...' : 'Save Address'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                                                            </div>
                            
                            {/* Coupon Section */}
                            <div className="coupon-section mt-6">
                                <div className="heading5">Coupon Code</div>
                                <div className="coupon-input-block mt-4">
                                    <div className="flex gap-2">
                                        <input 
                                            value={couponCode || ''} 
                                            onChange={(e) => setCouponCode(e.target.value)} 
                                            type="text" 
                                            placeholder="Enter coupon code" 
                                            className="flex-1 h-12 bg-surface pl-4 pr-4 rounded-lg border border-line" 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleApplyCoupon} 
                                            className="button-main h-12 px-5 rounded-lg flex items-center justify-center bg-green text-black"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    {couponError && (
                                        <div className="caption1 text-red mt-2">{couponError}</div>
                                    )}
                                    {appliedCoupon && !couponError && (
                                        <div className="caption1 text-black mt-2 flex items-center gap-3">
                                            <span>
                                                {isFreeShippingApplied ? (
                                                    <>Free shipping coupon <strong>{appliedCoupon.code}</strong> applied</>
                                                ) : (
                                                    <>Coupon <strong>{appliedCoupon.code}</strong> applied. You save ₹{discountAmount}.00</>
                                                )}
                                            </span>
                                            <button 
                                                type="button" 
                                                onClick={handleClearCoupon} 
                                                className="underline text-red"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Order Notes Section */}
                            <div className="order-notes mt-6">
                                <div className="heading5">Order Notes (Optional)</div>
                                <div className="mt-4">
                                    <textarea 
                                        className="border border-line px-4 py-3 w-full rounded-lg" 
                                        placeholder="Any special instructions for your order..."
                                        value={orderNote}
                                        onChange={(e) => setOrderNote(e.target.value)}
                                        rows={3}
                                    ></textarea>
                                                            </div>
                                                        </div>
                            
                            {/* Payment Section */}
                            <form onSubmit={handleFormSubmit}>
                                <div className="payment-block mt-8">
                                    <div className="heading5">Choose Payment Option:</div>
                                    <div className="list-payment mt-5">
                                        <div className={`type bg-surface p-5 border border-line rounded-lg ${activePayment === 'razorpay' ? 'open' : ''}`}>
                                            <input className="cursor-pointer" type="radio" id="razorpay" name="payment" checked={activePayment === 'razorpay'} onChange={() => handlePayment('razorpay')} />
                                            <label className="text-button pl-2 cursor-pointer" htmlFor="razorpay">Razorpay (UPI, Cards, Wallets, NetBanking)</label>
                                            <div className="infor">
                                                <div className="text-on-surface-variant1 pt-4">Pay securely using Razorpay. Supports UPI, Credit/Debit Cards, Net Banking, and Digital Wallets. Your payment is processed securely.</div>
                                                {error && (
                                                    <div className="text-red mt-2 text-sm">{error}</div>
                                                )}
                                                        </div>
                                                    </div>
                                                <div className={`type bg-surface p-5 border border-line rounded-lg mt-5 ${activePayment === 'cash-delivery' ? 'open' : ''}`}>
                                                    <input className="cursor-pointer" type="radio" id="delivery" name="payment" checked={activePayment === 'cash-delivery'} onChange={() => handlePayment('cash-delivery')} />
                                            <label className="text-button pl-2 cursor-pointer" htmlFor="delivery">Cash on Delivery (COD)</label>
                                                    <div className="infor">
                                                <div className="text-on-surface-variant1 pt-4">Pay with cash when your order is delivered to your doorstep. No advance payment required.</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                
                                        <div className="block-button md:mt-10 mt-6">
                                    <button 
                                        type="submit" 
                                        className="w-full bg-green text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Processing...' : activePayment === 'razorpay' ? 'Proceed to Pay' : 'Place Order'}
                                    </button>
                                        </div>
                                    </form>

                            </div>

                        {/* Order Summary */}
                        <div className="xl:w-1/3 xl:pl-12 w-full">
                            <div className="checkout-block bg-surface p-6 rounded-2xl">
                                <div className="heading5 pb-3">
                                    {buyNow === 'true' ? 'Buy Now - Your Order' : 'Your Order'}
                                </div>
                                {buyNow === 'true' && (
                                    <div className="text-sm text-green mb-3 p-2 bg-green/10 rounded-lg">
                                        ⚡ Quick Buy: You&apos;re purchasing this item immediately
                                    </div>
                                )}
                                <div className="list-product-checkout">
                                    {displayCartItems.length < 1 ? (
                                        <p className='text-button pt-3'>No product in cart</p>
                                    ) : (
                                        displayCartItems.map((product) => (
                                            <div key={product.id} className="item flex items-center justify-between w-full pb-5 border-b border-line gap-6 mt-5">
                                                    <div className="bg-img w-[100px] aspect-square flex-shrink-0 rounded-lg overflow-hidden">
                                                        <Image
                                                        src={product.thumbImage && product.thumbImage[0] || '/images/product/default.png'}
                                                            width={500}
                                                            height={500}
                                                            alt='img'
                                                            className='w-full h-full'
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between w-full">
                                                        <div>
                                                            <div className="name text-title">{product.name}</div>
                                                            {(product as any).rating && (
                                                                <div className="flex items-center mt-1">
                                                                    <div className="flex items-center">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <span
                                                                                key={i}
                                                                                className={`text-sm ${i < (product as any).rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                            >
                                                                                ★
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    <span className="caption1 text-secondary ml-2">
                                                                        ({(product as any).rating}/5)
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {(product.selectedSize || (product.sizes && product.sizes[0]) || product.selectedColor || (product.variation && product.variation[0] && product.variation[0].color)) && (
                                                                <div className="caption1 text-secondary mt-2">
                                                                    {(product.selectedSize || (product.sizes && product.sizes[0])) && <span className='size capitalize'>{product.selectedSize || (product.sizes && product.sizes[0])}</span>}
                                                                    {(product.selectedSize || (product.sizes && product.sizes[0])) && (product.selectedColor || (product.variation && product.variation[0] && product.variation[0].color)) && <span>/</span>}
                                                                    {(product.selectedColor || (product.variation && product.variation[0] && product.variation[0].color)) && <span className='color capitalize'>{product.selectedColor || (product.variation && product.variation[0] && product.variation[0].color)}</span>}
                                                                </div>
                                                            )}
                                                            {(product as any).taxId && (
                                                                <div className="mt-1">
                                                                    {taxLoadingCache[(product as any).taxId] ? (
                                                                        <span className='caption1 text-secondary'>Loading GST...</span>
                                                                    ) : taxDataCache[(product as any).taxId] ? (
                                                                        <span className='caption1 text-secondary'>
                                                                            Price includes {taxDataCache[(product as any).taxId].rate}% GST
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-title">
                                                            <span className='quantity'>{product.quantity}</span>
                                                            <span className='px-1'>x</span>
                                                            <span>
                                                                ₹{((product as any).salePrice ?? product.price)}.00
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                        ))
                                    )}
                                </div>
                                <div className="discount-block py-5 flex justify-between border-b border-line">
                                    <div className="text-title">
                                        Discounts
                                        {appliedCoupon && (
                                            <div className="text-xs text-green mt-1">Code: {appliedCoupon.code}</div>
                                        )}
                                    </div>
                                    <div className="text-title">-₹<span className="discount">{discountAmount}</span><span>.00</span></div>
                                </div>
                                <div className="ship-block py-5 flex justify-between border-b border-line">
                                    <div className="text-title">Shipping</div>
                                    <div className="text-title">
                                        {isFreeShippingApplied ? (
                                            <>
                                                <span className="text-green">Free</span>
                                                {appliedCoupon && (
                                                    <div className="text-xs text-green mt-1">
                                                        Applied: {appliedCoupon.code}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {!totalShippingCost || totalShippingCost === 0 ? 'Free' : `₹${totalShippingCost}.00`}
                                                {selectedAddress && (
                                                    <div className="text-xs text-secondary mt-1">
                                                        to {selectedAddress.city}, {selectedAddress.state}
                                                        
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="total-cart-block pt-5 flex justify-between">
                                    <div className="heading5">Total</div>
                                    <div className="heading5 total-cart">₹{finalAmount}.00</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            
            {/* Payment Processing Overlay */}
            {isPaymentProcessing && (
                <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center shadow-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Please wait...</h3>
                        <p className="text-gray-600 text-sm">Processing your order and redirecting you to the success page</p>
                    </div>
                </div>
            )}
        </>
    )
}

export default Checkout
