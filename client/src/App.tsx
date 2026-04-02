import { lazy, Suspense, useState, useEffect, createContext, useContext } from "react";
import { Route, Switch, useLocation } from "wouter";
import Header from "./components/Header.js";
import ExtendedFooter from "./components/ExtendedFooter.js";
import Footer from "./components/Footer.js";
import CartModal from "./components/CartModal.js";
import NewsletterWindow from "./components/NewsletterWindow.js";
import "./styles/global.css";

const Home = lazy(() => import("./pages/Home.js"));
const Beaty = lazy(() => import("./pages/Beaty.js"));
const Zvuky = lazy(() => import("./pages/Zvuky.js"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.js"));
const Login = lazy(() => import("./pages/Login.js"));
const Admin = lazy(() => import("./pages/Admin.js"));
const Cart = lazy(() => import("./pages/Cart.js"));
const Checkout = lazy(() => import("./pages/Checkout.js"));
const Ulozeno = lazy(() => import("./pages/Ulozeno.js"));
const Ucet = lazy(() => import("./pages/Ucet.js"));
const FAQ = lazy(() => import("./pages/FAQ.js"));
const Delivery = lazy(() => import("./pages/Delivery.js"));
const Payment = lazy(() => import("./pages/Payment.js"));
const LegalInfo = lazy(() => import("./pages/LegalInfo.js"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.js"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.js"));
const CookieSettings = lazy(() => import("./pages/CookieSettings.js"));

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
  licenseTypeId?: number | null;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  authLoading: boolean;
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
  savedCount: number;
  refreshSavedCount: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  authLoading: true,
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
  savedCount: 0,
  refreshSavedCount: async () => {},
});

export const useApp = () => useContext(AppContext);


function PageLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
    }}>
      <div />
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [savedCount, setSavedCount] = useState(0);
  const [location] = useLocation();

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
        setAuthLoading(false);
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

  const refreshSavedCount = async () => {
    if (user) {
      try {
        const res = await fetch("/api/saved", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSavedCount(Array.isArray(data) ? data.filter((i: any) => i.item_data != null).length : 0);
        }
      } catch {
        setSavedCount(0);
      }
    } else {
      const beats = JSON.parse(localStorage.getItem("voodoo808_saved_beats") || "[]");
      const kits = JSON.parse(localStorage.getItem("voodoo808_saved_kits") || "[]");
      setSavedCount(beats.length + kits.length);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      refreshSavedCount();
    }
  }, [user, authLoading]);

  const isAdminPage = location === "/admin";
  const isPokladnaPage = location === "/pokladna";

  return (
    <AppContext.Provider value={{ user, setUser, authLoading, cart, addToCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen, isNewsletterOpen, setIsNewsletterOpen, settings, refreshSettings, savedCount, refreshSavedCount }}>
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1, position: "relative", zIndex: 1 }} className="fade-in">
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
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
