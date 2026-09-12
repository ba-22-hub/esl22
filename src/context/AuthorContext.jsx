// =============================================================================
// HISTORIQUE DES MODIFICATIONS
// =============================================================================
//
// Date          Auteur        Description
// ----------    ----------    -------------------------------------------------
// 2026-08-12    Louvel       exposition de accountType / isMds ; rechargement
//                            des rôles sur changement de session (corrige
//                            hasRights/isAdmin obsolètes après re-connexion)
// 2026-09-01    Louvel       maybeSingle() sur Admins : single() renvoyait une
//                            erreur 406 à chaque connexion d'un compte non
//                            administrateur, sans conséquence mais bruyante.
//
// =============================================================================
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from "@lib/supabaseClient.js"

/*
HOW TO USE THE CONTEXT ?? 
1. import : import { useAuthor } from '../context/AuthorContext.jsx';
2. declare what you need at the begining of the component
    => const {user, setUser, logout } = useAuthor()

user : current session,
    /=> user.id is needed to interact with the db 
setUser : to change the session
logout : to end the session
loading : true if al the informations aren't loaded
hasRight : if the user has the right to order
isAdmin : if the user is Admin
isMds : if the user is a "centre social" account (User.accountType === 'mds')
accountType : raw value of User.accountType ('beneficiary' | 'mds')


/!\ if the page needs 'has_right' or 'isAdmin' it needs to improve the "useEffect" of the page : 
    useEffect(() => {
        if (loading) return ; // the page needs all the informations to start

        {rest of the useEffect}

        }, [.... , loading]) // useEffect trigger again when all is loaded

*/



const AuthorContext = createContext()

function AuthorProvider({ children }) {

    const [hasRights, setHasRights] = useState(null)
    const [isAdmin, setIsAdmin] = useState(null)
    const [accountType, setAccountType] = useState(null)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Charge les rôles/droits associés à une session. Factorisé pour être
    // appelé aussi bien au démarrage qu'à chaque changement de session
    // (connexion, déconnexion) : sans cela, après un logout/login dans le même
    // onglet, hasRights / isAdmin / accountType restaient sur leur valeur
    // précédente (ou null), car onAuthStateChange ne mettait à jour que `user`.
    async function loadUserContext(currentUser) {
        if (!currentUser) {
            setHasRights(false);
            setIsAdmin(false);
            setAccountType(null);
            return;
        }

        // Lancer les deux requêtes en parallèle.
        // maybeSingle() sur Admins : un compte non administrateur n'y a aucune
        // ligne, ce que single() traite comme une erreur (406). Le résultat
        // était correct, mais la console se remplissait d'erreurs à chaque
        // connexion d'un bénéficiaire ou d'un centre social.
        const [rightsRes, adminRes] = await Promise.all([
            supabase.from("User").select("has_right, accountType").eq("id", currentUser.id).single(),
            supabase.from("Admins").select("id").eq("id", currentUser.id).maybeSingle(),
        ]);

        // Gestion des droits
        setHasRights(rightsRes.data?.has_right ?? false);

        // Type de compte : 'beneficiary' par défaut, 'mds' pour un
        // centre social (accès à la gestion des bénéficiaires urgents)
        setAccountType(rightsRes.data?.accountType ?? null);

        // Gestion de l'admin
        setIsAdmin(!!adminRes.data);
    }

    // check if a session is already open
    useEffect(() => {
        async function initAuth() {
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const currentUser = await sessionData.session?.user ?? null;
                setUser(currentUser);

                await loadUserContext(currentUser);

            } catch (err) {
                console.error("Erreur init auth :", err);
            } finally {
                setLoading(false);
            }
        }

        initAuth();
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            // INITIAL_SESSION est déjà couvert par initAuth(), et
            // TOKEN_REFRESHED ne change pas les rôles : on évite des requêtes
            // inutiles en ne rechargeant que sur les évènements pertinents.
            if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;

            // Appeler le client Supabase directement dans ce callback peut
            // provoquer un blocage : on diffère l'exécution.
            setTimeout(() => {
                loadUserContext(currentUser).catch(err =>
                    console.error("Erreur rechargement du contexte utilisateur :", err)
                );
            }, 0);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    // Fonctions
    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsAdmin(null);
        setHasRights(null);
        setAccountType(null);
    };


    const checkIsAdmin = async (userId) => {
        try {
            const { data, error } = await supabase
                .from("Admins")
                .select("id")
                .eq("id", userId)
                .maybeSingle();

            if (error || !data) {
                setIsAdmin(false);
                return false;
            }

            setIsAdmin(true);
            return true;
        } catch (err) {
            setIsAdmin(false);
            return false;
        }
    };

    async function checkHasRights(userId){
        try {
            const { data, error } = await supabase
                .from("User")
                .select("has_right")
                .eq("id", userId)
                .single();

            if (error || !data) {
                setHasRights(false);
                return false;
            }
            setHasRights(data.has_right);
            return data.has_right;
        } catch (err) {
            setHasRights(false);
            return false;
        }
    };


    async function checkAccountType(userId){
        try {
            const { data, error } = await supabase
                .from("User")
                .select("accountType")
                .eq("id", userId)
                .single();

            if (error || !data) {
                setAccountType(null);
                return null;
            }
            setAccountType(data.accountType);
            return data.accountType;
        } catch (err) {
            setAccountType(null);
            return null;
        }
    };


    return (
        <AuthorContext.Provider value={{ user, setUser, logout, loading, hasRights, isAdmin, accountType, isMds: accountType === 'mds', checkIsAdmin, checkHasRights, checkAccountType }}>
            {children}
        </AuthorContext.Provider>
    );

}


const useAuthor = () => useContext(AuthorContext)

export { AuthorProvider, useAuthor }