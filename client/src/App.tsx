import { useState, useEffect, createContext, useContext } from "react";
import { Route, Switch } from "wouter";
import Header from "./components/Header.js";
import ExtendedFooter from "./components/ExtendedFooter.js";
import Footer from "./components/Footer.js";
import CartModal from "./components/CartModal.js";
import Home from "./pages/Home.js";
import Beaty from "./pages/Beaty.js";
import Zvuky from "./pages/Zvuky.js";
import Login from "./pages/Login.js";
import Admin from "./pages/Admin.js";
import Cart from "./pages/Cart.js";
import Checkout from "./pages/Checkout.js";
import Ulozeno from "./pages/Ulozeno.js";
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

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number, productType: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  settings: Record<string, string>;
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
  settings: {},
});

export const useApp = () => useContext(AppContext);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Add padding to body for fixed header
  useEffect(() => {
    document.body.style.paddingTop = "42px";
    return () => {
      document.body.style.paddingTop = "0";
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [authRes, settingsRes] = await Promise.all([
          fetch("/api/auth/me", { credentials: "include" }),
          fetch("/api/settings")
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

  if (loading) {
    return <div style={{ background: "#000", minHeight: "100vh" }} />;
  }

  return (
    <AppContext.Provider value={{ user, setUser, cart, addToCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen, settings }}>
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1 }} className="fade-in">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/beaty" component={Beaty} />
            <Route path="/zvuky" component={Zvuky} />
            <Route path="/prihlasit-se" component={Login} />
            <Route path="/kosik" component={Cart} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/ulozeno" component={Ulozeno} />
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
        <ExtendedFooter />
        <Footer />
        <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </AppContext.Provider>
  );
}

export default App;
