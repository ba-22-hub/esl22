function LegalMentions() {
  return (
    <div className="bg-white lg:w-[60%] lg:ml-[20%] mb-[5%] px-4 py-8 lg:p-8">
      <h1 className="text-center text-rayonblue text-2xl sm:text-3xl lg:text-5xl leading-tight pt-8 px-4 font-bold mb-10">
        Mentions Légales
      </h1>

      <div className="border border-gray-200 rounded-xl p-5 lg:p-8 flex flex-col gap-6">

        {/* Éditeur */}
        <div>
          <p className="text-sm text-gray-400 mb-2">Éditeur du site</p>
          <div className="border-l-2 border-rayonblue pl-4 flex flex-col gap-1">
            <p className="font-semibold text-gray-800">Association Banque Alimentaire des Côtes d'Armor</p>
            <p className="text-sm text-gray-500">RCS Saint-Brieuc — n° 37955019700030</p>
            <p className="text-sm text-gray-500">126 rue de l'aérodrome, 22300 Lannion</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Contacts */}
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex gap-4">
            <span className="text-gray-400 w-24 flex-shrink-0">Téléphone</span>
            <span className="font-medium text-rayonorange">02 96 37 13 23</span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-400 w-24 flex-shrink-0">E-mail</span>
            <a href="mailto:ba220.epicerie@banquealimentaire.org" className="text-rayonblue break-all">
              ba220.epicerie@banquealimentaire.org
            </a>
          </div>
          {/* Sur deux lignes : le libellé est trop long pour tenir dans la
              colonne des autres, et l'aligner obligerait à les élargir tous. */}
          <div className="flex flex-col mt-2">
            <span className="text-gray-400">Directeur de publication</span>
            <span className="font-medium">Patrice Demont</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Hébergeur */}
        <div>
          <p className="text-sm text-gray-400 mb-2">Hébergeur</p>
          <div className="border-l-2 border-green-500 pl-4 flex flex-col gap-1">
            <p className="font-semibold text-gray-800">Scaleway SAS</p>
            <p className="text-sm text-gray-500">8 rue de la Ville l'Évêque, 75008 Paris</p>
            <p className="text-sm text-gray-500">RCS Paris B 433 115 904</p>
            <p className="text-sm text-gray-500">Tél : +33 (0)1 84 13 00 00</p>
            <a href="mailto:contact@scaleway.com" className="text-sm text-rayonblue">
              contact@scaleway.com
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LegalMentions;
