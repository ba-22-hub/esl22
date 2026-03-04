// Importing dependencies
import { useEffect, useState } from 'react';
import { useAuthor } from '@context/AuthorContext';
import { useNavigate } from 'react-router-dom';
import { displayNotification } from '@lib/displayNotification.jsx';

import sendMail from '@lib/sendMail.js';
import { supabase } from '@lib/supabaseClient';
import { openPDF } from '@lib/openPDF.js';
import { deletePDF } from '@lib/deletePDF';

// Importing common components
import FunctionButton from '@common/FunctionButton.jsx';
import Loading from '@common/Loading.jsx';

function MessagesDashboard() {
  const [messages, setMessages] = useState([]);
  const [replyStates, setReplyStates] = useState({});
  const [expandedMessage, setExpandedMessage] = useState(null);

  const { isAdmin, loading } = useAuthor()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate('/admin')
      return;
    }

    fetchMessages();
  }, [loading]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('Messages')
      .select(`
      id,
      message,
      pdf_name,
      created_at,
      user_id,
      User: user_id (
        firstName,
        lastName,
        email
      )
    `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur de chargement des messages:', error);
      displayNotification("Erreur de chargement des messages", error.message, "danger")
    } else {
      setMessages(data);
    }
  };

  const handleReplyToggle = (id) => {
    setReplyStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    setExpandedMessage(id);
  };

  const handleReplySend = async (id, reply) => {
    displayNotification("Réponse au message " + id + " :", reply, "info", 0)
    const email = messages.find(msg => msg.id === id)?.User.email;
    const firstName = messages.find(msg => msg.id === id)?.User.firstName;
    const lastName = messages.find(msg => msg.id === id)?.User.lastName;
    displayNotification("E-mail de l'utilisateur :", email, "info", 0)

    if (!email) {
      displayNotification("Aucun e-mail trouvé", "", "danger")
      return console.error("Aucun email trouvé.");
    }

    try {
      await sendMail({
        email: email,
        templateId: 5,
        params: {
          name: `${firstName} ${lastName}`,
          reply,
        },
      });

      displayNotification("E-mail envoyé avec succès", "", "success");
    } catch (error) {
      console.error("Erreur d'envoi :", error);
      displayNotification("Erreur d'envoi de l'e-mail", error.message, "danger")
    }
    handleDelete(id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    const fileName = messages.find(msg => msg.id === id)?.pdf_name;
    deletePDF(fileName)
    const { data, error } = await supabase
      .from('Messages')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Erreur de suppression:', error);
      displayNotification("Erreur de suppression", error.message, "danger")
    } else {
      displayNotification("Suppression effectuée avec succès", "", "success")
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }
  };

  const handleDownloadPDF = (pdfName) => {
    displayNotification("Ouverture de " + pdfName, "", "info")
    openPDF(pdfName, 10, "messages");
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-rayonblue">Messages des Utilisateurs</h1>

            {/* Liste des messages en cartes */}
            <div className="space-y-4 mb-6">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  {/* En-tête du message */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-rayonblue">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-rayonorange rounded-full flex items-center justify-center text-white font-semibold">
                            {msg.User.firstName.charAt(0)}{msg.User.lastName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {msg.User.firstName} {msg.User.lastName.toUpperCase()}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {msg.User.email}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Reçu le {new Date(msg.created_at).toLocaleDateString('fr-FR')} à {new Date(msg.created_at).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium text-rayonblue"
                          title="Voir détails"
                        >
                          {expandedMessage === msg.id ? "▲ Masquer" : "▼ Détails"}
                        </button>

                        {replyStates[msg.id] ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReplySend(msg.id, replyStates[msg.id]?.content || '')}
                              className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center justify-center text-xl"
                              title="Envoyer la réponse"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleReplyToggle(msg.id)}
                              className="w-10 h-10 bg-red hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
                              title="Annuler"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReplyToggle(msg.id)}
                              className="w-10 h-10 bg-rayonblue hover:opacity-90 text-white rounded-lg transition flex items-center justify-center text-lg"
                              title="Répondre"
                            >
                              ✉
                            </button>
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="w-10 h-10 bg-red hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
                              title="Supprimer"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenu du message */}
                  {expandedMessage === msg.id && (
                    <div className="p-4">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <label className="text-xs font-medium text-rayonblue block mb-2">
                          Message
                        </label>
                        <p className="text-gray-800 whitespace-pre-wrap">{msg.message}</p>

                        {msg.pdf_name && (
                          <div className="mt-4">
                            <label className="text-xs font-medium text-rayonblue block mb-2">
                              Pièce jointe
                            </label>
                            <button
                              onClick={() => handleDownloadPDF(msg.pdf_name)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-rayonorange hover:opacity-90 text-white rounded-lg transition"
                            >
                              📎 {msg.pdf_name}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Zone de réponse */}
                      {replyStates[msg.id] && (
                        <div className="mt-4">
                          <label className="text-xs font-medium text-rayonblue block mb-2">
                            Votre réponse
                          </label>
                          <textarea
                            className="w-full p-3 border-2 border-rayonblue rounded-lg focus:outline-none focus:ring-2 focus:ring-rayonorange transition"
                            rows="5"
                            placeholder="Écrivez votre réponse ici..."
                            onChange={(e) =>
                              setReplyStates((prev) => ({
                                ...prev,
                                [msg.id]: {
                                  ...prev[msg.id],
                                  content: e.target.value,
                                },
                              }))
                            }
                          ></textarea>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {messages.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                  <p className="text-lg">Aucun message à afficher</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MessagesDashboard;