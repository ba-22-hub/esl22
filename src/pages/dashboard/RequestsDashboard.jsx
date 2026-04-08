// Importing dependencies
import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import { openPDF } from '@lib/openPDF.js';
import { deletePDF } from '@lib/deletePDF';
import { useAuthor } from '@context/AuthorContext';
import { useNavigate } from 'react-router-dom';
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import FunctionButton from '@common/FunctionButton.jsx';
import Loading from '@common/Loading.jsx';


function RequestsDashboard() {
    const [requests, setRequests] = useState([]);
    const [expandedRequest, setExpandedRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const { isAdmin, loading } = useAuthor()
    const navigate = useNavigate()

    useEffect(() => {
        console.log(loading, isAdmin)
        if (loading) return;
        if (!isAdmin) {
            navigate('/admin')
            return;
        }
        fetchRequests();
    }, [loading]);

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('Requests')
            .select(`
        id,
        created_at,
        pdf_name,
        User: user_id (
          id, 
          firstName,
          lastName,
          email
        )
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erreur de chargement des demandes:', error);
            displayNotification("Erreur de chargment des demandes", error.message, "danger")
        } else {
            setRequests(data);
        }
        setIsLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;

        const fileName = requests.find(req => req.id === id)?.pdf_name;
        deletePDF(fileName);
        const { error } = await supabase
            .from('Requests')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erreur de suppression:', error);
            displayNotification("Erreur de suppression de la demande " + id + " avec le fichier " + fileName, error.message, "danger")
        } else {
            displayNotification("Suppression de la demande " + id + " avec le fichier " + fileName + " effectuée avec succès", "", "success")
            setRequests((prev) => prev.filter((req) => req.id !== id));
        }
    };

    const handleDownloadPDF = (pdfName) => {
        displayNotification("Ouverture de " + pdfName, "", "info")
        openPDF(pdfName, 10, "requests");
    };

    const handleApprove = async (id, user_id) => {
        if (!confirm('Êtes-vous sûr de vouloir approuver cette demande ?')) return;

        try {
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);

            const { data, error } = await supabase
                .from('User')
                .update({
                    has_right: true,
                    end_right: endDate.toISOString()
                })
                .eq('id', user_id)
                .select();

            if (error) {
                console.error("Erreur lors de la mise à jour des droits :", error);
                displayNotification("Erreur lors de la mise à jour des droits", error.message, "danger")
            } else {
                displayNotification("Droits mis à jour avec succès", "", "success")
                handleDelete(id);
            }
        } catch (err) {
            console.error("Erreur inattendue :", err);
            displayNotification("Erreur inattendue", err.message, "danger")
        }
    }

    const handleDecline = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir décliner cette demande ?')) return;
        handleDelete(id);
    }

    if (isLoading || loading) {
        return <Loading />;
    }

    return (
        <>
            {loading ? (
                <Loading />
            ) : (
                <div className="p-6 bg-gray-50 min-h-screen">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold mb-6 text-rayonblue">Demandes d'Éligibilité</h1>

                        {/* Liste des demandes en cartes */}
                        <div className="space-y-4 mb-6">
                            {requests.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                                    <p className="text-lg">Aucune demande d'éligibilité en attente</p>
                                </div>
                            ) : (
                                requests.map((req) => (
                                    <div key={req.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                                        {/* En-tête de la demande */}
                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-rayonblue">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-10 h-10 bg-rayonorange rounded-full flex items-center justify-center text-white font-semibold">
                                                            {req.User ? `${req.User.firstName.charAt(0)}${req.User.lastName.charAt(0)}` : '?'}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-800">
                                                                {req.User
                                                                    ? `${req.User.firstName} ${req.User.lastName.toUpperCase()}`
                                                                    : 'Utilisateur inconnu'}
                                                            </h3>
                                                            {req.User && (
                                                                <p className="text-xs text-gray-500">
                                                                    {req.User.email}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        Demande créée le {new Date(req.created_at).toLocaleDateString('fr-FR')} à {new Date(req.created_at).toLocaleTimeString('fr-FR')}
                                                    </p>
                                                </div>

                                                {/* Boutons d'action */}
                                                <div className="flex items-center gap-2 ml-4">
                                                    <button
                                                        onClick={() => setExpandedRequest(expandedRequest === req.id ? null : req.id)}
                                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium text-rayonblue"
                                                        title="Voir détails"
                                                    >
                                                        {expandedRequest === req.id ? "▲ Masquer" : "▼ Détails"}
                                                    </button>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => req.User && handleApprove(req.id, req.User.id)}
                                                            className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center justify-center text-xl"
                                                            title="Accepter"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => handleDecline(req.id)}
                                                            className="w-10 h-10 bg-red hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
                                                            title="Décliner"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Détails de la demande */}
                                        {expandedRequest === req.id && (
                                            <div className="p-4 bg-gray-50 border-t">
                                                {req.pdf_name && (
                                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                        <label className="text-xs font-medium text-rayonblue block mb-2">
                                                            Justificatif d'éligibilité
                                                        </label>
                                                        <button
                                                            onClick={() => handleDownloadPDF(req.pdf_name)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-rayonorange hover:opacity-90 text-white rounded-lg transition"
                                                        >
                                                            📎 {req.pdf_name}
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Informations complémentaires */}
                                                <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
                                                    <label className="text-xs font-medium text-rayonblue block mb-2">
                                                        Informations de la demande
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <p className="text-gray-500 text-xs">ID de la demande</p>
                                                            <p className="text-gray-800 font-medium">{req.id}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 text-xs">Date complète</p>
                                                            <p className="text-gray-800 font-medium">
                                                                {new Date(req.created_at).toLocaleString('fr-FR')}
                                                            </p>
                                                        </div>
                                                        {req.User && (
                                                            <>
                                                                <div>
                                                                    <p className="text-gray-500 text-xs">ID utilisateur</p>
                                                                    <p className="text-gray-800 font-medium">{req.User.id}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500 text-xs">Email de contact</p>
                                                                    <p className="text-gray-800 font-medium">{req.User.email}</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Boutons d'action en bas */}
                                                <div className="mt-4 flex gap-3">
                                                    <button
                                                        onClick={() => req.User && handleApprove(req.id, req.User.id)}
                                                        className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
                                                    >
                                                        ✓ Accepter la demande
                                                    </button>
                                                    <button
                                                        onClick={() => handleDecline(req.id)}
                                                        className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
                                                    >
                                                        ✕ Décliner la demande
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default RequestsDashboard;