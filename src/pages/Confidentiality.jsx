// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-11-01    Louvel       politique de protection des données personnelles
//                            V4 (adresse email et postale pour exercer ses
//                            droits, absence de données de carte bancaire,
//                            BA22 sans connaissance de la situation sociale)
//
// =============================================================================

const CONTACT_EMAIL = "ba220.epicerie@banquealimentaire.org";

// Petits composants de mise en forme, pour garder le texte lisible
const H2 = ({ children }) => (
    <h2 className="text-2xl lg:text-3xl font-bold text-[#3435FF] mt-10 mb-4">{children}</h2>
);
const H3 = ({ children }) => (
    <h3 className="text-xl font-bold text-[#3435FF] mt-6 mb-3">{children}</h3>
);
const H4 = ({ children }) => (
    <h4 className="text-lg font-bold text-[#FF8200] mt-5 mb-2">{children}</h4>
);
const P = ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>;
const UL = ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>;
const B = ({ children }) => <span className="font-semibold">{children}</span>;
const ExtLink = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#2E2EFF] underline [overflow-wrap:anywhere]">
        {children || href}
    </a>
);

function Confidentiality() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* En-tête */}
            <div className="bg-gradient-to-br from-[#3435FF] via-[#2526B7] to-[#1F2099] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8200] opacity-10 rounded-full blur-3xl"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10 text-center">
                    <h1 className="text-3xl lg:text-5xl font-bold text-white">
                        Politique de protection de vos données personnelles
                    </h1>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-gray-800">

                {/* 1 */}
                <H2>1. Le responsable de traitement</H2>
                <P>
                    La Banque Alimentaire des Côtes d’Armor (ci-après la « BA22 »), en qualité de responsable
                    de traitement, édite le site www.esl22.fr et procède, à ce titre, à différentes utilisations
                    de vos données personnelles, c’est-à-dire toute information permettant de vous identifier
                    (directement ou indirectement) et vous concernant (par exemple votre nom, votre adresse
                    e-mail, vos informations de facturation) (ci-après les « Données »).
                </P>

                {/* 2 */}
                <H2>2. Quelles sont les données utilisées par la BA22, pour quelles raisons et pour combien de temps ?</H2>
                <P>Nous traitons vos Données pour les finalités suivantes :</P>

                <H3>2.1. La gestion des contrats entre la BA22 et vous</H3>
                <P>
                    <B>Description</B> : nous traitons vos Données dans le cadre de la gestion de vos commandes
                    avec la BA22 d’achat de denrées et produits d’hygiène. Cette finalité comprend les opérations
                    nécessaires à la gestion de vos commandes, à la livraison de vos produits, au paiement de vos
                    commandes et aux facturations afférentes.
                </P>
                <P>
                    <B>Catégorie de données traitées</B> : vos données d’identification (par exemple vos nom,
                    prénom, coordonnées postales, adresse email et numéro de téléphone), les droits d’accès à
                    l’épicerie communiqués par le service social qui vous accompagne (poids et montant que vous
                    pouvez commander, durée de validité), vos données de commande (numéro, date et détail de la
                    commande, point relais choisi), les informations relatives à vos paiements (montant, date,
                    moyen de paiement utilisé et référence de la transaction), ainsi que l’historique de vos
                    commandes et de vos factures.
                </P>
                <P>
                    La BA22 n’a pas connaissance de votre situation personnelle ou familiale : celle-ci est
                    évaluée uniquement par le service social qui vous accompagne, qui ne nous transmet que vos
                    droits d’accès.
                </P>
                <P>
                    <B>Aucune donnée de carte bancaire n’est collectée ni conservée par la BA22.</B> Les paiements
                    sont saisis et traités directement par notre prestataire de paiement sécurisé, qui applique
                    la norme de sécurité de l’industrie des cartes de paiement (PCI DSS). La BA22 ne reçoit de sa
                    part qu’une confirmation du paiement et sa référence.
                </P>
                <P><B>Durée de conservation</B> : vos Données sont conservées :</P>
                <UL>
                    <li>le compte et l’historique des commandes : deux ans après la dernière commande ;</li>
                    <li>les factures : dix ans, conformément aux obligations comptables ;</li>
                    <li>les aides accordées par un service social : un an.</li>
                </UL>
                <P><B>Destinataires</B> : vos Données peuvent être transmises aux :</P>
                <UL>
                    <li>prestataires logistiques (transporteurs, entrepôts, points relais) ;</li>
                    <li>banques et prestataires de paiement ;</li>
                    <li>autorités publiques et administratives, sur demande de leur part.</li>
                </UL>
                <P>
                    <B>Base légale</B> : l’exécution du contrat qui vous lie à la BA22 lorsque vous passez
                    commande, dans la limite des droits d’accès définis par votre service social, ainsi que le
                    respect de nos obligations légales, notamment comptables pour la conservation des factures.
                </P>

                <H4>2.1.1. Le traitement de vos demandes</H4>
                <P>
                    <B>Description</B> : nous traitons les messages que vous nous adressez par le formulaire de
                    contact, et les documents que vous choisissez d’y joindre, afin de répondre à vos demandes.
                    La base légale est notre intérêt légitime à vous répondre.
                </P>
                <P>
                    <B>Catégorie de données</B> : vos données d’identification, le contenu de votre message et ses
                    éventuelles pièces jointes. Nous vous invitons à ne joindre que les documents strictement
                    nécessaires à votre demande.
                </P>

                <H3>2.2. Les rapports statistiques et l’amélioration de l’expérience utilisateur</H3>

                <H4>2.2.1. Les rapports statistiques</H4>
                <P>
                    <B>Description</B> : nous traitons vos Données afin d’élaborer des statistiques permettant
                    d’analyser et d’optimiser l’activité de nos services. La base légale est notre intérêt légitime.
                </P>
                <P><B>Catégorie de données</B> : vos données d’identification et de commandes.</P>
                <P>
                    <B>Durée de conservation</B> : le temps nécessaire à la réalisation de l’objectif visé par les
                    statistiques, ou jusqu’à l’exercice de votre droit d’opposition.
                </P>
                <P>
                    <B>Destinataires de vos Données</B> : vos Données sont gardées et traitées en local pour la
                    réalisation de rapports statistiques.
                </P>

                <H4>2.2.2. L’amélioration de la connaissance des utilisateurs</H4>
                <P>
                    <B>Description</B> : nous traitons vos Données afin d’enrichir et d’améliorer la connaissance
                    des utilisateurs du site pour mieux comprendre vos attentes et adapter nos offres et services.
                    La base légale est notre intérêt légitime.
                </P>
                <P>
                    <B>Catégorie de données</B> : vos données d’identification (par exemple vos nom, prénom,
                    coordonnées postales et électroniques), vos données de commande (numéro, date et détail de la
                    commande) et l’historique de vos commandes et de vos factures.
                </P>
                <P>
                    <B>Durée de conservation</B> : le temps nécessaire à la réalisation de l’objectif visé par les
                    analyses, dans une limite de trois ans à compter de la fin de la relation, ou jusqu’à
                    l’exercice de votre droit d’opposition.
                </P>
                <P>
                    <B>Destinataires de vos Données</B> : vos Données sont gardées en local pour la réalisation
                    d’analyses de la satisfaction des utilisateurs.
                </P>

                {/* 3 */}
                <H2>3. La sécurité de nos services</H2>
                <P>
                    <B>Description</B> : nous traitons vos Données afin d’assurer la sécurité de nos services et de
                    détecter et analyser les activités frauduleuses, malveillantes ou contraires aux conditions
                    d’utilisation de nos services. La base légale est notre intérêt légitime.
                </P>
                <P><B>Catégorie de données</B> : vos données d’identification (compte utilisateur).</P>
                <P>
                    <B>Durée de conservation</B> : vos Données sont conservées pour une durée allant de six mois à
                    un an selon votre activité sur notre site.
                </P>
                <P>
                    <B>Destinataires de vos Données</B> : notre prestataire de paiement, Stripe, qui analyse
                    chaque paiement afin de détecter et prévenir les fraudes.
                </P>

                {/* 4 */}
                <H2>4. Mesures de sécurité</H2>
                <P>
                    Nous nous engageons à mettre en œuvre les mesures techniques et organisationnelles appropriées
                    afin de garantir un haut niveau de sécurité.
                </P>
                <P>
                    Ces mesures sont définies en prenant en compte notamment l’état des connaissances
                    technologiques, la nature, la portée, le contexte et les finalités du traitement ainsi que les
                    risques identifiés.
                </P>
                <P>
                    Les paiements sont traités par un prestataire spécialisé, qui agit conformément à la norme de
                    sécurité de l’industrie des cartes de paiement PCI DSS.
                </P>

                {/* 5 */}
                <H2>5. Comment exercer vos droits ?</H2>
                <P>
                    Vous trouverez ci-après une description de vos droits ainsi que des modalités à votre
                    disposition pour les exercer.
                </P>

                <div className="bg-blue-50 border-l-4 border-[#3435FF] rounded-lg p-4 my-4">
                    <P><B>Pour exercer vos droits, vous pouvez nous écrire :</B></P>
                    <UL>
                        <li>
                            par email :{" "}
                            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#2E2EFF] font-semibold underline">
                                {CONTACT_EMAIL}
                            </a>{" "};
                        </li>
                        <li>
                            ou par courrier : Banque Alimentaire des Côtes d’Armor, 126 rue de l’Aérodrome,
                            22300 Lannion.
                        </li>
                    </UL>
                    <p className="leading-relaxed">
                        Merci de préciser vos nom, prénom et l’adresse email de votre compte. En cas de doute
                        raisonnable sur votre identité, nous pourrons vous demander un justificatif.
                    </p>
                </div>

                <P>
                    Nous vous adresserons une réponse dans un délai d’un (1) mois maximum suivant la date de
                    réception de votre demande. Ce délai pourra être prolongé de <B>deux (2) mois
                    supplémentaires</B> compte tenu de la complexité et du nombre de demandes.
                </P>
                <P>Par souci de transparence, vous trouverez ci-après une présentation de vos droits :</P>

                <P>
                    <B>Droit d’accès</B> : vous avez le droit de nous demander la confirmation que des Données vous
                    concernant sont ou non traitées et, le cas échéant, l’accès auxdites Données ainsi que :
                </P>
                <UL>
                    <li>les raisons pour lesquelles nous détenons vos Données ;</li>
                    <li>les catégories de Données que nous détenons ;</li>
                    <li>notre utilisation de vos Données ;</li>
                    <li>qui a accès à vos Données (et leur localisation) ;</li>
                    <li>où vos Données sont susceptibles d’être transférées ;</li>
                    <li>la durée pendant laquelle nous conservons vos Données ;</li>
                    <li>si vous ne nous avez pas communiqué vos Données directement, comment nous les avons obtenues ;</li>
                    <li>vos droits en vertu des lois applicables et la possibilité de limiter le traitement ;</li>
                    <li>la possibilité d’introduire une réclamation auprès de l’autorité de contrôle compétente.</li>
                </UL>

                <P>
                    <B>Droit de rectification</B> : vous pouvez demander la rectification des informations
                    inexactes ou incomplètes vous concernant (par exemple une adresse erronée).
                </P>
                <P>
                    <B>Droit d’opposition</B> : vous pouvez vous opposer à tout moment à ce que notre association
                    utilise certaines de vos Données en mettant en avant des raisons tenant à votre situation
                    particulière.
                </P>
                <P>
                    <B>Droit de retrait du consentement</B> : vous pouvez, à tout moment, retirer votre
                    consentement au traitement de vos Données par la BA22, en nous écrivant aux coordonnées
                    indiquées ci-dessus.
                </P>

                <P>
                    <B>Droit de suppression</B> : vous avez le droit de demander l’effacement de Données vous
                    concernant dans les cas suivants :
                </P>
                <UL>
                    <li>vos Données sont utilisées à des fins de prospection ;</li>
                    <li>les Données ne sont plus nécessaires au regard des objectifs pour lesquels elles ont été initialement collectées ou traitées ;</li>
                    <li>vous retirez votre consentement ou vous vous êtes opposé au traitement de vos Données ;</li>
                    <li>vos Données font l’objet d’un traitement illicite ;</li>
                    <li>vos Données ont été collectées lorsque vous étiez mineur dans le cadre de la société de l’information (blog, forum, réseau social, site web…) ;</li>
                    <li>vos Données doivent être effacées pour respecter une obligation légale.</li>
                </UL>
                <P>
                    En cas de demande de suppression de vos Données, la BA22 sera néanmoins tenue de les conserver
                    sous forme d’archivage intermédiaire, pour la durée nécessaire à la satisfaction de ses
                    obligations légales, comptables et fiscales.
                </P>

                <P>
                    <B>Droit à la portabilité</B> : vous pouvez demander la communication d’une partie des Données
                    que vous nous avez fournies dans un format lisible par une machine, mais aussi la transmission
                    de ces Données à un tiers de votre choix.
                </P>
                <P>
                    <B>Droit de plainte</B> : vous pouvez, à tout moment, porter réclamation devant l’autorité de
                    contrôle compétente (en France, la CNIL : <ExtLink href="https://www.cnil.fr">www.cnil.fr</ExtLink>).
                </P>

                <P>
                    <B>Droit de formuler des directives post-mortem</B> : vous avez le droit de formuler des
                    directives post-mortem spécifiques et générales concernant la conservation, l’effacement et la
                    communication de vos Données. En l’absence de toute directive, vos héritiers peuvent
                    s’adresser à la BA22 afin :
                </P>
                <UL>
                    <li>d’accéder aux traitements de Données permettant « l’organisation et le règlement de la succession du défunt » ;</li>
                    <li>et/ou de faire procéder à la clôture de votre compte sur le site et/ou de s’opposer à la poursuite du traitement de vos Données.</li>
                </UL>

                <P>
                    <B>Droit à la limitation</B> : vous avez le droit de demander à geler temporairement
                    l’utilisation de certaines de vos Données, notamment pendant l’examen de votre demande
                    d’exercice d’un autre droit. Ce droit ne s’applique que si :
                </P>
                <UL>
                    <li>vous contestez l’exactitude de vos Données, pendant la durée nous permettant de vérifier l’exactitude de ces dernières ;</li>
                    <li>vous considérez que nous traitons illicitement vos Données et vous exigez une limitation de leur utilisation plutôt qu’un effacement ;</li>
                    <li>nous n’avons plus besoin de vos Données au regard des finalités visées au paragraphe 2, mais celles-ci sont encore nécessaires pour la constatation, l’exercice ou la défense de vos droits en justice ;</li>
                    <li>vous avez exercé votre droit d’opposition, pendant la durée de vérification portant sur le point de savoir si les motifs légitimes que nous poursuivons prévalent sur les vôtres.</li>
                </UL>

                {/* Cookies */}
                <div className="border-t-2 border-gray-200 mt-12 pt-2">
                    <h2 className="text-2xl lg:text-3xl font-bold text-[#FF8200] mt-8 mb-4">Politique des cookies</h2>
                </div>

                <H3>1. Préambule</H3>
                <P>
                    La présente Politique a pour objet de vous informer de manière claire et transparente sur
                    l’utilisation des cookies et autres traceurs présents sur le site www.esl22.fr (ci-après le
                    « Site ») et dans les communications électroniques que vous êtes susceptible de recevoir de
                    notre part.
                </P>

                <H3>2. Qu’est-ce qu’un cookie ?</H3>
                <P>
                    Les cookies sont de petits fichiers stockés par un serveur dans le terminal (ordinateur,
                    téléphone, tablette, etc.) d’un utilisateur et associés à un domaine web (c’est-à-dire à
                    l’ensemble des pages d’un même site web). Ces fichiers sont automatiquement renvoyés lors de
                    contacts ultérieurs avec le même domaine.
                </P>
                <P>Il existe plusieurs types de cookies :</P>
                <UL>
                    <li>des cookies de session, qui disparaissent dès que vous quittez le site ;</li>
                    <li>des cookies permanents, qui demeurent sur votre équipement terminal jusqu’à expiration de leur durée de vie ou jusqu’à ce que vous les supprimiez à l’aide des fonctionnalités de votre navigateur ;</li>
                    <li>des cookies internes, qui sont déposés par la BA22 ;</li>
                    <li>des cookies tiers (ou statistiques), qui sont déposés par un tiers sur le Site et qui lui permettent de voir quelles pages ont été visitées sur le Site par un utilisateur et de collecter des informations sur lui.</li>
                </UL>

                <H3>3. Quels sont les cookies utilisés sur le Site ?</H3>
                <P>
                    Il existe plusieurs catégories de cookies utilisés sur le Site, au sein desquelles chaque
                    cookie a une finalité propre. Nous utilisons :
                </P>
                <UL>
                    <li>un cookie de session : pour identifier l’utilisateur et le maintenir authentifié pendant la navigation ;</li>
                    <li>un cookie de panier : pour conserver le contenu du panier pendant la navigation ;</li>
                </UL>
                <P>
                    La BA22 s’engage à respecter les recommandations de la Commission nationale de l’informatique
                    et des libertés (CNIL)<sup>[1]</sup> concernant la durée de vie des cookies et la durée de
                    conservation des données qui sont stockées par eux.
                </P>

                <H3>4. Comment gérer vos cookies ?</H3>
                <P>
                    Lors de votre première visite sur le Site, il vous est proposé d’accepter ou de refuser
                    l’utilisation des cookies et autres traceurs. Vous pouvez gérer et modifier à tout moment vos
                    choix suivant les modalités suivantes :
                </P>
                <UL>
                    <li>directement sur le site, à partir du module de gestion de vos consentements ;</li>
                    <li>à partir de votre logiciel de navigation ;</li>
                    <li>à partir de plateformes interprofessionnelles d’opposition.</li>
                </UL>
                <P>
                    Attention : la prise en compte de votre consentement ou de votre refus repose sur un cookie.
                    Par conséquent, si vous désactivez tous les cookies de votre terminal ou si vous changez de
                    terminal, nous ne serons plus en mesure de savoir si vous avez choisi d’accepter ou de refuser
                    les cookies.
                </P>

                <H4>Au travers de votre logiciel de navigation</H4>
                <P>
                    Vous pouvez configurer votre logiciel de navigation de manière que des cookies soient
                    enregistrés dans votre équipement terminal ou qu’ils soient rejetés, soit systématiquement,
                    soit selon leur émetteur. Vous pouvez également régulièrement supprimer les cookies de votre
                    terminal via votre navigateur.
                </P>
                <P>
                    N’oubliez pas cependant de paramétrer l’ensemble des navigateurs de vos différents terminaux
                    (tablettes, smartphones, ordinateurs, etc.).
                </P>
                <P>
                    La configuration de chaque navigateur est différente. Elle est décrite dans le menu d’aide de
                    votre navigateur, qui vous permettra de savoir de quelle manière modifier vos choix en matière
                    de cookies. À titre d’exemples :
                </P>
                <UL>
                    <li>navigateur Safari : <ExtLink href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" /></li>
                    <li>navigateur Google Chrome : <ExtLink href="https://support.google.com/chrome/answer/95647?hl=fr" /></li>
                    <li>navigateur Microsoft Edge : <ExtLink href="https://support.microsoft.com/fr-fr/edge/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use" /></li>
                    <li>navigateur Firefox : <ExtLink href="https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent" /></li>
                    <li>navigateur Opera : <ExtLink href="https://help.opera.com/en/latest/web-preferences/#cookies" /></li>
                </UL>
                <P>
                    Pour en savoir plus, nous vous invitons à consulter le site de la CNIL :{" "}
                    <ExtLink href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/comment-se-proteger/maitriser-votre-navigateur" />.
                </P>

                <H3>5. Entrée en vigueur</H3>
                <P>
                    La présente Politique entre en vigueur à la date de sa mise en ligne. Il en est de même de ses
                    modifications.
                </P>

                <p className="text-sm text-gray-500 border-t border-gray-200 mt-10 pt-4">
                    [1] Délibération CNIL n° 2020-092 du 17 septembre 2020 portant adoption d’une recommandation
                    proposant des modalités pratiques de mise en conformité en cas de recours aux « cookies et
                    autres traceurs ».
                </p>
            </main>
        </div>
    );
}

export default Confidentiality;
