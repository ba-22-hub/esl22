import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

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
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
  };

  return (
    <div className="px-8 max-w-7xl mx-auto mb-16">
      <Slider {...settings}>
        {data.map((product, idx) => (
          <div key={idx} className="p-4">
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-100">
              {/* En-tête avec prix */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-4 border-b-2 border-[#3435FF]">
                <div className="text-center">
                  <div className="text-[#FF8200] text-3xl font-bold mb-1">
                    {product.salePrice}€
                  </div>
                  <div className="text-red-500 text-sm line-through mb-2">
                    Prix magasin : {product.price}€
                  </div>
                  <div className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full inline-block">
                    -{((1 - product.salePrice / product.price) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Image du produit */}
              <div className="bg-white h-48 flex items-center justify-center p-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Informations produit */}
              <div className="p-4 text-center">
                <h3 className="text-[#3435FF] text-lg font-bold min-h-[3.5rem] flex items-center justify-center">
                  {product.name}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </Slider>

      <style jsx>{`
        .slick-dots li button:before {
          color: #3435FF;
        }
        .slick-dots li.slick-active button:before {
          color: #FF8200;
        }
      `}</style>
    </div>
  );
}

export default ProductCarousel;