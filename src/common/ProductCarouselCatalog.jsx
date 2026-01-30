import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext.jsx";
import Slider from "react-slick";
import { supabase } from "../lib/supabaseClient";
import { useAuthor } from "../context/AuthorContext";

import roundLogo from "../assets/logos/roundLogo.png";
import { displayNotification } from "../lib/displayNotification.jsx";

function SampleNextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FF8200",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        zIndex: 10
      }}
      onClick={onClick}
    />
  );
}

function SamplePrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FF8200",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        zIndex: 10
      }}
      onClick={onClick}
    />
  );
}

function ProductCarousel({ data }) {
  const { user } = useAuthor();
  const { cart, setCart, isLoaded } = useCart();

  const [stockIncertainThreshold, setStockIncertainThreshold] = useState(3);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 🧪 Log utile pour debug reload
  useEffect(() => {
    console.log("🔄 Rechargement des produits du cart :", cart);
  }, [cart]);

  // Charger le threshold
  useEffect(() => {
    const fetchStockIncertainThreshold = async () => {
      const { data, error } = await supabase
        .from("constants")
        .select("value")
        .eq("name", "stockIncertainThreshold")
        .maybeSingle();

      if (!error && data) {
        setStockIncertainThreshold(data.value);
      }
    };

    fetchStockIncertainThreshold();
  }, []);

  const settings = {
    infinite: false,
    speed: 500,
    variableWidth: true,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
  };

  // 🔧 DisplayButtons au niveau ProductCarousel (accessible partout)
  function DisplayButtons({ product }) {
    if (!user || !isLoaded) return null;

    const productId = product.id.toString();
    const productInCart = cart?.content?.[productId] || 0;

    const AddToCart = () => {
      console.log("➕ Ajout :", product.name);
      console.log("📦 Cart avant :", cart);

      if (product.stock >= productInCart + 1) {
        setCart(prev => ({
          ...prev,
          content: {
            ...prev.content,
            [productId]: productInCart + 1
          }
        }));
      } else {
        displayNotification(
          "Stock de " + product.name + " insuffisant",
          "",
          "danger"
        );
      }
    };

    const RemoveFromCart = () => {
      console.log("➖ Retrait :", product.name);
      console.log("📦 Cart avant :", cart);

      if (!cart?.content?.[productId]) return;

      if (productInCart <= 1) {
        const newCart = {
          ...cart,
          content: { ...cart.content }
        };
        delete newCart.content[productId];

        setCart(newCart);
      } else {
        setCart(prev => ({
          ...prev,
          content: {
            ...prev.content,
            [productId]: productInCart - 1
          }
        }));
      }
    };

    if (productInCart > 0) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={RemoveFromCart}
            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold flex items-center justify-center"
          >
            −
          </button>
          <span className="text-[#3435FF] text-xl font-bold min-w-[2rem] text-center">
            {productInCart}
          </span>
          <button
            onClick={AddToCart}
            className="w-8 h-8 bg-[#3435FF] hover:bg-[#5253ff] text-white rounded-full font-bold flex items-center justify-center"
          >
            +
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={AddToCart}
        className="w-8 h-8 bg-[#3435FF] hover:bg-[#5253ff] text-white rounded-full font-bold flex items-center justify-center"
      >
        +
      </button>
    );
  }

  function DisplayProduct({ product }) {
    return (
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden w-64 lg:w-72 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-100">
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 border-b-2 border-[#3435FF]">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-[#FF8200] text-3xl font-bold">
                {product.salePrice}€
              </div>
              <div className="text-red-500 text-xs line-through">
                Prix magasin : {product.price}€
              </div>
            </div>
            <DisplayButtons product={product} />
          </div>
        </div>

        <div className="relative bg-white h-48 flex items-center justify-center p-4">
          <img
            src={product.imageUrl || roundLogo}
            alt={product.name}
            className="max-h-full max-w-full object-contain"
          />
          {product.stock <=
            (product.productStockIncertainThreshold ||
              stockIncertainThreshold) && (
              <div className="absolute top-0 left-0 right-0 bg-[#FF8200] bg-opacity-95 text-white text-center py-2 px-4 font-bold text-sm shadow-lg">
                STOCK INCERTAIN
              </div>
            )}
        </div>

        <div className="p-4">
          <h3 className="text-[#3435FF] text-lg font-bold mb-1 line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>

          <button
            className="w-full bg-gradient-to-r from-[#3435FF] to-[#5253ff] hover:from-[#5253ff] hover:to-[#3435FF] text-white py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            onClick={() => setSelectedProduct(product)}
          >
            Voir les détails
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 mx-auto mb-12">
      <Slider {...settings}>
        {data.map(product => (
          <div key={product.id} className="p-4">
            <DisplayProduct product={product} />
          </div>
        ))}
      </Slider>

      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#3435FF] to-[#5253ff] p-6 text-white">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-all"
              >
                ✕
              </button>
              <h2 className="text-3xl font-bold pr-12">
                {selectedProduct.name}
              </h2>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Image */}
                <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center">
                  <img
                    src={selectedProduct.imageUrl || roundLogo}
                    alt={selectedProduct.name}
                    className="max-h-80 max-w-full object-contain"
                  />
                </div>

                {/* Détails */}
                <div>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-4xl font-bold text-[#FF8200]">
                        {selectedProduct.salePrice}€
                      </span>
                      <span className="text-xl text-red-500 line-through">
                        {selectedProduct.price}€
                      </span>
                    </div>
                    <div className="text-green-600 font-semibold">
                      Économie : {(selectedProduct.price - selectedProduct.salePrice).toFixed(2)}€
                    </div>
                  </div>

                  {selectedProduct.stock <= (selectedProduct.productStockIncertainThreshold || stockIncertainThreshold) && (
                    <div className="bg-[#FF8200] bg-opacity-10 border-l-4 border-[#FF8200] p-4 mb-4">
                      <p className="text-[#FF8200] font-bold">⚠️ Stock incertain</p>
                    </div>
                  )}

                  {selectedProduct.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-[#3435FF] mb-2">Description</h3>
                      <p className="text-gray-700">{selectedProduct.description}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#3435FF] mb-2">Stock disponible</h3>
                    <p className="text-gray-700">{selectedProduct.stock} unité(s)</p>
                  </div>

                  <DisplayButtons product={selectedProduct} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductCarousel;