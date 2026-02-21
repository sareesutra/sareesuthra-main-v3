import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, User, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import SearchDialog from "./SearchDialog";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

import { settingsService } from "@/lib/services/settingsService";
import AnnouncementBanner from "./AnnouncementBanner";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Banner State
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerText, setBannerText] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      const enabled = await settingsService.getJsonSetting<boolean>("banner_enabled", false);
      const text = await settingsService.getSetting("banner_text");
      setBannerEnabled(enabled);
      setBannerText(text || "");
    };
    fetchSettings();
  }, [location.pathname]); // Re-check on nav change potentially, or just mount

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // On non-home pages, we want the "scrolled" style (dark text) by default unless actual scrolling happens
  const isTransparent = isHome && !isScrolled;

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Blog", href: "/blog" },
  ];

  return (
    <>
      <AnnouncementBanner enabled={bannerEnabled} text={bannerText} />
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] top-0 px-4 md:px-0 ${bannerEnabled && bannerText ? 'mt-8' : 'mt-0'} 
        ${!isTransparent
            ? "py-3 mt-4 mx-4 md:mx-8 border-gray-200/50 shadow-sm"
            : "bg-transparent py-6"
          } 
        ${!isTransparent ? "glass rounded-[32px] bg-white/80" : "pt-8 pb-12"}`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-24 md:h-32">
            {/* Logo */}
            <Link to="/" className="flex flex-col items-center group drop-shadow-sm">
              <img
                src="/saree-sutra-logo.png"
                alt="Saree Sutra"
                className={`h-10 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 relative group font-medium ${!isTransparent ? 'text-puniora-black' : 'text-puniora-black'} hover:text-puniora-orange-500`}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-puniora-orange-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}

              {/* Policy Pages Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 relative group flex items-center gap-1 font-medium ${!isTransparent ? 'text-puniora-black' : 'text-puniora-black'} hover:text-puniora-orange-500 outline-none`}>
                  Policies
                  <ChevronDown className="h-3 w-3" />
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-puniora-orange-500 transition-all duration-300 group-hover:w-full"></span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/90 backdrop-blur-xl border border-gray-100 shadow-xl text-puniora-black">
                  <DropdownMenuItem asChild className="focus:bg-puniora-orange-50 focus:text-puniora-orange-600 cursor-pointer">
                    <Link to="/privacy-policy" className="text-xs uppercase tracking-wider block w-full text-puniora-black">
                      Privacy Policy
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-puniora-orange-50 focus:text-puniora-orange-600 cursor-pointer">
                    <Link to="/shipping-policy" className="text-xs uppercase tracking-wider block w-full text-puniora-black">
                      Shipping Policy
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-puniora-orange-50 focus:text-puniora-orange-600 cursor-pointer">
                    <Link to="/refund-policy" className="text-xs uppercase tracking-wider block w-full text-puniora-black">
                      Refund & Return
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className={`hover:text-puniora-orange-500 hover:bg-transparent transition-colors ${!isTransparent ? 'text-puniora-black' : 'text-puniora-black'}`}
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search"
              >
                <Search className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`relative hover:text-puniora-orange-500 hover:bg-transparent transition-colors ${!isTransparent ? 'text-puniora-black' : 'text-puniora-black'}`}
                onClick={openCart}
                aria-label="Open Cart"
              >
                <ShoppingBag className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 bg-puniora-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                    {totalItems}
                  </span>
                )}
              </Button>


              <Link to={user ? "/account" : "/auth"}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`hover:text-puniora-orange-500 hover:bg-transparent transition-colors ${!isTransparent ? 'text-puniora-black' : 'text-puniora-black'}`}
                  aria-label="User Account"
                >
                  <User className="h-6 w-6" />
                </Button>
              </Link>

              {/* Mobile Menu - Sheet Implementation */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`hover:text-puniora-orange-500 hover:bg-transparent transition-colors ${!isTransparent ? 'text-puniora-black' : 'text-puniora-black'}`}
                      aria-label="Open Menu"
                    >
                      <Menu className="h-8 w-8" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[85vw] sm:w-[380px] bg-white/95 backdrop-blur-xl border-l border-gray-100 p-0 flex flex-col">
                    <SheetHeader className="p-6 border-b border-gray-100/50 items-center justify-center h-24 text-center">
                      <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
                      <img src="/saree-sutra-logo.png" alt="Saree Sutra" className="h-10 w-auto object-contain" />
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                      <nav className="flex flex-col space-y-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-2">Menu</p>
                        {navLinks.map((link, i) => (
                          <SheetClose key={link.label} asChild>
                            <Link
                              to={link.href}
                              className="text-2xl font-heading tracking-wide text-puniora-black hover:text-puniora-orange-500 transition-all duration-300 group flex items-center gap-4 py-2 border-b border-gray-50/50"
                            >
                              <span className="text-[10px] font-sans text-puniora-orange-500 opacity-50 group-hover:opacity-100 transition-opacity">0{i + 1}</span>
                              <span className="group-hover:translate-x-2 transition-transform duration-300">{link.label}</span>
                            </Link>
                          </SheetClose>
                        ))}
                      </nav>

                      <div className="space-y-4 mt-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-2">Policies</p>
                        <SheetClose asChild>
                          <Link to="/privacy-policy" className="block text-base font-medium text-gray-600 hover:text-puniora-orange-500 transition-colors py-1">Privacy Policy</Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link to="/shipping-policy" className="block text-base font-medium text-gray-600 hover:text-puniora-orange-500 transition-colors py-1">Shipping Policy</Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link to="/refund-policy" className="block text-base font-medium text-gray-600 hover:text-puniora-orange-500 transition-colors py-1">Refund & Return</Link>
                        </SheetClose>
                      </div>
                    </div>

                    <SheetFooter className="p-6 border-t border-gray-100/50 bg-gray-50/50">
                      <div className="w-full flex flex-col gap-4">
                        <SheetClose asChild>
                          <Link to={user ? "/account" : "/auth"}>
                            <Button className="w-full bg-puniora-black text-white hover:bg-puniora-orange-500 transition-colors h-12 rounded-xl text-xs uppercase tracking-widest font-bold">
                              {user ? "My Account" : "Login / Register"}
                            </Button>
                          </Link>
                        </SheetClose>
                        <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">
                          © 2026 Saree Sutra
                        </p>
                      </div>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>

            </div>
          </div>
        </div>

        <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </header>
    </>
  );
};

export default Header;
