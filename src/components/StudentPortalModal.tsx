import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  ShoppingBag,
  Mic,
  QrCode,
  Clock,
  Sparkles,
  CheckCircle2,
  Building2,
  Tag,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Smartphone,
  ArrowRight,
  RotateCcw,
  Home,
  Utensils,
  Receipt,
  User,
  Bell,
  AlertCircle,
  Ban,
  LogOut,
  SlidersHorizontal,
  Check,
  Volume2,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface StudentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FoodItem {
  id: string;
  name: string;
  counter: 'Counter A' | 'Counter B' | 'Counter C' | 'Counter D';
  counterName: string;
  price: number;
  prepTime: string;
  rating: number;
  category: string;
  image: string;
  description: string;
  popular?: boolean;
}

type OrderStatus = 'Order Received' | 'Preparing' | 'Ready' | 'Collected' | 'Cancelled';

interface ActiveOrder {
  orderId: string;
  counter: string;
  lockerNumber: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  qrCode: string;
  status: OrderStatus;
  createdAt: number;
  timeRemaining: string;
  queuePosition: number;
  role: 'student' | 'faculty' | 'guest';
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'announcement' | 'order' | 'offer';
  read: boolean;
}


export const StudentPortalModal: React.FC<StudentPortalModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { profile, refreshProfile } = useAuth();
  const [institutionName, setInstitutionName] = useState<string>('');
  const [institutionCode, setInstitutionCode] = useState<string>('');
  const [campus, setCampus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'orders' | 'profile' | 'notifications'>('home');
  
  // Menu Filters
  const [selectedCounter, setSelectedCounter] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<{ item: FoodItem; quantity: number }[]>([]);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet' | 'netbanking'>('upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Active Order State
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);

  // Past Orders History
  const [orderHistory, setOrderHistory] = useState<ActiveOrder[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Data Fetching
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [{ data: menu }, { data: orders }, { data: notifs }] = await Promise.all([
          supabase.from('menu_items').select('*'),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('notifications').select('*').order('created_at', { ascending: false })
        ]);
        
        if (menu) {
          setMenuItems(menu.map((m: any) => ({
            id: m.id,
            name: m.name,
            counter: m.counter,
            counterName: m.counter_name || m.counter,
            price: m.price,
            prepTime: m.prep_time || '5 mins',
            rating: m.rating || 4.5,
            category: m.category,
            description: m.description,
            image: m.image_url,
            popular: m.popular || false
          })));
        }
        
        if (orders) {
          const parsedOrders = orders.map((o: any) => ({
            orderId: o.order_id || o.id,
            counter: o.counter,
            lockerNumber: o.locker_number,
            items: o.items || [],
            total: o.total_amount,
            qrCode: o.qr_code,
            status: o.status,
            createdAt: new Date(o.created_at).getTime(),
            timeRemaining: '5 mins',
            queuePosition: 2
          }));
          
          const active = parsedOrders.filter((o: any) => o.status !== 'Collected' && o.status !== 'Cancelled');
          const past = parsedOrders.filter((o: any) => o.status === 'Collected' || o.status === 'Cancelled');
          
          setActiveOrder(active.length > 0 ? active[0] : null);
          setOrderHistory(past);
        }
        
        if (notifs) {
          setNotifications(notifs.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleTimeString(),
            type: n.type || 'announcement',
            read: n.read || false
          })));
        }
      } catch (err) {
        console.error('Error fetching portal data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, [isOpen]);

  // Cancellation Timer calculation
  const [secondsSinceOrder, setSecondsSinceOrder] = useState<number>(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeOrder && activeOrder.status === 'Order Received') {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - activeOrder.createdAt) / 1000);
        setSecondsSinceOrder(diff);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [activeOrder]);

  // LX AI Voice Command state
  const [lxMessage, setLxMessage] = useState<string>('');
  const [isLxVoiceActive, setIsLxVoiceActive] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      refreshProfile();
    }
  }, [isOpen, refreshProfile]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchInstitution = async () => {
      if (!profile?.institution_id) return;
      const { data, error } = await supabase
        .from('institutions')
        .select('institution_name, institution_code, campus, city, state')
        .eq('id', profile.institution_id)
        .single();
      if (!error && data) {
        setInstitutionName(data.institution_name || '');
        setInstitutionCode(data.institution_code || '');
        setCampus(data.campus || '');
      }
    };
    fetchInstitution();
  }, [isOpen, profile?.institution_id]);

  if (!isOpen) return null;

  // Filtered Food items
  const filteredItems = menuItems.filter((item) => {
    const matchesCounter = selectedCounter === 'ALL' || item.counter === selectedCounter;
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.counter.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCounter && matchesCategory && matchesSearch;
  });

  const addToCart = (food: FoodItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === food.id);
      if (existing) {
        return prev.map((c) => (c.item.id === food.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item: food, quantity: 1 }];
    });
  };

  const removeFromCart = (foodId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== foodId));
  };

  const updateQuantity = (foodId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === foodId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as { item: FoodItem; quantity: number }[]
    );
  };

  const cartTotal = cart.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);

  const handleRazorpayPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(async () => {
      const randomOrderId = 'FDX-' + Math.floor(100000 + Math.random() * 900000);
      const firstCounter = cart[0]?.item.counter || 'Counter B';
      const lockerNum = Math.floor(1 + Math.random() * 12);
      const orderRole = profile?.role || 'student';

      const newOrderData = {
        order_id: randomOrderId,
        counter: firstCounter,
        locker_number: `Locker #${lockerNum < 10 ? '0' + lockerNum : lockerNum}`,
        items: cart.map((c) => ({ name: c.item.name, quantity: c.quantity, price: c.item.price })),
        total_amount: cartTotal,
        qr_code: `FOODEXA-${randomOrderId}-${institutionCode}`,
        status: 'Order Received',
        role: orderRole,
      };

      try {
        await supabase.from('orders').insert([newOrderData]);
        
        const newOrder: ActiveOrder = {
          orderId: newOrderData.order_id,
          counter: newOrderData.counter,
          lockerNumber: newOrderData.locker_number,
          items: newOrderData.items,
          total: newOrderData.total_amount,
          qrCode: newOrderData.qr_code,
          status: newOrderData.status as OrderStatus,
          createdAt: Date.now(),
          timeRemaining: '7 mins',
          queuePosition: 3,
          role: orderRole,
        };

        setActiveOrder(newOrder);
        setSecondsSinceOrder(0);
        setCart([]);
        setActiveTab('orders');

        // Add Notification locally (could also insert to DB)
        setNotifications((prev) => [
          {
            id: 'n-' + Date.now(),
            title: `Order #${randomOrderId} Placed`,
            message: `Your payment of ₹${cartTotal} was verified by Razorpay. Sent to ${firstCounter}.`,
            time: 'Just now',
            type: 'order',
            read: false,
          },
          ...prev,
        ]);
      } catch (err) {
        console.error("Payment sync to DB failed", err);
        alert('Failed to process order. Please try again.');
      } finally {
        setIsProcessingPayment(false);
        setIsRazorpayModalOpen(false);
      }
    }, 1600);
  };

  const handleCancelOrder = async () => {
    if (!activeOrder) return;

    const secondsPassed = (Date.now() - activeOrder.createdAt) / 1000;
    if (secondsPassed > 10) {
      alert('Your order is now being prepared and can no longer be cancelled.');
      return;
    }

    try {
      await supabase
        .from('orders')
        .update({ status: 'Cancelled' })
        .eq('order_id', activeOrder.orderId);

      const cancelledOrder = { ...activeOrder, status: 'Cancelled' as OrderStatus };
      setOrderHistory((prev) => [cancelledOrder, ...prev]);
      setActiveOrder(null);

      setNotifications((prev) => [
        {
          id: 'n-' + Date.now(),
          title: `Order #${cancelledOrder.orderId} Cancelled`,
          message: `Refund of ₹${cancelledOrder.total} initiated back to your original payment method.`,
          time: 'Just now',
          type: 'order',
          read: false,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Cancellation failed", err);
      alert("Failed to cancel order.");
    }
  };

  const handleLxVoiceCommand = (cmd: string) => {
    setIsLxVoiceActive(true);
    setLxMessage(`Student: "${cmd}"`);

    setTimeout(() => {
      if (cmd.toLowerCase().includes('biryani') && menuItems.length > 0) {
        addToCart(menuItems[0]);
        setLxMessage(`LX AI: "Added ${menuItems[0].name} to your cart."`);
      } else if (cmd.toLowerCase().includes('burger') && menuItems.length > 3) {
        addToCart(menuItems[3]);
        setLxMessage(`LX AI: "Added ${menuItems[3].name} to your cart."`);
      } else if (menuItems.length > 0) {
        addToCart(menuItems[0]);
        setLxMessage(`LX AI: "Found recommendation and added it to your order!"`);
      }
      setIsLxVoiceActive(false);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[94vh]">
        
        {/* TOP BAR: Institution Identity */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
<div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-extrabold text-lg shadow-lg">
                  FX
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white tracking-tight">
                      {institutionName || 'Institution'}
                    </h3>
                    {institutionCode && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800 font-mono font-bold">
                        Code: {institutionCode}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Logged in as <span className="text-slate-200 font-semibold">{profile?.full_name || 'User'}</span> ({profile?.email || ''})
                    <span className={`ml-1 font-bold ${profile?.role === 'student' ? 'text-emerald-400' : profile?.role === 'faculty' ? 'text-blue-400' : 'text-amber-400'}`}>
                      {profile?.role ? ` • ${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}` : ''}
                    </span>
                  </p>
                </div>
              </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Campus Live</span>
            </span>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS BAR */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center space-x-1 sm:space-x-2 py-2">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'menu', label: 'Menu & Counters', icon: Utensils },
              { id: 'orders', label: 'Orders & Tracking', icon: Receipt, badge: activeOrder ? '1 Active' : undefined },
              { id: 'notifications', label: 'Announcements', icon: Bell, badge: notifications.filter((n) => !n.read).length ? `${notifications.filter((n) => !n.read).length}` : undefined },
              { id: 'profile', label: 'Student Profile', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-0.5 text-[9px] bg-emerald-500 text-slate-950 font-mono font-extrabold px-1.5 py-0.2 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Cart Pill */}
          <button
            onClick={() => setActiveTab('menu')}
            className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-xs px-3 py-1.5 rounded-xl text-slate-200 cursor-pointer transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
            <span className="font-mono text-emerald-400 font-bold">₹{cartTotal}</span>
          </button>
        </div>

        {/* TAB BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              
              {/* Campus Offer Hero Banner */}
              <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 p-6 overflow-hidden shadow-xl">
                <div className="relative z-10 max-w-xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    <Tag className="w-3 h-3 text-emerald-400" />
                    EXCLUSIVE CAMPUS ANNOUNCEMENT
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Exam Special: 20% OFF at Counter B Fast Food
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Order loaded fries, artisan pizza slices, and burgers with express 5-minute QR locker pickup. Use code <strong className="text-white font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">EXAM20</strong>
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedCounter('Counter B');
                        setActiveTab('menu');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Explore Counter B</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                    </button>
                  </div>
                </div>
              </div>

              {/* LX AI Voice Command Banner */}
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                      <Mic className={`w-5 h-5 ${isLxVoiceActive ? 'animate-pulse text-emerald-400' : ''}`} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>LX Voice Assistant (Powered by Gemini)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">Order by voice directly for Counter A, B, C or D</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLxVoiceCommand('Order one Special Chicken Biryani from Counter A')}
                      className="text-[10px] bg-slate-900 border border-slate-800 hover:border-emerald-500/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      "Order Chicken Biryani"
                    </button>
                    <button
                      onClick={() => handleLxVoiceCommand('Order Veg Burger from Counter B')}
                      className="text-[10px] bg-slate-900 border border-slate-800 hover:border-emerald-500/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      "Order Veg Burger"
                    </button>
                  </div>
                </div>

                {lxMessage && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300">
                    {lxMessage}
                  </div>
                )}
              </div>

              {/* CAMPUS COUNTERS OVERVIEW */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Campus Dining Counters</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    View All Items →
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[...new Set(menuItems.map((m) => m.counter))].map((counter) => (
                    <div
                      key={counter}
                      onClick={() => {
                        setSelectedCounter(counter);
                        setActiveTab('menu');
                      }}
                      className="bg-slate-950 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-2xl hover:bg-slate-900/80 transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-400">{counter}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-300">{menuItems.filter((m) => m.counter === counter).length} items available</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECOMMENDED MEALS GRID */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">Recommended for Your Campus Break</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {menuItems.slice(0, 3).map((food) => (
                    <div
                      key={food.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="relative h-32 rounded-xl overflow-hidden bg-slate-900">
                          <img
                            src={food.image}
                            alt={food.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                            {food.counter}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">{food.name}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{food.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                        <span className="text-xs font-bold text-emerald-400 font-mono">₹{food.price}</span>
                        <button
                          onClick={() => addToCart(food)}
                          className="px-3 py-1 rounded-xl bg-emerald-400 text-slate-950 text-xs font-bold hover:bg-emerald-300 transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MENU & COUNTERS */}
          {activeTab === 'menu' && (
            <div className="grid lg:grid-cols-12 gap-6">
              
              {/* LEFT 8 COLS: Food Filter, Search & Grid */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Search & Counter Tabs */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Biryani, Burger, Chai, Dosa..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* Counter Filter Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {[{ id: 'ALL', label: 'All Campus Items' }, ...Array.from(new Set(menuItems.map(m => m.counter))).map(c => ({ id: c, label: c }))].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedCounter(tab.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          selectedCounter === tab.id
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FOOD ITEMS GRID */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredItems.map((food) => (
                    <div
                      key={food.id}
                      className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 space-y-3 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="relative h-32 rounded-xl overflow-hidden bg-slate-900">
                          <img
                            src={food.image}
                            alt={food.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                            {food.counter}
                          </span>
                          <span className="absolute top-2 right-2 bg-slate-950/85 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ★ {food.rating}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {food.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{food.description}</p>
                          <p className="text-[10px] text-emerald-400 font-mono mt-1">Ready in ~{food.prepTime}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                        <span className="text-sm font-bold text-emerald-400 font-mono">₹{food.price}</span>
                        <button
                          onClick={() => addToCart(food)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-400 hover:text-slate-950 border border-slate-800 hover:border-emerald-400 text-xs font-bold text-white transition-all cursor-pointer"
                        >
                          + Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* RIGHT 4 COLS: Order Cart Sidebar */}
              <div className="lg:col-span-4 bg-slate-950/60 p-4 rounded-3xl border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span>Your Order Cart</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {cart.reduce((a, b) => a + b.quantity, 0)} Items
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs text-slate-400">Cart is empty.</p>
                    <p className="text-[11px] text-slate-400">Select items from any counter above.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {cart.map(({ item, quantity }) => (
                        <div
                          key={item.id}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <h5 className="font-bold text-white text-[11px]">{item.name}</h5>
                            <p className="text-[10px] text-slate-400 font-mono">{item.counter} • ₹{item.price}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="px-2 py-0.5 text-slate-400 hover:text-white cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2 text-[11px] font-bold text-emerald-400 font-mono">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="px-2 py-0.5 text-slate-400 hover:text-white cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Items Subtotal</span>
                        <span>₹{cartTotal}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Campus Locker & Tech Fee</span>
                        <span className="text-emerald-400 font-mono">₹0 (Free)</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                        <span>Total Amount</span>
                        <span className="text-emerald-400 font-mono">₹{cartTotal}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsRazorpayModalOpen(true)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      <span>Pay ₹{cartTotal} via Razorpay</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: ORDERS & LIVE TRACKING */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              
              {/* ACTIVE ORDER LIVE TRACKING CARD */}
              {activeOrder ? (
                <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-6">
                  
                  {/* Top Bar Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                      <h3 className="text-sm font-extrabold text-white">Live Campus Order Tracking</h3>
                      <span className="text-xs bg-slate-900 text-emerald-400 font-mono px-2.5 py-0.5 rounded-full border border-slate-800 font-bold">
                        ID: {activeOrder.orderId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">
                        Pickup: <strong className="text-white">{activeOrder.counter}</strong> ({activeOrder.lockerNumber})
                      </span>
                    </div>
                  </div>

                  {/* PROGRESS TIMELINE (Received -> Preparing -> Ready -> Collected) */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {[
                        { label: 'Order Received', step: 'Order Received' },
                        { label: 'Preparing', step: 'Preparing' },
                        { label: 'Ready at Locker', step: 'Ready' },
                        { label: 'Collected', step: 'Collected' },
                      ].map((st, idx) => {
                        const statuses = ['Order Received', 'Preparing', 'Ready', 'Collected'];
                        const currentIdx = statuses.indexOf(activeOrder.status);
                        const isDone = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div key={st.step} className="space-y-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isDone
                                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                                  : 'bg-slate-800'
                              }`}
                            />
                            <span
                              className={`text-[11px] font-bold block ${
                                isCurrent
                                  ? 'text-emerald-400 font-mono'
                                  : isDone
                                  ? 'text-slate-200'
                                  : 'text-slate-500'
                              }`}
                            >
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* QR PICKUP LOCKER DISPLAY & TIMINGS */}
                  <div className="grid sm:grid-cols-12 gap-6 bg-slate-950 p-5 rounded-2xl border border-slate-800 items-center">
                    
                    {/* QR Code Graphic */}
                    <div className="sm:col-span-4 text-center space-y-2">
                      <div className="w-32 h-32 mx-auto bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center">
                        <div className="w-full h-full border-2 border-slate-900 p-1 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white">
                          <QrCode className="w-20 h-20 text-emerald-400" />
                          <span className="text-[9px] font-mono text-slate-300 mt-1">SCAN AT LOCKER</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">Present this QR Code at Locker Pod</p>
                    </div>

                    {/* Order Info & Cancellation Notice */}
                    <div className="sm:col-span-8 space-y-3">
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 block">Assigned Pickup Point:</span>
                        <h4 className="text-lg font-extrabold text-white flex items-center gap-2">
                          <span>{activeOrder.counter}</span>
                          <span className="text-emerald-400 font-mono">{activeOrder.lockerNumber}</span>
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs font-mono">
                        <div>
                          <span className="text-slate-400 block">Est. Time Remaining:</span>
                          <span className="text-amber-400 font-bold text-sm flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5" /> {activeOrder.timeRemaining}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Queue Ahead:</span>
                          <span className="text-white font-bold text-sm mt-0.5 block">
                            {activeOrder.queuePosition} Student Orders
                          </span>
                        </div>
                      </div>

                      {/* 10-SECOND CANCELLATION LOGIC DISPLAY */}
                      {activeOrder.status === 'Order Received' ? (
                        <div className="pt-2">
                          {secondsSinceOrder <= 10 ? (
                            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 space-y-2">
                              <div className="flex items-center justify-between text-xs text-amber-300">
                                <span>You can cancel this order within 10 seconds of placing it:</span>
                                <span className="font-mono font-bold text-amber-400">{10 - secondsSinceOrder}s remaining</span>
                              </div>
                              <button
                                onClick={handleCancelOrder}
                                className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Cancel Order & Refund</span>
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Your order is now being prepared in the kitchen and can no longer be cancelled.</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Order in progress ({activeOrder.status}). Kitchen is actively processing your meal.</span>
                        </div>
                      )}



                    </div>

                  </div>

                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-300">No Active Live Orders</h4>
                  <p className="text-[11px] text-slate-500">Select food from Menu and complete payment to place a new order.</p>
                </div>
              )}

              {/* PAST ORDER HISTORY TABLE */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">Order History</h3>
                <div className="space-y-2">
                  {orderHistory.map((ord) => (
                    <div
                      key={ord.orderId}
                      className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{ord.orderId}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            ord.status === 'Collected'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')} • {ord.counter}
                        </p>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-emerald-400 font-bold block">₹{ord.total}</span>
                        <span className="text-[10px] text-slate-500">Paid via Razorpay</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS & NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>Campus Announcements & Order Updates</span>
                </h3>
                <button
                  onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                  className="text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  Mark All Read
                </button>
              </div>

              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                      n.read
                        ? 'bg-slate-950 border-slate-800/80'
                        : 'bg-slate-900 border-emerald-500/40 shadow-md'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 shrink-0">
                      {n.type === 'order' ? <Receipt className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{n.title}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: STUDENT PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Profile Card Header */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                  {(profile?.full_name || 'U').charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{profile?.full_name || 'User'}</h3>
                  <p className="text-xs text-emerald-400 font-mono">{profile?.email || ''}</p>
                  {profile?.role && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </p>
                  )}
                </div>
              </div>

              {/* Institution Identity */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">Institutional Identity</h4>
                
                <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] block">Registered Campus:</span>
                    <span className="text-white font-bold">{institutionName || 'N/A'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] block">Campus Access Code:</span>
                    <span className="text-emerald-400 font-bold">{institutionCode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Campus Preferences */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">Dining Preferences</h4>
                
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">Dietary Filter</span>
                    <span className="text-emerald-400 font-semibold">Veg & Non-Veg Allowed</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">Preferred Payment Mode</span>
                    <span className="text-emerald-400 font-semibold">Razorpay UPI Instant</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-red-500/30 text-red-400 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Campus Portal Session</span>
              </button>

            </div>
          )}

        </div>

      </div>

      {/* RAZORPAY DEMO PAYMENT MODAL */}
      {isRazorpayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-400 border border-blue-800 font-bold text-xs font-mono">
                  RAZORPAY
                </div>
                <span className="text-xs font-bold text-white">Campus Checkout</span>
              </div>
              <button
                onClick={() => setIsRazorpayModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Merchant</span>
                  <span className="text-xs font-bold text-white">{institutionName}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Amount</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">₹{cartTotal}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Select Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>UPI / GPay / PhonePe</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Credit / Debit Card</span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleRazorpayPayment}
                disabled={isProcessingPayment}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {isProcessingPayment ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Verifying Razorpay Transaction...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Pay ₹{cartTotal}</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
