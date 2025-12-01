import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCartIcon, UserIcon, MenuIcon, XIcon } from "lucide-react";
import { CartDrawer } from "../CartDrawer";
import { useGetMeQuery } from "../../store/api/authApi";
import { useGetCartQuery } from "../../store/api/cartApi";
import { useGetPointsSummaryQuery } from "../../store/api/profileApi";
import { SafeImage } from "../SafeImage";

export function Header() {
  const [isSticky, setIsSticky] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem("accessToken");
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(
    undefined,
    {
      skip: !isAuthenticated,
    }
  );
  const { data: cartData } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: pointsSummary } = useGetPointsSummaryQuery(undefined, {
    skip: !isAuthenticated,
  });
  const userPoints = pointsSummary?.total_points ?? 0;

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleCart = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setIsCartOpen(!isCartOpen);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsProfileOpen(false);
    navigate("/login");
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "All Competitions", href: "/competitions" },
    { name: "Winners", href: "/winners" },
    { name: "Entry List", href: "/entries" },
    { name: "FAQs", href: "/faq" },
    { name: "Live Draws", href: "/live-draws" },
  ];

  const profileLinks = [
    { name: "Account Info", href: "/profile" },
    { name: "Terms & Conditions", href: "/terms-and-conditions" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    {
      name: "Logout",
      href: "#logout",
      action: handleLogout,
    },
  ];

  return (
    <>
      <header
        className={`w-full z-50 transition-all duration-300 ${
          isSticky
            ? "fixed top-0 header-blur py-3"
            : "relative bg-transparent py-5"
        }`}
      >
        <div className="container-premium flex items-center justify-between">
          {/* Logo + Center Navigation */}
          <div className="flex items-center flex-1">
            <Link to="/" className="text-2xl font-bold text-white mr-6">
              <SafeImage
                src="/Simplification.svg"
                alt="Brand Logo"
                className="w-28 -mb-2"
              />
            </Link>

            {/* CENTERED NAVIGATION */}
            <nav className="hidden md:flex space-x-8 justify-center items-center flex-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-all duration-200 relative ${
                    location.pathname === item.href
                      ? "text-white"
                      : "text-text-secondary hover:text-white"
                  }`}
                >
                  {item.name}
                  {location.pathname === item.href && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-accent rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* PROFILE / CART / LOGIN */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center bg-gradient-start px-3 py-1.5 rounded-full">
                  <span className="text-sm font-medium text-text-secondary mr-1">
                    Points:
                  </span>
                  <span className="text-sm font-bold text-white">
                    {userPoints.toLocaleString()}
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={toggleProfile}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-start hover:bg-gradient-end transition-colors duration-200"
                  >
                    <UserIcon className="w-5 h-5 text-white" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-overlay rounded-xl shadow-premium z-50 py-2">
                      {isUserLoading ? (
                        <div className="px-4 py-2 text-sm text-text-primary">
                          Loading...
                        </div>
                      ) : userData ? (
                        <div className="px-4 py-3 border-b border-gray-700">
                          <p className="text-sm font-semibold text-white truncate">
                            {userData.name}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {userData.email}
                          </p>
                        </div>
                      ) : null}
                      <div className="py-1">
                        {profileLinks.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => {
                              if (item.action) item.action();
                              setIsProfileOpen(false);
                            }}
                            className="block px-4 py-2 text-sm text-text-primary hover:bg-accent/20 transition-colors duration-200"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleCart}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-start hover:bg-gradient-end transition-colors duration-200"
                >
                  <ShoppingCartIcon className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold px-1">
                    {cartData?.summary?.item_count ?? 0}
                  </span>
                </button>
              </>
            ) : (
              // keep it inline-flex on md+ with controlled padding so size stays normal
              <Link
                to="/login"
                className="hidden md:inline-flex btn-premium px-4 py-2 h-auto items-center justify-center"
              >
                Login / Signup
              </Link>
            )}

            <button
              onClick={toggleMenu}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-start hover:bg-gradient-end transition-colors duration-200"
            >
              {isMenuOpen ? (
                <XIcon className="w-5 h-5 text-white" />
              ) : (
                <MenuIcon className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {isMenuOpen && (
          <div className="md:hidden glass-overlay absolute top-full left-0 w-full z-50">
            <div className="container-premium py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block py-2 text-base font-medium ${
                    location.pathname === item.href
                      ? "text-white"
                      : "text-text-secondary"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {!isAuthenticated && (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-2 text-base font-medium text-accent"
                >
                  Login / Signup
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* DRAWERS & MODALS */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
