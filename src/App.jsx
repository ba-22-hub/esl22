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
import Faq from "./pages/Faq";
import Confidentiality from "@pages/Confidentiality";
import LegalMentions from "./pages/LegalMentions";
import OperatingCharter from "./pages/OperatingCharter";

// Importing common components
import Footer from "@common/Footer.jsx";
import ClientNavbar from "@common/ClientNavbar";

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

      <ClientNavbar></ClientNavbar>

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
        <Route path="/Faq" element={<Faq />} />
        <Route path="/confidentiality" element={<Confidentiality />} />
        <Route path="/legal-mentions" element={<LegalMentions />} />
        <Route path="/operationg-charter" element={<OperatingCharter />} />
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
