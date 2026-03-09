// Importing assets
import birdLogo from "@assets/logos/birdLogo.png";
import womanShelf from "@assets/Photos/womanShelf.jpg";
import ticketLogo from "@assets/Assets/ticket-logo.png";
import logo from "@assets/logos/logo2.png";

// Importing content
import content from "../content/about_content.json";

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
            {content.hero.title.line1}<br />
            {content.hero.title.line2} <span className="text-[#FF8200]">{content.hero.title.highlight1}</span> {content.hero.title.line3}<br />
            {content.hero.title.line4} <span className="text-[#FF8200]">{content.hero.title.highlight2}</span>
          </h1>
          <div className="max-w-3xl space-y-4 text-white text-lg leading-relaxed">
            {content.hero.paragraphs.map((para, index) => (
              <p key={index}>
                {para.boldText && <span className="font-bold">{` ${para.boldText}`}</span>}
                {para.text && para.text}
                {para.textAfter && ` ${para.textAfter}`}
              </p>
            ))}
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
            alt={content.images.alt.womanShelf}
            className="w-full h-full object-cover object-center"
          />
          {/* Ticket logo flottant */}
          <img
            src={ticketLogo}
            alt={content.images.alt.ticketLogo}
            className="absolute top-12 right-12 w-32 md:w-40 rotate-6 drop-shadow-2xl z-20 animate-float"
          />
        </div>

        {/* Cartes d'information */}
        <div className="relative z-30 max-w-7xl mx-auto px-6 lg:px-12 lg:-mt-64 pb-16">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Carte Banque Alimentaire */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-[#3435FF] hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center p-4">
                  <img src={birdLogo} alt={content.images.alt.birdLogo} className="w-full h-full object-contain" />
                </div>
              </div>

              <h2 className="text-[#3435FF] font-bold text-2xl mb-6 text-center">
                {content.cards.banqueAlimentaire.title}
              </h2>

              <div className="space-y-4 text-gray-700 leading-relaxed mb-8">
                {content.cards.banqueAlimentaire.paragraphs.map((para, index) => (
                  <p key={index} className="text-center">
                    {para.text}
                    {para.highlight && (
                      <span className={`font-${para.highlight === "10 décembre 1984" ? "semibold" : "bold"} text-[#3435FF]`}>
                        {` ${para.highlight}`}
                      </span>
                    )}
                    {para.textAfter && para.textAfter}
                  </p>
                ))}
              </div>

              <div className="flex justify-center">
                <a
                  href={content.cards.banqueAlimentaire.button.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#FF8200] hover:bg-[#ff9800] text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  {content.cards.banqueAlimentaire.button.text}
                </a>
              </div>
            </div>

            {/* Carte Le Rayon */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl p-8 border-t-4 border-[#FF8200] hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center p-4 shadow-lg">
                  <img src={logo} alt={content.images.alt.rayonLogo} className="w-full h-full object-contain" />
                </div>
              </div>

              <h2 className="text-[#3435FF] font-bold text-2xl mb-6 text-center">
                {content.cards.leRayon.title}
              </h2>

              <div className="space-y-4 text-gray-700 leading-relaxed mb-8">
                {content.cards.leRayon.paragraphs.map((para, index) => (
                  <p key={index} className="text-center">
                    {para.text}
                    {para.highlight && (
                      <span className={`font-bold text-[${para.highlight === "Banques Alimentaires" ? "#3435FF" : "#FF8200"}]`}>
                        {` ${para.highlight}`}
                      </span>
                    )}
                    {para.textAfter && ` ${para.textAfter}`}
                  </p>
                ))}
              </div>

              <div className="flex justify-center">
                <a
                  href={content.cards.leRayon.button.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#3435FF] hover:bg-[#5253ff] text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  {content.cards.leRayon.button.text}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Section Mission & Valeurs */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-center text-[#3435FF] mb-12">
              {content.mission.title}
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {content.mission.values.map((value, index) => (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${
                    value.number === "2" ? "from-[#FF8200] to-[#ff9800]" : "from-[#3435FF] to-[#5253ff]"
                  } rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold`}>
                    {value.number}
                  </div>
                  <h3 className={`text-xl font-bold ${
                    value.number === "2" ? "text-[#FF8200]" : "text-[#3435FF]"
                  } mb-3`}>
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About