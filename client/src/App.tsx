import { useState, useEffect, useRef, createContext, useContext } from "react";
import { Route, Switch } from "wouter";
import Header from "./components/Header";
import ExtendedFooter from "./components/ExtendedFooter";
import Footer from "./components/Footer";
import CartModal from "./components/CartModal";
import NewsletterWindow from "./components/NewsletterWindow";
import MusicPlayer from "./components/MusicPlayer";
import Beaty from "./pages/Beaty";
import Zvuky from "./pages/Zvuky";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Ucet from "./pages/Ucet";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Ulozeno from "./pages/Ulozeno";
import FAQ from "./pages/FAQ";
import ProductDetail from "./pages/ProductDetail";
import Delivery from "./pages/Delivery";
import Payment from "./pages/Payment";
import LegalInfo from "./pages/LegalInfo";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import CookieSettings from "./pages/CookieSettings";
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
  isNewsletterOpen: boolean;
  setIsNewsletterOpen: (open: boolean) => void;
  currentBeat: Beat | null;
  setCurrentBeat: (beat: Beat | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isLooping: boolean;
  setIsLooping: (looping: boolean) => void;
  isShuffling: boolean;
  setIsShuffling: (shuffling: boolean) => void;
  audioRef?: React.RefObject<HTMLAudioElement>;
  allBeats?: Beat[];
  playBeat?: (beat: Beat) => void;
  handlePrevious?: () => void;
  handleNext?: () => void;
  settings: Record<string, string>;
  refreshSettings: () => void;
}

interface Beat {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  price: number;
  preview_url: string;
  artwork_url: string;
  is_highlighted?: boolean;
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
  currentBeat: null,
  setCurrentBeat: () => {},
  isPlaying: false,
  setIsPlaying: () => {},
  isLooping: false,
  setIsLooping: () => {},
  isShuffling: false,
  setIsShuffling: () => {},
  audioRef: undefined,
  allBeats: [],
  playBeat: () => {},
  handlePrevious: () => {},
  handleNext: () => {},
  settings: {},
  refreshSettings: () => {},
});

export const useApp = () => useContext(AppContext);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement>(null);

  const refreshSettings = () => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(setSettings)
      .catch(console.error);
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Add padding to body for fixed header
  useEffect(() => {
    document.body.style.paddingTop = "42px";
    return () => {
      document.body.style.paddingTop = "0";
    };
  }, []);

  // Update audio src and loop when currentBeat changes
  useEffect(() => {
    if (currentBeat && audioRef.current) {
      audioRef.current.src = currentBeat.preview_url;
      audioRef.current.loop = isLooping;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentBeat, isLooping]);

  // Handle play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying && currentBeat) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentBeat]);

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
    <AppContext.Provider value={{ user, setUser, cart, addToCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen, isNewsletterOpen, setIsNewsletterOpen, currentBeat, setCurrentBeat, isPlaying, setIsPlaying, isLooping, setIsLooping, isShuffling, setIsShuffling, audioRef, allBeats: [], playBeat: () => {}, handlePrevious: () => {}, handleNext: () => {}, settings, refreshSettings }}>
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1 }} className="fade-in">
          <Switch>
            <Route path="/" component={Beaty} />
            <Route path="/beaty" component={Beaty} />
            <Route path="/zvuky" component={Zvuky} />
            <Route path="/prihlasit-se" component={Login} />
            <Route path="/ucet" component={Ucet} />
            <Route path="/kosik" component={Cart} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/ulozeno" component={Ulozeno} />
            <Route path="/admin" component={Admin} />
            <Route path="/faq" component={FAQ} />
            <Route path="/produkt/:type/:id" component={ProductDetail} />
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
        <div style={{
          width: '100%',
          height: '1000px',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          background: '#000',
          marginTop: '-400px'
        }}>
          <img 
            src="/assets/sound_kits_hero.jpg" 
            alt="Computer Background" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              objectPosition: 'bottom',
              opacity: 0.6
            }} 
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to bottom, transparent, black)'
          }} />
        </div>
        <ExtendedFooter />
        <Footer />
        <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        {isNewsletterOpen && (
          <NewsletterWindow isOpen={isNewsletterOpen} onClose={() => setIsNewsletterOpen(false)} />
        )}
      </div>
      <audio ref={audioRef} />
      {currentBeat && <MusicPlayer currentBeat={currentBeat} isPlaying={isPlaying} isLooping={isLooping} isShuffling={isShuffling} onPlayPause={() => { if (audioRef.current) { if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); } } setIsPlaying(!isPlaying); }} onPrevious={() => {}} onNext={() => {}} onToggleLoop={() => setIsLooping(!isLooping)} onToggleShuffle={() => setIsShuffling(!isShuffling)} onBuyClick={(beat) => { const item = { productId: beat.id, productType: "beat" as const, title: beat.title, price: beat.price, artworkUrl: beat.artwork_url }; addToCart(item); }} audioRef={audioRef} />}
    </AppContext.Provider>
  );
}

export default App;
