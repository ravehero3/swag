import { lazy, Suspense, useState, useEffect, useRef, useCallback, createContext, useContext, RefObject } from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { toAudioProxyUrl } from "./lib/audioProxy.js";
import Header from "./components/Header.js";
import SpecialOfferBanner from "./components/SpecialOfferBanner.js";
import ExtendedFooter from "./components/ExtendedFooter.js";
import Footer from "./components/Footer.js";
import CartModal from "./components/CartModal.js";
import NewsletterWindow from "./components/NewsletterWindow.js";
import MusicPlayer from "./components/MusicPlayer.js";
import CookieConsent, { getConsent, type ConsentValue } from "./components/CookieConsent.js";
import "./styles/global.css";

const Home = lazy(() => import("./pages/Home.js"));
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
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.js"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.js"));
const PaymentStatus = lazy(() => import("./pages/PaymentStatus.js"));
const GopayRedirect = lazy(() => import("./pages/GopayRedirect.js"));

interface User {
  id: number;
  email: string;
  isAdmin: boolean;
  username?: string;
  avatarUrl?: string;
}

interface CartItem {
  productId: number;
  productType: "beat" | "sound_kit";
  title: string;
  price: number;
  artworkUrl?: string | null;
  licenseTypeId?: number | null;
}

export interface PreviewPlayerItem {
  id: number;
  title: string;
  artist?: string;
  bpm?: number;
  key?: string;
  price: number;
  preview_url: string;
  artwork_url: string;
  product_type?: "beat" | "sound_kit";
}

interface PreviewPlayerContext {
  currentItem: PreviewPlayerItem | null;
  isPlaying: boolean;
  isLooping: boolean;
  isShuffling: boolean;
  playPreview: (item: PreviewPlayerItem, queue?: PreviewPlayerItem[]) => Promise<void>;
  handlePlayPause: () => void;
  handlePrevious: () => void;
  handleNext: () => void;
  handleToggleLoop: () => void;
  handleToggleShuffle: () => void;
  audioRef: RefObject<HTMLAudioElement>;
  setPreviewMeta: (isSaved: boolean, onToggleSave?: () => void) => void;
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
  previewPlayer: PreviewPlayerContext;
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
  previewPlayer: {
    currentItem: null,
    isPlaying: false,
    isLooping: false,
    isShuffling: false,
    playPreview: async () => {},
    handlePlayPause: () => {},
    handlePrevious: () => {},
    handleNext: () => {},
    handleToggleLoop: () => {},
    handleToggleShuffle: () => {},
    audioRef: { current: null } as RefObject<HTMLAudioElement>,
    setPreviewMeta: () => {},
  },
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
  const [previewCurrentItem, setPreviewCurrentItem] = useState<PreviewPlayerItem | null>(null);
  const [previewQueue, setPreviewQueue] = useState<PreviewPlayerItem[]>([]);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewLooping, setIsPreviewLooping] = useState(false);
  const [isPreviewShuffling, setIsPreviewShuffling] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const previewCurrentItemRef = useRef<PreviewPlayerItem | null>(null);
  const previewQueueRef = useRef<PreviewPlayerItem[]>([]);
  const isPreviewShufflingRef = useRef(false);
  const isPlayPendingRef = useRef(false);
  const [previewIsSaved, setPreviewIsSaved] = useState(false);
  const previewOnToggleSaveRef = useRef<(() => void) | undefined>(undefined);
  const [location, setLocation] = useLocation();
  const [consent, setConsent] = useState<ConsentValue | null>(() => getConsent());

  useEffect(() => {
    if (consent !== "accepted") return;
    const getOrCreateSession = () => {
      let id = sessionStorage.getItem("_v8sid");
      if (!id) {
        id = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("_v8sid", id);
      }
      return id;
    };
    const sessionId = getOrCreateSession();
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: location, sessionId, referrer: document.referrer || null }),
    }).catch(() => {});
  }, [location, consent]);

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

    init().then(() => {
      // Trigger background preloading of other pages and assets after startup
      setTimeout(() => {
        import("./pages/Zvuky.js").catch(() => {});
        import("./pages/ProductDetail.js").catch(() => {});
      }, 1000);
    });
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
      const sanitized = { ...item, price: Number(item.price) };
      const newCart = [...cart, sanitized];
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
    if (previewAudioRef.current) {
      previewAudioRef.current.loop = isPreviewLooping;
    }
  }, [isPreviewLooping]);

  useEffect(() => {
    previewCurrentItemRef.current = previewCurrentItem;
  }, [previewCurrentItem]);

  useEffect(() => {
    previewQueueRef.current = previewQueue;
  }, [previewQueue]);

  useEffect(() => {
    isPreviewShufflingRef.current = isPreviewShuffling;
  }, [isPreviewShuffling]);

  const playPreview = async (item: PreviewPlayerItem, queue?: PreviewPlayerItem[]) => {
    const audio = previewAudioRef.current;
    if (!audio || !item.preview_url) return;

    const currentItem = previewCurrentItemRef.current;
    const isSameItem =
      currentItem?.id === item.id &&
      currentItem?.product_type === item.product_type &&
      currentItem?.preview_url === item.preview_url;

    const activeQueue = queue && queue.length > 0 ? queue : previewQueueRef.current.length ? previewQueueRef.current : [item];
    setPreviewQueue(activeQueue);
    previewQueueRef.current = activeQueue;

    if (isSameItem) {
      if (!audio.paused) {
        audio.pause();
        setIsPreviewPlaying(false);
      } else if (!isPlayPendingRef.current) {
        isPlayPendingRef.current = true;
        try {
          await audio.play();
          setIsPreviewPlaying(true);
        } catch (err) {
          console.error("Preview resume failed:", err);
          setIsPreviewPlaying(false);
        } finally {
          isPlayPendingRef.current = false;
        }
      }
      return;
    }

    if (isPlayPendingRef.current) return;
    isPlayPendingRef.current = true;
    setPreviewCurrentItem(item);
    previewCurrentItemRef.current = item;
    audio.src = toAudioProxyUrl(item.preview_url);
    audio.load();
    try {
      await new Promise<void>((resolve) => {
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onCanPlay);
          resolve();
        };
        audio.addEventListener("canplay", onCanPlay, { once: true });
        audio.addEventListener("error", onCanPlay, { once: true });
        setTimeout(resolve, 3000);
      });
      await audio.play();
      setIsPreviewPlaying(true);
    } catch (err) {
      console.error("Preview play failed:", err, "| src:", item.preview_url);
      setIsPreviewPlaying(false);
    } finally {
      isPlayPendingRef.current = false;
    }
  };

  const handlePreviewEnded = () => {
    const queue = previewQueueRef.current;
    const currentItem = previewCurrentItemRef.current;
    if (!currentItem || queue.length <= 1) {
      setIsPreviewPlaying(false);
      return;
    }
    const currentIndex = queue.findIndex(
      (q) => q.id === currentItem.id && q.product_type === currentItem.product_type && q.preview_url === currentItem.preview_url
    );
    let nextIndex: number;
    if (isPreviewShufflingRef.current) {
      const others = queue.filter((_, i) => i !== currentIndex);
      nextIndex = queue.indexOf(others[Math.floor(Math.random() * others.length)]);
    } else {
      nextIndex = currentIndex >= 0 && currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
    }
    const nextItem = queue[nextIndex];
    if (nextItem?.product_type === "beat" || !nextItem?.product_type) {
      fetch(`/api/beats/${nextItem.id}/play`, { method: "POST" }).catch(() => {});
    }
    playPreview(nextItem, queue);
  };

  const handlePreviewPlayPause = () => {
    const currentItem = previewCurrentItemRef.current;
    if (currentItem) {
      playPreview(currentItem, previewQueueRef.current.length ? previewQueueRef.current : [currentItem]);
    }
  };

  const handlePreviewPrevious = () => {
    const audio = previewAudioRef.current;
    const currentItem = previewCurrentItemRef.current;
    if (!currentItem) return;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const queue = previewQueueRef.current.length ? previewQueueRef.current : [currentItem];
    const currentIndex = queue.findIndex(
      (item) =>
        item.id === currentItem.id &&
        item.product_type === currentItem.product_type &&
        item.preview_url === currentItem.preview_url
    );
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    playPreview(queue[prevIndex], queue);
  };

  const handlePreviewNext = () => {
    const currentItem = previewCurrentItemRef.current;
    if (!currentItem) return;
    const queue = previewQueueRef.current.length ? previewQueueRef.current : [currentItem];
    if (isPreviewShufflingRef.current && queue.length > 1) {
      const otherItems = queue.filter(
        (item) =>
          item.id !== currentItem.id ||
          item.product_type !== currentItem.product_type ||
          item.preview_url !== currentItem.preview_url
      );
      playPreview(otherItems[Math.floor(Math.random() * otherItems.length)], queue);
      return;
    }
    const currentIndex = queue.findIndex(
      (item) =>
        item.id === currentItem.id &&
        item.product_type === currentItem.product_type &&
        item.preview_url === currentItem.preview_url
    );
    const nextIndex = currentIndex >= 0 && currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
    playPreview(queue[nextIndex], queue);
  };

  const handlePreviewBuyClick = (item: PreviewPlayerItem) => {
    const productType = item.product_type ?? "beat";
    if (productType === "beat") {
      setLocation(`/produkt/beat/${item.id}`);
    } else {
      addToCart({
        productId: item.id,
        productType: productType,
        title: item.title,
        price: Number(item.price),
        artworkUrl: item.artwork_url || null,
      });
    }
  };

  const handlePreviewToggleSave = useCallback(() => {
    if (previewOnToggleSaveRef.current) {
      previewOnToggleSaveRef.current();
    }
  }, []);

  const setPreviewMeta = useCallback((isSaved: boolean, onToggleSave?: () => void) => {
    setPreviewIsSaved(isSaved);
    previewOnToggleSaveRef.current = onToggleSave;
  }, []);

  useEffect(() => {
    if (!authLoading) {
      refreshSavedCount();
    }
  }, [user, authLoading]);

  const isAdminPage = location === "/admin";
  const isPokladnaPage = location === "/pokladna";
  const [specialOfferBarHeight, setSpecialOfferBarHeight] = useState(0);
  const headerSpacerHeight = 42 + specialOfferBarHeight;

  return (
    <AppContext.Provider value={{ user, setUser, authLoading, cart, addToCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen, isNewsletterOpen, setIsNewsletterOpen, settings, refreshSettings, savedCount, refreshSavedCount, previewPlayer: { currentItem: previewCurrentItem, isPlaying: isPreviewPlaying, isLooping: isPreviewLooping, isShuffling: isPreviewShuffling, playPreview, handlePlayPause: handlePreviewPlayPause, handlePrevious: handlePreviewPrevious, handleNext: handlePreviewNext, handleToggleLoop: () => setIsPreviewLooping((v) => !v), handleToggleShuffle: () => setIsPreviewShuffling((v) => !v), audioRef: previewAudioRef, setPreviewMeta } }}>
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", paddingBottom: previewCurrentItem ? "84px" : "0" }}>
        <audio
          ref={previewAudioRef}
          onEnded={handlePreviewEnded}
          onError={() => setIsPreviewPlaying(false)}
        />
        <Header />
        {!isAdminPage && (
          <SpecialOfferBanner
            settings={settings}
            onActiveChange={(active) => {
              if (!active) setSpecialOfferBarHeight(0);
            }}
            onHeightChange={setSpecialOfferBarHeight}
          />
        )}
        <div style={{ height: `${headerSpacerHeight}px`, flexShrink: 0 }} aria-hidden="true" />
        <main style={{ flex: 1, position: "relative", zIndex: 20 }} className="fade-in">
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/beaty" component={Home} />
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
              <Route path="/zapomenute-heslo" component={ForgotPassword} />
              <Route path="/resetovat-heslo" component={ResetPassword} />
              <Route path="/platba-status" component={PaymentStatus} />
              <Route path="/gopay-redirect" component={GopayRedirect} />
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
        <CookieConsent onConsent={(v) => setConsent(v)} />
        {previewCurrentItem && !isAdminPage && !isPokladnaPage && (
          <MusicPlayer
            currentBeat={previewCurrentItem}
            isPlaying={isPreviewPlaying}
            isLooping={isPreviewLooping}
            isShuffling={isPreviewShuffling}
            onPlayPause={handlePreviewPlayPause}
            onPrevious={handlePreviewPrevious}
            onNext={handlePreviewNext}
            onToggleLoop={() => setIsPreviewLooping((value) => !value)}
            onToggleShuffle={() => setIsPreviewShuffling((value) => !value)}
            onBuyClick={handlePreviewBuyClick}
            audioRef={previewAudioRef}
            isSaved={previewIsSaved}
            onToggleSave={handlePreviewToggleSave}
            queue={previewQueue}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}

export default App;
