import { useState, useEffect, createContext, useContext } from "react";
import { Route, Switch, useLocation } from "wouter";
import Header from "./components/Header.js";
import ExtendedFooter from "./components/ExtendedFooter.js";
import Footer from "./components/Footer.js";
import CartModal from "./components/CartModal.js";
import Home from "./pages/Home.js";
import Beaty from "./pages/Beaty.js";
import Zvuky from "./pages/Zvuky.js";
import ProductDetail from "./pages/ProductDetail.js";
import Login from "./pages/Login.js";
import Admin from "./pages/Admin.js";
import Cart from "./pages/Cart.js";
import Checkout from "./pages/Checkout.js";
import Ulozeno from "./pages/Ulozeno.js";
import Ucet from "./pages/Ucet.js";
import FAQ from "./pages/FAQ.js";
import Delivery from "./pages/Delivery.js";
import Payment from "./pages/Payment.js";
import LegalInfo from "./pages/LegalInfo.js";
import PrivacyPolicy from "./pages/PrivacyPolicy.js";
import CookiePolicy from "./pages/CookiePolicy.js";
import CookieSettings from "./pages/CookieSettings.js";
import "./styles/global.css";

interface User {
  id: number;
  email: string;
  isAdmin: boolean;
}

interface CartItem {
  productId: number;
  productType: "beat" | "sound_kit";
  title: string;
  price: number;
  artworkUrl: string;
}

import NewsletterWindow from "./components/NewsletterWindow.js";

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number, productType: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isNewsletterOpen: boolean;
  setIsNewsletterOpen: (open: boolean) => void;
  settings: Record<string, string>;
  refreshSettings: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  isCartOpen: false,
  setIsCartOpen: () => {},
  isNewsletterOpen: false,
  setIsNewsletterOpen: () => {},
  settings: {},
  refreshSettings: async () => {},
});

export const useApp = () => useContext(AppContext);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [location] = useLocation();

  // Add padding to body for fixed header
  useEffect(() => {
    document.body.style.paddingTop = "42px";
    return () => {
      document.body.style.paddingTop = "0";
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const [authRes, settingsRes] = await Promise.all([
          fetch("/api/auth/me", { credentials: "include", signal: controller.signal }),
          fetch("/api/settings", { signal: controller.signal })
        ]);

        if (authRes.ok) {
          const authData = await authRes.json();
          setUser(authData.user);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem("voodoo808_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const addToCart = (item: CartItem) => {
    const exists = cart.find(
      (c) => c.productId === item.productId && c.productType === item.productType
    );
    if (!exists) {
      const newCart = [...cart, item];
      setCart(newCart);
      localStorage.setItem("voodoo808_cart", JSON.stringify(newCart));
    }
  };

  const removeFromCart = (productId: number, productType: string) => {
    const newCart = cart.filter(
      (c) => !(c.productId === productId && c.productType === productType)
    );
    setCart(newCart);
    localStorage.setItem("voodoo808_cart", JSON.stringify(newCart));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("voodoo808_cart");
  };

  const refreshSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to refresh settings:", error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        background: "#000", 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: "#fff",
        fontFamily: "Helvetica Neue, sans-serif"
      }}>
        <style>{`
          @keyframes vu33-dot-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
            40% { transform: translateY(-6px); opacity: 1; }
          }
          .vu33-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #fff;
            animation: vu33-dot-bounce 1.2s ease-in-out infinite;
          }
          .vu33-dot:nth-child(2) { animation-delay: 0.2s; }
          .vu33-dot:nth-child(3) { animation-delay: 0.4s; }
        `}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <div className="vu33-dot" />
            <div className="vu33-dot" />
            <div className="vu33-dot" />
          </div>
          <span style={{ fontSize: "12px", letterSpacing: "2px", color: "#666", textTransform: "uppercase" }}>
            načítá se
          </span>
        </div>
      </div>
    );
  }

  const isAdminPage = location === "/admin";
  const isPokladnaPage = location === "/pokladna";

  return (
    <AppContext.Provider value={{ user, setUser, cart, addToCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen, isNewsletterOpen, setIsNewsletterOpen, settings, refreshSettings }}>
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1 }} className="fade-in">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/beaty" component={Beaty} />
            <Route path="/zvuky" component={Zvuky} />
            <Route path="/produkt/:type/:id" component={ProductDetail} />
            <Route path="/prihlasit-se" component={Login} />
            <Route path="/kosik" component={Cart} />
            <Route path="/pokladna" component={Checkout} />
            <Route path="/ulozeno" component={Ulozeno} />
            <Route path="/ucet" component={Ucet} />
            <Route path="/admin" component={Admin} />
            <Route path="/faq" component={FAQ} />
            <Route path="/doruceni" component={Delivery} />
            <Route path="/platba" component={Payment} />
            <Route path="/pravni-informace" component={LegalInfo} />
            <Route path="/ochrana-osobnich-udaju" component={PrivacyPolicy} />
            <Route path="/cookies" component={CookiePolicy} />
            <Route path="/nastaveni-cookies" component={CookieSettings} />
            <Route>
              <div className="fade-in" style={{ textAlign: "center", padding: "100px 20px" }}>
                <h1>404</h1>
                <p>Stránka nenalezena</p>
              </div>
            </Route>
          </Switch>
        </main>
        {!isAdminPage && !isPokladnaPage && (
          <ExtendedFooter />
        )}
        {!isAdminPage && (
          <Footer />
        )}
        <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <NewsletterWindow isOpen={isNewsletterOpen} onClose={() => setIsNewsletterOpen(false)} />
      </div>
    </AppContext.Provider>
  );
}

export default App;
