import { useState, useEffect, useMemo } from "react";
import { useApp } from "../App.js";
import { useLocation } from "wouter";
import { calculateOrderTotal } from "../lib/pricing.js";

function formatCzechPrice(amount: number): string {
  return amount.toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " Kč";
}

function Checkout() {
  const { cart, user, clearCart } = useApp() as any;
  const [email, setEmail] = useState(user?.email || "");
  const [buyerLegalName, setBuyerLegalName] = useState("");
  const [buyerArtistName, setBuyerArtistName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [freeSuccess, setFreeSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"gopay" | "bank_transfer">("bank_transfer");
  const [bankInstructions, setBankInstructions] = useState<any>(null);
  const [, navigate] = useLocation();

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");

  const [agreeVop, setAgreeVop] = useState(false);
  const [agreeDigital, setAgreeDigital] = useState(false);

  const cartItems = useMemo(
    () =>
      cart.map((item: any) => ({
        price: Number(item.price) || 0,
        productType: item.productType as string,
      })),
    [cart]
  );
  const { rawTotal: total, kitSubtotal, discountAmount, finalTotal } = useMemo(
    () => calculateOrderTotal(cartItems, discount),
    [cartItems, discount]
  );
  const hasKitsInCart = kitSubtotal > 0;
  const isFreeOrder = finalTotal === 0;

  useEffect(() => {
    if (cart.length === 0 && !success && !freeSuccess && !bankInstructions) {
      navigate("/kosik");
    }
  }, [cart.length, success, freeSuccess, bankInstructions]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/auth/profile-info", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          if (data.buyerLegalName) setBuyerLegalName(data.buyerLegalName);
          if (data.buyerArtistName) setBuyerArtistName(data.buyerArtistName);
          if (data.buyerAddress) setBuyerAddress(data.buyerAddress);
        }
      })
      .catch(() => {});
  }, [user]);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    if (!hasKitsInCart) {
      setPromoError("Sleva platí pouze na zvukové kity (ne na beaty)");
      setDiscount(0);
      return;
    }
    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          items: cart.map((item: any) => ({
            productType: item.productType,
            price: item.price,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiscount(data.discountPercent);
        setPromoError("");
      } else {
        setPromoError(data.error || "Neplatný kód");
        setDiscount(0);
      }
    } catch {
      setPromoError("Chyba při ověřování kódu");
    }
  };

  const handleFreeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const items = cart.map((item: any) => ({
        productId: item.productId,
        productType: item.productType,
        title: item.title,
        price: 0,
      }));

      if (user) {
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, items, total: 0, paymentMethod: "free" }),
        });
        if (!orderRes.ok) throw new Error("Chyba při vytváření objednávky");
        const order = await orderRes.json();

        const claimRes = await fetch(`/api/orders/${order.id}/claim-free`, {
          method: "POST",
          credentials: "include",
        });
        if (!claimRes.ok) {
          const claimData = await claimRes.json();
          throw new Error(claimData.error || "Chyba při zpracování");
        }
      } else {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, items }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Chyba při zpracování");
        }
      }

      clearCart();
      setFreeSuccess(true);
      setTimeout(() => navigate(user ? "/ucet" : "/"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeVop) {
      setError("Prosím potvrďte souhlas s obchodními podmínkami.");
      return;
    }
    if (!agreeDigital) {
      setError("Prosím potvrďte souhlas se ztrátou práva na odstoupení od smlouvy pro digitální obsah.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const items = cart.map((item: any) => ({
        productId: item.productId,
        productType: item.productType,
        title: item.title,
        price: item.price,
        licenseTypeId: item.licenseTypeId || null,
      }));

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          items,
          total: finalTotal,
          promoCode: discount > 0 ? promoCode : null,
          buyerLegalName,
          buyerArtistName,
          buyerAddress,
          paymentMethod,
        }),
      });

      if (!orderRes.ok) throw new Error("Chyba při vytváření objednávky");
      const order = await orderRes.json();

      if (paymentMethod === "bank_transfer") {
        const btRes = await fetch(`/api/orders/${order.id}/bank-transfer`, {
          method: "POST",
          credentials: "include",
        });
        if (!btRes.ok) {
          const btData = await btRes.json();
          throw new Error(btData.error || "Chyba při zahájení platby");
        }
        const btData = await btRes.json();
        clearCart();
        setBankInstructions(btData);
        return;
      }

      const payRes = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
        credentials: "include",
      });

      if (!payRes.ok) {
        const payData = await payRes.json();
        const msg = payData.error || "Chyba při zahájení platby";
        const detail = payData.gopayDetail ? `\n\nDetail: ${payData.gopayDetail}` : "";
        throw new Error(msg + detail);
      }

      const payData = await payRes.json();
      clearCart();

      if (payData.gw_url) {
        window.location.href = `/gopay-redirect?url=${encodeURIComponent(payData.gw_url)}`;
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: {
      minHeight: "calc(100vh - 42px)",
      display: "flex" as const,
      flexDirection: "column" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      padding: "40px 20px",
    },
    card: { maxWidth: "520px", width: "100%" },
    section: {
      marginBottom: "16px",
      padding: "18px",
      border: "1px solid #222",
      borderRadius: "4px",
      background: "#080808",
    },
    sectionLabel: {
      fontSize: "10px",
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      color: "#555",
      marginBottom: "12px",
    },
    divider: { borderTop: "1px solid #1a1a1a", margin: "8px 0" },
    row: {
      display: "flex" as const,
      justifyContent: "space-between" as const,
      padding: "7px 0",
      fontSize: "14px",
    },
    label12: { display: "block" as const, marginBottom: "4px", fontSize: "12px", color: "#888" },
    hint: { fontSize: "11px", color: "#555", marginTop: "4px", lineHeight: 1.5 },
    checkRow: {
      display: "flex" as const,
      alignItems: "flex-start" as const,
      gap: "10px",
      padding: "10px 0",
    },
    checkLabel: { fontSize: "13px", color: "#aaa", lineHeight: 1.55, cursor: "pointer" as const },
    link: { color: "#fff", textDecoration: "underline" as const },
  };

  if (freeSuccess) {
    return (
      <div className="fade-in" style={s.page}>
        <div style={{ ...s.card, textAlign: "center" }}>
          <h1 style={{ marginBottom: "24px" }}>Soubory jsou na cestě!</h1>
          <p style={{ color: "#666", marginBottom: "24px" }}>
            Na email <strong style={{ color: "#fff" }}>{email}</strong> jsme odeslali odkaz ke stažení.
            {user && " Najdete soubory také ve svém účtu."}
          </p>
          <p style={{ color: "#555", fontSize: "13px", marginBottom: "24px" }}>
            {user ? "Přesměrovávám na váš účet..." : "Přesměrovávám na hlavní stránku..."}
          </p>
          <button className="btn btn-bounce" onClick={() => navigate(user ? "/ucet" : "/")} style={{ borderRadius: "4px" }}>
            {user ? "Přejít na účet" : "Zpět na hlavní stránku"}
          </button>
        </div>
      </div>
    );
  }

  if (bankInstructions) {
    const bi = bankInstructions;
    const copyRow = (label: string, value: string, testId: string) => (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a1a1a", gap: "12px" }}>
        <span style={{ fontSize: "12px", color: "#888" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span data-testid={testId} style={{ fontSize: "14px", color: "#fff", fontFamily: "monospace", fontWeight: 600 }}>{value}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(value)}
            style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: "3px", color: "#888", fontSize: "11px", padding: "3px 8px", cursor: "pointer" }}
            title="Kopírovat"
          >
            kopírovat
          </button>
        </div>
      </div>
    );
    return (
      <div className="fade-in" style={s.page}>
        <div style={{ maxWidth: "560px", width: "100%" }}>
          <h1 style={{ marginBottom: "8px", textAlign: "center" }}>Pokyny k platbě</h1>
          <p style={{ color: "#666", fontSize: "13px", textAlign: "center", marginBottom: "28px", lineHeight: 1.6 }}>
            Objednávka <strong style={{ color: "#fff" }}>#{bi.orderId}</strong> byla vytvořena.
            Pošlete prosím částku na náš účet pomocí bankovního převodu.
            Stejné pokyny jsme vám zaslali na <strong style={{ color: "#fff" }}>{email}</strong>.
          </p>

          <div style={{ border: "1px solid #2a2a2a", borderRadius: "4px", padding: "18px", marginBottom: "16px", background: "#0d0d0d" }}>
            <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Údaje k platbě</div>
            {copyRow("Číslo účtu", bi.accountNumber, "text-account-number")}
            {copyRow("Částka", `${bi.amount} ${bi.currency}`, "text-amount")}
            {copyRow("Variabilní symbol", bi.variableSymbol, "text-variable-symbol")}
            {copyRow("Zpráva pro příjemce", bi.messageForRecipient, "text-message")}
          </div>

          <div style={{ border: "1px solid #3a2a10", background: "rgba(245,158,11,0.06)", borderRadius: "4px", padding: "12px 14px", marginBottom: "20px" }}>
            <div style={{ fontSize: "12px", color: "#f5b150", lineHeight: 1.6 }}>
              <strong>Důležité:</strong> Bez správně vyplněného variabilního symbolu nebudeme schopni
              vaši platbu spárovat s objednávkou. Soubory a licenční smlouvu vám pošleme na email
              jakmile platba dorazí na účet (obvykle do 1–2 pracovních dnů).
            </div>
          </div>

          <p style={{ color: "#555", fontSize: "12px", textAlign: "center", marginBottom: "16px" }}>
            Stav objednávky můžete sledovat ve svém účtu.
          </p>

          <button
            className="btn btn-bounce"
            onClick={() => navigate("/ucet")}
            data-testid="button-go-to-account"
            style={{ width: "100%", borderRadius: "4px" }}
          >
            Přejít na účet
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fade-in" style={s.page}>
        <div style={{ ...s.card, textAlign: "center" }}>
          <h1 style={{ marginBottom: "24px" }}>Objednávka vytvořena!</h1>
          <p style={{ color: "#666", marginBottom: "24px" }}>
            Děkujeme za vaši objednávku. Na email {email} vám zašleme pokyny k platbě a po jejím přijetí odkaz ke stažení.
          </p>
          <button className="btn btn-bounce" onClick={() => navigate("/")} style={{ borderRadius: "4px" }}>
            Zpět na hlavní stránku
          </button>
        </div>
      </div>
    );
  }

  if (isFreeOrder) {
    return (
      <div className="fade-in" style={s.page}>
        <div style={s.card}>
          <h1 style={{ marginBottom: "8px", textAlign: "center" }}>Stažení zdarma</h1>
          <p style={{ color: "#555", fontSize: "13px", textAlign: "center", marginBottom: "28px" }}>
            Zadejte váš email a soubory vám zašleme okamžitě
          </p>

          <div style={s.section}>
            <div style={s.sectionLabel}>Shrnutí</div>
            {cart.map((item: any) => (
              <div key={`${item.productType}-${item.productId}`} style={{ ...s.row, borderBottom: "1px solid #1a1a1a" }}>
                <span style={{ color: "#ccc" }}>{item.title}</span>
                <span style={{ color: "#24e053" }}>Zdarma</span>
              </div>
            ))}
            <div style={{ ...s.row, fontWeight: 600, color: "#fff", paddingTop: "12px" }}>
              <span>Celkem</span>
              <span style={{ color: "#24e053" }}>0 Kč</span>
            </div>
          </div>

          <form onSubmit={handleFreeSubmit}>
            {error && (
              <div style={{ color: "#ff4444", marginBottom: "16px", padding: "12px", border: "1px solid #333", borderRadius: "4px", fontSize: "14px" }}>
                {error}
              </div>
            )}
            <div style={{ marginBottom: "24px" }}>
              <label style={s.label12}>Email pro doručení *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vas@email.cz"
                data-testid="input-email-free"
                style={{ width: "100%", borderRadius: "4px" }}
              />
              <p style={s.hint}>Na tento email zašleme odkaz ke stažení okamžitě po potvrzení</p>
            </div>
            <button
              type="submit"
              className="btn btn-filled btn-bounce"
              disabled={loading}
              data-testid="button-claim-free"
              style={{ width: "100%", borderRadius: "4px" }}
            >
              {loading ? "Zpracování..." : "Získat zdarma"}
            </button>
            <p style={{ fontSize: "11px", color: "#555", textAlign: "center", marginTop: "12px", lineHeight: "1.5" }}>
              {user ? "Soubory budou okamžitě dostupné ve vašem účtu i na emailu." : "Odkaz ke stažení vám zašleme okamžitě na email."}
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={s.page}>
      <div style={s.card}>
        <h1 style={{ marginBottom: "24px", textAlign: "center", fontSize: "22px", letterSpacing: "-0.02em" }}>
          Dokončení objednávky
        </h1>

        {/* Order summary */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Shrnutí objednávky</div>
          {cart.map((item: any) => (
            <div key={`${item.productType}-${item.productId}`} style={{ ...s.row, borderBottom: "1px solid #1a1a1a", color: "#ccc" }}>
              <span style={{ flex: 1, paddingRight: "12px" }}>{item.title}</span>
              <span style={{ whiteSpace: "nowrap", color: "#fff" }}>{formatCzechPrice(Number(item.price))}</span>
            </div>
          ))}
          {discount > 0 && (
            <>
              <div style={{ ...s.row, color: "#666", fontSize: "13px" }}>
                <span>Mezisoučet</span>
                <span>{formatCzechPrice(total)}</span>
              </div>
              <div style={{ ...s.row, color: "#888", fontSize: "12px" }}>
                <span>Sleva na zvukové kity ({discount}%)</span>
                <span>−{formatCzechPrice(discountAmount)}</span>
              </div>
              <div style={{ ...s.row, color: "#24e053", fontSize: "13px" }}>
                <span>Kód {promoCode.toUpperCase()}</span>
                <span />
              </div>
            </>
          )}
          <div style={{ ...s.row, fontWeight: 700, color: "#fff", borderTop: "1px solid #2a2a2a", marginTop: "6px", paddingTop: "12px", fontSize: "15px" }}>
            <span>Celkem k úhradě</span>
            <span>{formatCzechPrice(finalTotal)}</span>
          </div>
          <div style={{ fontSize: "11px", color: "#444", marginTop: "6px", textAlign: "right" }}>
            Cena konečná — nejsme plátci DPH
          </div>
        </div>

        {/* Promo code */}
        <div style={s.section}>
          <label style={s.label12}>Promo kód</label>
          <p style={{ fontSize: "11px", color: "#666", margin: "0 0 8px 0", lineHeight: 1.5 }}>
            Sleva platí pouze na zvukové kity, ne na beaty.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); if (discount > 0) { setDiscount(0); setPromoError(""); } }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromoCode(); } }}
              placeholder="Zadejte kód"
              style={{ flex: 1, borderRadius: "4px" }}
              disabled={discount > 0}
            />
            {discount > 0 ? (
              <button type="button" className="btn" onClick={() => { setDiscount(0); setPromoCode(""); setPromoError(""); }} style={{ borderRadius: "4px", background: "#222", color: "#888" }}>Odebrat</button>
            ) : (
              <button type="button" className="btn" onClick={applyPromoCode} style={{ borderRadius: "4px" }}>Použít</button>
            )}
          </div>
          {promoError && <p style={{ color: "#ff4444", fontSize: "12px", marginTop: "4px" }}>{promoError}</p>}
          {discount > 0 && (
            <p style={{ color: "#24e053", fontSize: "12px", marginTop: "4px" }}>
              Sleva {discount}% aplikována na zvukové kity
            </p>
          )}
        </div>

        {/* Payment method */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Způsob platby</div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px",
              border: paymentMethod === "bank_transfer" ? "1px solid rgba(255,255,255,0.25)" : "1px solid #2a2a2a",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "8px",
              background: paymentMethod === "bank_transfer" ? "#111" : "transparent",
              transition: "border-color 0.15s",
            }}
            data-testid="option-bank-transfer"
          >
            <input type="radio" name="paymentMethod" value="bank_transfer" checked={paymentMethod === "bank_transfer"} onChange={() => setPaymentMethod("bank_transfer")} style={{ marginTop: "3px" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", color: "#fff", marginBottom: "2px" }}>Bankovní převod</div>
              <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>
                Po dokončení obdržíte údaje k převodu (číslo účtu a variabilní symbol).
                Soubory a licenční smlouvu vám zašleme na email po přijetí platby (1–2 prac. dny).
              </div>
            </div>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px",
              border: `1px solid ${paymentMethod === "gopay" ? "rgba(255,255,255,0.25)" : "#2a2a2a"}`,
              borderRadius: "4px",
              cursor: "pointer",
              background: paymentMethod === "gopay" ? "#111" : "transparent",
              transition: "border-color 0.15s",
            }}
            data-testid="option-gopay"
          >
            <input type="radio" name="paymentMethod" value="gopay" checked={paymentMethod === "gopay"} onChange={() => setPaymentMethod("gopay")} style={{ marginTop: "3px" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", color: "#fff", marginBottom: "2px" }}>
                GoPay – karta, Apple Pay, Google Pay, online převod
              </div>
              <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>
                Okamžitá platba kartou nebo přes platební bránu. Po kliknutí budete přesměrováni na zabezpečenou platební bránu GoPay.
              </div>
            </div>
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Contact info */}
          <div style={s.section}>
            <div style={s.sectionLabel}>Kontaktní a fakturační údaje</div>

            <div style={{ marginBottom: "14px" }}>
              <label style={s.label12}>Email pro doručení *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vas@email.cz"
                data-testid="input-email"
                style={{ width: "100%", borderRadius: "4px" }}
              />
              <p style={s.hint}>Na tento email vám zašleme odkaz ke stažení a kopii licenční smlouvy</p>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={s.label12}>Celé jméno a příjmení (právní jméno) *</label>
              <input
                type="text"
                value={buyerLegalName}
                onChange={(e) => setBuyerLegalName(e.target.value)}
                required
                placeholder="Jan Novák"
                data-testid="input-legal-name"
                style={{ width: "100%", borderRadius: "4px" }}
              />
              <p style={s.hint}>Vaše skutečné jméno pro licenční smlouvu</p>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={s.label12}>Umělecké jméno *</label>
              <input
                type="text"
                value={buyerArtistName}
                onChange={(e) => setBuyerArtistName(e.target.value)}
                required
                placeholder="YourArtistName"
                data-testid="input-artist-name"
                style={{ width: "100%", borderRadius: "4px" }}
              />
              <p style={s.hint}>Umělecký pseudonym — bude uveden v licenční smlouvě</p>
            </div>

            <div>
              <label style={s.label12}>Adresa trvalého bydliště *</label>
              <input
                type="text"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                required
                placeholder="Ulice 123, Praha 1, 110 00"
                data-testid="input-address"
                style={{ width: "100%", borderRadius: "4px" }}
              />
              <p style={s.hint}>Adresa pro licenční smlouvu dle občanského zákoníku</p>
            </div>
          </div>

          {/* Legal consents */}
          <div style={s.section}>
            <div style={s.sectionLabel}>Souhlasy *</div>

            <div style={s.checkRow}>
              <input
                id="agree-vop"
                type="checkbox"
                checked={agreeVop}
                onChange={e => setAgreeVop(e.target.checked)}
                style={{ marginTop: "2px", flexShrink: 0, cursor: "pointer" }}
              />
              <label htmlFor="agree-vop" style={s.checkLabel}>
                Souhlasím s{" "}
                <a href="/pravni-informace" target="_blank" style={s.link}>Všeobecnými obchodními podmínkami</a>{" "}
                a{" "}
                <a href="/pravni-informace" target="_blank" style={s.link}>Zásadami ochrany osobních údajů</a>{" "}
                VOODOO808. *
              </label>
            </div>

            <div style={{ ...s.divider }} />

            <div style={s.checkRow}>
              <input
                id="agree-digital"
                type="checkbox"
                checked={agreeDigital}
                onChange={e => setAgreeDigital(e.target.checked)}
                style={{ marginTop: "2px", flexShrink: 0, cursor: "pointer" }}
              />
              <label htmlFor="agree-digital" style={s.checkLabel}>
                Beru na vědomí, že okamžikem zpřístupnění digitálního obsahu ke stažení
                ztrácím právo na odstoupení od smlouvy dle{" "}
                <span style={{ color: "#666" }}>§ 1837 písm. l) občanského zákoníku</span>. *
              </label>
            </div>
          </div>

          {error && (
            <div style={{ color: "#ff4444", marginBottom: "16px", padding: "12px", border: "1px solid #333", borderRadius: "4px", fontSize: "14px", lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-filled btn-bounce"
            disabled={loading}
            data-testid="button-submit-order"
            style={{ width: "100%", borderRadius: "4px", fontSize: "15px", padding: "14px" }}
          >
            {loading ? "Zpracování…" : `Zaplatit ${formatCzechPrice(finalTotal)}`}
          </button>

          <p style={{ fontSize: "11px", color: "#444", textAlign: "center", marginTop: "12px", lineHeight: 1.6 }}>
            Odesláním objednávky uzavíráte licenční smlouvu s VOODOO808 (Vojtěch Vojkovský).
            Kopii smlouvy obdržíte na zadaný email.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
