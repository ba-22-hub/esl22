function ArticleModal({ article, isOpen, onClose }) {
  if (!isOpen || !article) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = () => {
    if (article.file_url) {
      window.open(article.file_url, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose} // Fermer en cliquant sur le fond
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} // Empêcher la fermeture en cliquant sur le modal
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {article.title}
            </h2>
            {article.edited_at && (
              <div className="flex items-center text-sm text-gray-500">
                Dernière modification : {formatDate(article.edited_at)}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-red hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
            title="Annuler"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Image */}
          {article.image && (
            <div className="mb-6 flex justify-center">
              <img
                src={article.image}
                alt={article.title}
                className="rounded-lg shadow-md object-contain w-full h-auto max-h-[500px]"
                style={{ maxWidth: '100%' }}
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {article.content}
            </p>
          </div>

          {/* File Attachment */}
          {article.file && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center mr-3">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {article.file || 'Fichier joint'}
                    </p>
                    <p className="text-xs text-gray-500">Document PDF</p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Télécharger
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArticleModal;