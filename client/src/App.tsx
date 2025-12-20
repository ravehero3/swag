import { useState, useEffect, createContext, useContext } from "react";
import { Route, Switch } from "wouter";
import Header from "./components/Header";
import ExtendedFooter from "./components/ExtendedFooter";
import Footer from "./components/Footer";
import CartModal from "./components/CartModal";
import Beaty from "./pages/Beaty";
import Zvuky from "./pages/Zvuky";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Ulozeno from "./pages/Ulozeno";
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
});

export const useApp = () => useContext(AppContext);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Add padding to body for fixed header
  useEffect(() => {
    document.body.style.paddingTop = "42px";
    return () => {
      document.body.style.paddingTop = "0";
    };
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
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
    <AppContext.Provider value={{ user, setUser, cart, addToCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen }}>
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1 }} className="fade-in">
          <Switch>
            <Route path="/" component={Beaty} />
            <Route path="/beaty" component={Beaty} />
            <Route path="/zvuky" component={Zvuky} />
            <Route path="/prihlasit-se" component={Login} />
            <Route path="/kosik" component={Cart} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/ulozeno" component={Ulozeno} />
            <Route path="/admin" component={Admin} />
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
