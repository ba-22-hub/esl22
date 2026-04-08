export default function Loading({ text = "Chargement en cours..." }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-700 text-lg font-medium">{text}</p>
      </div>
    </div>
  );
}
