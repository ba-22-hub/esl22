// Importing assets
import birdLogo from "@assets/logos/birdLogo.png";
import preparation from "@assets/Photos/preparation_2.jpg"

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
      {/* L'image passe en fond du bandeau plutôt qu'en bande pleine : la page
          se resserre, et la photographie reste présente sans occuper six cents
          pixels de hauteur. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B62D4] via-[#1553B8] to-[#0F429A]">
        <img
          src={preparation}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity pointer-events-none"
        />

        {/* Formes géométriques décoratives */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8200] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24 relative z-10">
          <h1 className="text-white font-bold leading-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-8 drop-shadow-lg">
            {content.hero.title.line1}<br />
            {content.hero.title.line2} <span className="text-[#FF8200]">{content.hero.title.highlight1}</span> {content.hero.title.line3}<br />
            {content.hero.title.line4} <span className="text-[#FF8200]">{content.hero.title.highlight2}</span>
          </h1>
          <div className="max-w-3xl space-y-4 text-white text-lg leading-relaxed drop-shadow">
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

      {/* SECTION CARTES */}
      {/* Fond vert des Côtes-d'Armor : les cartes blanches s'y détachent, là où
          un fond blanc sous des cartes blanches ne délimitait rien. Fait écho à
          la section « Comment commander » de l'accueil. */}
      <div className="relative bg-gradient-to-b from-white via-[#3DA46A] to-[#0F8140]">

        {/* Cartes d'information - Banque Alimentaire des Côtes d'Armor */}
        <div className="relative z-30 max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-16">
          <div className="flex justify-center">
            {/* Carte Banque Alimentaire */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-[#FF8200] hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center p-4">
                    <img src={birdLogo} alt={content.images.alt.birdLogo} className="w-full h-full object-contain" />
                  </div>
                </div>

                <h2 className="text-[#1B62D4] font-bold text-2xl mb-6 text-center">
                  {content.cards.banqueAlimentaire.title}
                </h2>

                <div className="space-y-4 text-gray-700 leading-relaxed mb-8">
                  {content.cards.banqueAlimentaire.paragraphs.map((para, index) => (
                    <p key={index} className="text-center">
                      {para.text}
                      {para.highlight && (
                        <span className={`font-${para.highlight === "10 décembre 1984" ? "semibold" : "bold"} text-[#1B62D4]`}>
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
            </div>
        </div>

        {/* Section Mission & Valeurs */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-center text-[#1B62D4] mb-12">
              {content.mission.title}
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {content.mission.values.map((value, index) => (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${
                    value.number === "2" ? "from-[#FF8200] to-[#ff9800]" : "from-[#1B62D4] to-[#4A8AE0]"
                  } rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold`}>
                    {value.number}
                  </div>
                  <h3 className={`text-xl font-bold ${
                    value.number === "2" ? "text-[#FF8200]" : "text-[#1B62D4]"
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
