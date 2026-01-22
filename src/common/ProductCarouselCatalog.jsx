import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import Slider from "react-slick";
import { supabase } from "../lib/supabaseClient";
import { useAuthor } from "../context/AuthorContext";

// Importing common components
import FunctionButton from "../common/FunctionButton";

// Importing assets
import roundLogo from "../assets/logos/roundLogo.png";
import { displayNotification } from "../lib/displayNotification.jsx";

function SampleNextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "block", background: "#FF8200" }}
      onClick={onClick}
    />
  );
}

function SamplePrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "triangle", background: "#FF8200" }}
      onClick={onClick}
    />
  );
}

function ProductCarousel({ data }) {
  const { user } = useAuthor();
  const { cart, setCart } = useCart();
  const [stockIncertainThreshold, setStockIncertainThreshold] = useState(3);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchStockIncertainThreshold = async () => {
    const { data, error } = await supabase
      .from("constants")
      .select("value")
      .eq("name", "stockIncertainThreshold")
      .maybeSingle();
    if (!error) {
      setStockIncertainThreshold(data.value);
    }
  };
  fetchStockIncertainThreshold();

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

  function DisplayProduct({ product }) {
    function DisplayButtons({ product }) {
      if (user) {
        const AddToCart = () => {
          const productAmountInCart = cart.content[product.id] || 0
          if (product.stock >= productAmountInCart) {
            setCart(prev => ({
              ...prev,
              content: {
                ...prev.content,
                [product.id]: (prev.content[product.id] || 0) + 1,
              }
            }));
          } else {
            displayNotification("Stock de " + product.name + " insuffisant", "", "danger")
          }
        };

        const RemoveFromCart = () => {
          if (Object.keys(cart.content).includes(product.id)) {
            if (cart.content[product.id] <= 1) {
              setCart((prevData) => {
                const newCart = { ...prevData };
                delete newCart.content[product.id];
                return newCart;
              });
            } else {
              setCart(prev => ({
                ...prev,
                content: {
                  ...prev.content,
                  [product.id]: prev.content[product.id] -1,
                }
              }));
            }
          }
        };
        
        if (Object.keys(cart.content).includes(product.id) && cart.content[product.id] > 0) {
          return (
            <div className="flex jusitfy-end">
              <FunctionButton
                className="text-white bg-[#FF8200] hover:bg-[#ff9800] rounded-full text-sm px-2 py-0.5 mb-2"
                buttonText="-"
                fun={RemoveFromCart}
              />
              <p className="text-[#3435FF] text-xl mr-1 ml-1 font-semibold">
                {cart.content[product.id] || ""}
              </p>
              <FunctionButton
                className="text-white bg-[#3435FF] hover:bg-[#5253ff] rounded-full text-sm px-2 py-0.5 mb-2 ml-0 text-right"
                buttonText="+"
                fun={AddToCart}
              />
            </div>
          );
        } else {
          return (
            <div className="flex jusitfy-end">
              <FunctionButton
                className="text-white bg-[#3435FF] hover:bg-[#5253ff] rounded-full text-sm px-2 py-0.5 mb-2 ml-0 text-right"
                buttonText="+"
                fun={AddToCart}
              />
            </div>
          );
        }
      }
    }

    return (
      <>
        <div className="bg-white shadow-md lg:rounded-xl overflow-hidden lg:w-60 w-44 ml-0.1">
          <div className="p-2 lg:p-4">
            <div className="flex justify-between">
              <h3 className="text-[#3435FF] text-2xl lg:text-3xl font-semibold text-left">
                {product.salePrice}€
              </h3>
              <DisplayButtons product={product} />
            </div>
            <div className="text-[#ff6161] text-xs ml-0">
              Prix moyen en magasin : {product.price}€
            </div>
          </div>
          <div className="relative text-center">
            <img
              src={product.imageUrl || roundLogo}
              alt={product.name}
              className="w-full h-28 lg:h-40 object-contain"
            />
            {((product.productStockIncertainThreshold && product.stock <= product.productStockIncertainThreshold) || (product.stock <= stockIncertainThreshold)) && (
              <div className="w-full absolute top-0 left-0 text-center mt-0">
                <p className="lg:text-xl text-white bg-rayonorange bg-opacity-80 text-center">
                  STOCK INCERTAIN
                </p>
              </div>
            )}
          </div>
          <div className="p-2 lg:p-4">
            <p className="text-[#3435FF] text-lg font-semibold">
              {product.name}
            </p>
            <p className="text-[#3435FF] text-xs">
              {product.weight}g, {product.category || ""}
            </p>
            <button
              className="mt-2 text-[#FF8200] underline text-sm lg:text-lg"
              onClick={() => setSelectedProduct(product)}
            >
              Voir plus
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="px-8 mx-auto mb-12 bg-rayonblue lg:bg-inherit">
      <Slider {...settings}>
        {data.map((product, idx) => (
          <div key={idx} className="p-4">
            <DisplayProduct product={product}></DisplayProduct>
          </div>
        ))}
      </Slider>

      {/* Details */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-3/4 max-w-4xl p-6 relative flex flex-col md:flex-row ">
            {/* Close button */}
            <button
              className="absolute top-2 right-2 text-black hover:text-red text-7xl"
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>

            {/* Picture */}
            <div className="md:w-1/2 flex items-center justify-center">
              <img
                src={selectedProduct.imageUrl || roundLogo}
                alt={selectedProduct.name}
                className="max-h-80 object-contain"
              />
            </div>

            {/* Informations */}
            <div className="md:w-1/2 pl-6 text-left">
              <h2 className="text-2xl font-bold text-[#3435FF] mb-4">
                {selectedProduct.name}
              </h2>
              <ul className="space-y-2 text-gray-700">
                <li>
                  <strong>Catégorie :</strong> {selectedProduct.category}
                </li>
                <li>
                  <strong>Poids :</strong> {selectedProduct.weight} g
                </li>
                <li>
                  <strong>Prix au rayon :</strong> {selectedProduct.salePrice} €
                </li>
                <li>
                  <strong>Prix moyen en magasin :</strong> {selectedProduct.price} €
                </li>
                <li>
                  <strong>Stock :</strong> {selectedProduct.stock}
                </li>
              </ul>
              {selectedProduct.description && (
                <p className="mt-4 text-gray-600">
                  <strong>Description : </strong>{selectedProduct.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductCarousel;
