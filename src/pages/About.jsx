// Importing assets
import birdLogo from "@assets/logos/birdLogo.png";
import womanShelf from "@assets/Photos/womanShelf.jpg";
import ticketLogo from "@assets/Assets/ticket-logo.png";
import logo from "@assets/logos/logo2.png";

/**
 * The About page.
 * @returns {React.ReactElement} About component.
 */
function About() {
  return (
    <div className="w-full min-h-screen bg-white">
      {/* HERO SECTION avec design moderne */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#3435FF] via-[#2526B7] to-[#1F2099]">
        {/* Formes géométriques décoratives */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8200] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24 relative z-10">
          <h1 className="text-white font-bold leading-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-8">
            Les banques alimentaires,<br />
            premier <span className="text-[#FF8200]">réseau</span> de distribution<br />
            d'aide alimentaire en <span className="text-[#FF8200]">France</span>
          </h1>
          <div className="max-w-3xl space-y-4 text-white text-lg leading-relaxed">
            <p>
              <span className="font-bold">Le Rayon 22</span> est une épicerie sociale et solidaire dont l'objectif est d'accompagner les personnes en difficulté financière en leur donnant accès à une alimentation à petits prix sur tout le territoire des Côtes d'Armor.
            </p>
            <p>
              <span className="font-bold">Le Rayon 22</span> permet aussi de donner accès à l'aide alimentaire aux personnes qui ne peuvent se rendre aux distributions de nos partenaires.
            </p>
            <p>
              Pour accéder à notre <span className="font-bold">épicerie en ligne</span> en point relais, il faut vous connecter à un compte.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION IMAGE + CARTES avec design amélioré */}
      <div className="relative bg-gradient-to-b from-white to-gray-50">
        {/* Image de fond avec overlay */}
        <div className="hidden lg:block relative w-full h-[600px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white z-10"></div>
          <img
            src={womanShelf}
            alt="Woman at shelf"
            className="w-full h-full object-cover object-center"
          />
          {/* Ticket logo flottant */}
          <img
            src={ticketLogo}
            alt="ticket logo"
            className="absolute top-12 right-12 w-32 md:w-40 rotate-6 drop-shadow-2xl z-20 animate-float"
          />
        </div>

        {/* Cartes d'information */}
        <div className="relative z-30 max-w-7xl mx-auto px-6 lg:px-12 lg:-mt-64 pb-16">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Carte Banque Alimentaire */}
            <div className="mt-2 lg:mt-0 bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-[#3435FF] hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center p-4">
                  <img src={birdLogo} alt="Banque Alimentaire logo" className="w-full h-full object-contain" />
                </div>
              </div>

              <h2 className="text-[#3435FF] font-bold text-2xl mb-6 text-center">
                La Banque Alimentaire des Côtes d'Armor
              </h2>

              <div className="space-y-4 text-gray-700 leading-relaxed mb-8">
                <p className="text-center">
                  La banque alimentaire des côtes d'Armor a été créée le <span className="font-semibold text-[#3435FF]">10 décembre 1984</span>, elle est une des toutes premières en France !
                </p>
                <p className="text-center">
                  Avec le <span className="font-bold text-[#3435FF]">RAYON 22 Épicerie en ligne</span>, la Banque Alimentaire des Côtes d'Armor innove dans le domaine de la distribution alimentaire.
                </p>
                <p className="text-center font-semibold text-[#3435FF]">
                  Vous voulez en savoir plus sur l'organisation de la banque alimentaire ?
                </p>
              </div>

              <div className="flex justify-center">
                <a
                  href="https://www.banquealimentaire.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#FF8200] hover:bg-[#ff9800] text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Site national BA
                </a>
              </div>
            </div>

            {/* Carte Le Rayon */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl p-8 border-t-4 border-[#FF8200] hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center p-4 shadow-lg">
                  <img src={logo} alt="RAYON logo" className="w-full h-full object-contain" />
                </div>
              </div>

              <h2 className="text-[#3435FF] font-bold text-2xl mb-6 text-center">
                Le réseau Le RAYON
              </h2>

              <div className="space-y-4 text-gray-700 leading-relaxed mb-8">
                <p className="text-center">
                  C'est un réseau des <span className="font-bold text-[#3435FF]">Banques Alimentaires</span> dédié à la distribution directe via des épiceries sociales, des camions itinérants et des initiatives spécifiquement pensées pour les jeunes et les étudiants.
                </p>
                <p className="text-center">
                  Il offre une aide diversifiée et de qualité aux personnes vulnérables, là où elles en ont le plus besoin.
                </p>
                <p className="text-center">
                  À l'heure actuelle, <span className="font-bold text-[#FF8200]">six épiceries solidaires</span> sont réparties à travers la France.
                </p>
              </div>

              <div className="flex justify-center">
                <a
                  href="https://lerayon.banquealimentaire.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#3435FF] hover:bg-[#5253ff] text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Site national Le RAYON
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Section Mission & Valeurs */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-center text-[#3435FF] mb-12">
              Notre Mission & Nos Valeurs
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Valeur 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#3435FF] to-[#5253ff] rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-[#3435FF] mb-3">Solidarité</h3>
                <p className="text-gray-600 leading-relaxed">
                  Lutter contre la précarité alimentaire en offrant un accès digne et respectueux à une alimentation de qualité.
                </p>
              </div>

              {/* Valeur 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF8200] to-[#ff9800] rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-[#FF8200] mb-3">Innovation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Moderniser la distribution alimentaire avec des solutions digitales accessibles à tous.
                </p>
              </div>

              {/* Valeur 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#3435FF] to-[#5253ff] rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-[#3435FF] mb-3">Proximité</h3>
                <p className="text-gray-600 leading-relaxed">
                  Être présent sur tout le territoire pour atteindre ceux qui en ont besoin, partout en Côtes d'Armor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(6deg);
          }
          50% {
            transform: translateY(-20px) rotate(6deg);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default About