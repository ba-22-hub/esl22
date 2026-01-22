// Importing dependencies
import {
  Routes,
  Route,
  Link,
  useNavigate,
  Outlet,
} from "react-router-dom";
import React from 'react';
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import 'leaflet/dist/leaflet.css';


import { useAuthor } from "@context/AuthorContext.jsx";

// Importing the style
import './styles/navbar.css'


// Importing assets
import rayonLogo from "@assets/logos/roundLogo.png"
import avatar from "@assets/Assets/avatar2.png"

// Importing all the pages
import About from '@pages/About.jsx'
import Cart from '@pages/Cart.jsx'
import Catalog from '@pages/Catalog.jsx'
import Delivery from '@pages/Delivery.jsx'
import Contact from '@pages/Contact.jsx'
import ForgotPassword from '@pages/ForgotPassword.jsx'
import Home from '@pages/Home.jsx'
import HowItWorks from '@pages/HowItWorks.jsx'
import Login from '@pages/Login.jsx'
import More from '@pages/More.jsx'
import News from '@pages/News.jsx'
import Register from '@pages/Register.jsx'
import Sponsor from '@pages/Sponsor.jsx'
import Account from "@pages/Account.jsx";
import PaymentSuccess from "@pages/PaymentSuccess.jsx";
import ResetPassword from "./pages/ResetPassword";
import ChosePickUpPoint from "@pages/ChosePickUpPoint.jsx";

// Importing common components
import Footer from "@common/Footer.jsx";

/**
 * A component wrapping all the website pages.
 * @returns {React.ReactElement} App component.
 */
function App() {
  const { user } = useAuthor()
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#FEF7F1]">
      <Toaster position="top-right" />

      <nav className="bg-white shadow-lg border-b border-gray-200 lg:mx-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/">
                <img src={rayonLogo} alt="RAYON logo" className="h-10 w-10" />
              </Link>
            </div>

            {/* Navigation Links - visible à partir de lg */}
            <div className="hidden lg:block">
              <div className="ml-10 flex items-center space-x-8">
                <Link to="/about" className="text-[#3435FF] hover:text-[#5253ff] px-3 py-2 text-sm font-medium transition-colors">
                  Qui sommes-nous ?
                </Link>
                <Link to="/how-it-works" className="text-[#3435FF] hover:text-[#5253ff] px-3 py-2 text-sm font-medium transition-colors">
                  Comment ça marche ?
                </Link>
                <Link to="/more" className="text-[#3435FF] hover:text-[#5253ff] px-3 py-2 text-sm font-medium transition-colors">
                  Toujours plus
                </Link>
                <Link to="/catalog" className="text-[#3435FF] hover:text-[#5253ff] px-3 py-2 text-sm font-medium transition-colors">
                  Nos produits
                </Link>
                <Link to="/cart" className="text-[#3435FF] hover:text-[#5253ff] px-3 py-2 text-sm font-medium transition-colors">
                  Mon panier
                </Link>
                <Link to="/delivery" className="text-[#3435FF] hover:text-[#5253ff] px-3 py-2 text-sm font-medium transition-colors">
                  Mes livraisons
                </Link>
                <Link to="/contact" className="text-[#3435FF] hover:text-[#5253ff] px-3 py-2 text-sm font-medium transition-colors">
                  Nous contacter
                </Link>
              </div>
            </div>

            {/* Right side - visible à partir de lg */}
            <div className="hidden lg:flex items-center space-x-4">
              {!user && (
                <Link to="/register" className="bg-[#FF8200] hover:bg-[#ff9800] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors h-10 flex items-center">
                  S'inscrire
                </Link>
              )}
              <Link to={`${user ? '/account' : '/login'}`} className="flex-shrink-0">
                <div className="bg-[#FF8200] p-1 rounded-lg h-10 w-10 flex items-center justify-center">
                  <img src={avatar} alt="User avatar" className="h-8 w-8 rounded-full" />
                </div>
              </Link>
            </div>

            {/* Mobile (< lg) : Avatar + Burger */}
            <div className="flex lg:hidden items-center space-x-4">
              <Link to={`${user ? '/account' : '/login'}`} className="flex-shrink-0">
                <div className="bg-[#FF8200] p-1 rounded-lg h-10 w-10 flex items-center justify-center">
                  <img src={avatar} alt="User avatar" className="h-8 w-8 rounded-full" />
                </div>
              </Link>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-rayonblue text-2xl text-bold hover:text-[#3435FF] focus:outline-none transition-colors"
              >
                {isMenuOpen ? "X" : "☰"}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile dépliable (< lg uniquement) */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 border-t border-gray-200">
            <Link
              to="/about"
              onClick={() => setIsMenuOpen(false)}
              className="block text-[#3435FF] hover:bg-gray-100 hover:text-[#5253ff] px-3 py-3 rounded-md text-base font-medium transition-colors"
            >
              Qui sommes-nous ?
            </Link>
            <Link
              to="/how-it-works"
              onClick={() => setIsMenuOpen(false)}
              className="block text-[#3435FF] hover:bg-gray-100 hover:text-[#5253ff] px-3 py-3 rounded-md text-base font-medium transition-colors"
            >
              Comment ça marche ?
            </Link>
            <Link
              to="/more"
              onClick={() => setIsMenuOpen(false)}
              className="block text-[#3435FF] hover:bg-gray-100 hover:text-[#5253ff] px-3 py-3 rounded-md text-base font-medium transition-colors"
            >
              Toujours plus
            </Link>
            <Link
              to="/catalog"
              onClick={() => setIsMenuOpen(false)}
              className="block text-[#3435FF] hover:bg-gray-100 hover:text-[#5253ff] px-3 py-3 rounded-md text-base font-medium transition-colors"
            >
              Nos produits
            </Link>
            <Link
              to="/cart"
              onClick={() => setIsMenuOpen(false)}
              className="block text-[#3435FF] hover:bg-gray-100 hover:text-[#5253ff] px-3 py-3 rounded-md text-base font-medium transition-colors"
            >
              Mon panier
            </Link>
            <Link
              to="/delivery"
              onClick={() => setIsMenuOpen(false)}
              className="block text-[#3435FF] hover:bg-gray-100 hover:text-[#5253ff] px-3 py-3 rounded-md text-base font-medium transition-colors"
            >
              Mes livraisons
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="block text-[#3435FF] hover:bg-gray-100 hover:text-[#5253ff] px-3 py-3 rounded-md text-base font-medium transition-colors"
            >
              Nous contacter
            </Link>

            {!user && (
              <Link
                to="/register"
                onClick={() => setIsMenuOpen(false)}
                className="block bg-[#FF8200] hover:bg-[#ff9800] text-white px-3 py-3 rounded-lg text-base font-medium transition-colors text-center mx-3 mt-4"
              >
                S'inscrire
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Creating the routes to the website pages */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/login" element={<Login />} />
        <Route path="/more" element={<More />} />
        <Route path="/news" element={<News />} />
        <Route path="/register" element={<Register />} />
        <Route path="/sponsor" element={<Sponsor />} />
        <Route path="/account" element={<Account />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/chose-pickup-point" element={<ChosePickUpPoint />} />
        {/* {/* Redirecting to Error404 page if the route does not exist */}
        {/* <Route path="*" element={<div className="text-center mt-20 text-2xl">Page not found</div>} />  */}
      </Routes>

      <div className="bg-[#FEF7F1]">
        <Footer></Footer>
      </div>
    </div>
  );
}

export default App
