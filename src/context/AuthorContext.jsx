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
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // check if a session is already open
    useEffect(() => {
        async function initAuth() {
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const currentUser = await sessionData.session?.user ?? null;
                setUser(currentUser);

                if (!currentUser) {
                    // Pas connecté
                    setHasRights(false);
                    setIsAdmin(false);
                    setLoading(false);
                    return;
                }

                // Lancer les deux requêtes en parallèle
                const [rightsRes, adminRes] = await Promise.all([
                    supabase.from("User").select("has_right").eq("id", currentUser.id).single(),
                    supabase.from("Admins").select("id").eq("id", currentUser.id).single(),
                ]);

                // Gestion des droits
                setHasRights(rightsRes.data?.has_right ?? false);

                // Gestion de l'admin
                setIsAdmin(!!adminRes.data);

            } catch (err) {
                console.error("Erreur init auth :", err);
            } finally {
                setLoading(false);
            }
        }

        initAuth();
        const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user ?? null);
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
    };


    const checkIsAdmin = async (userId) => {
        try {
            const { data, error } = await supabase
                .from("Admins")
                .select("id")
                .eq("id", userId)
                .single();

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


    return (
        <AuthorContext.Provider value={{ user, setUser, logout, loading, hasRights, isAdmin, checkIsAdmin, checkHasRights }}>
            {children}
        </AuthorContext.Provider>
    );

}


const useAuthor = () => useContext(AuthorContext)

export { AuthorProvider, useAuthor }