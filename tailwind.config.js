/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Palette reprise des couleurs des Côtes-d'Armor. L'orange des
        // Banques Alimentaires est conservé pour les actions : il assure le
        // contraste que le vert ne donnerait pas, et reste l'identité du
        // réseau auquel l'épicerie appartient.
        //
        // Les noms « rayon* » sont maintenus le temps de la transition : ils
        // sont employés dans une centaine d'endroits, et les renommer d'un
        // bloc mêlerait un changement de couleurs à un changement de code.
        rayonblue: "#1B62D4",       // bleu Côtes-d'Armor (était #3435FF)
        rayonorange: "#FF8200",     // orange Banques Alimentaires, inchangé
        rayonlightblue: "#4A8AE0",  // bleu clair accordé (était #0080ffff)

        // Vert des Côtes-d'Armor, pour les éléments secondaires et les
        // confirmations.
        armorgreen: "#0F8140",
        armorgreenlight: "#3DA46A",
      },
    },
  },
  plugins: [],
}
