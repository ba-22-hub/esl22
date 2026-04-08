// Importing dependencies
import { useEffect, useState, useRef } from "react";
import { supabase } from "@lib/supabaseClient";
import { uploadImage, normalizeFileName } from '@lib/uploadImage.js'
import { useAuthor } from '@context/AuthorContext';
import { useNavigate } from 'react-router-dom';
import { displayNotification } from '@lib/displayNotification.jsx';

// Importing common components
import FormInput from "@common/FormInput"
import FunctionButton from "@common/FunctionButton.jsx";
import Loading from '@common/Loading.jsx';

// Importing assets
import roundLogo from "@assets/logos/roundLogo.png"


function ProductTable() {
  const categoriesList = ["légumes", "fruits", "féculents", "conserves", "hygiène", "autre"]

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null); // Pour afficher/masquer les détails
  const [oldImageName, setOldImageName] = useState("");
  const [productImages, setProductImages] = useState({});

  // For image upload
  const [image, setImage] = useState("");
  const inputFile = useRef(null);

  const [settings, setSettings] = useState({
    stockIncertainThreshold: '',
    shippingCost: '',
    max_order: '',
  })

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    salePrice: '',
    category: '',
    weight: '',
    max_order: settings.max_order,
    stock: '',
    productStockIncertainThreshold: settings.stockIncertainThreshold,
    description: '',
    image_name: '',
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      max_order: settings.max_order,
      productStockIncertainThreshold: settings.stockIncertainThreshold
    }));
  }, [settings]);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*");
    if (error) {
      console.error("Erreur chargement produits :", error)
      displayNotification("Erreur lors du chargment des produits", error.message, "danger")
    }
    else {
      setProducts(data)
      data.forEach(async product => {
        const { data: imgData, error: imgError } = await supabase
          .storage
          .from("images")
          .download(product.image_name);

        if (imgError) {
          displayNotification("Erreur lors du téléchargement de l'image " + product.image_name, imgError.message, "warning")
        } else {
          const url = URL.createObjectURL(imgData);
          setProductImages(prev => ({
            ...prev,
            [product.id]: url
          }));
        }
        return product;
      })
    }
  };

  const { isAdmin, loading } = useAuthor()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate('/admin')
      return;
    }

    fetchProducts();
    fetchCurrentSettings();
  }, [loading]);

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setEditedValues(product);
    setExpandedRow(product.id); // Déplier automatiquement les détails
  };

  const handleChangeInProd = (e) => {
    setEditedValues({ ...editedValues, [e.target.name]: e.target.value });
    if (e.target.name == "image_name") {
      const { files } = e.target;
      setImage(files[0])
    }
  };

  const removeProd = async (product) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${product.name} ?`)) return;

    const { error } = await supabase
      .storage
      .from('images')
      .remove([product.image_name])
    if (error) {
      console.error("Erreur suppression image :", error)
      displayNotification("Erreur lors de la suppression de l'image " + product.image_name, error.message, "danger")
    }

    const { response, errorDelete } = await supabase
      .from("products")
      .delete()
      .eq('id', product.id)
    if (errorDelete) {
      console.error("Erreur lors de la suppression du produit " + product.name + errorDelete)
      displayNotification("Erreur lors de la suppression du produit " + product.name, errorDelete.message, "danger")
    } else {
      displayNotification("Produit " + product.name + " supprimé avec succès", response, "success")
    }
    fetchProducts()
  }

  function handleChangeInForm(e) {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  }

  const handleValidate = async () => {
    if (oldImageName != "") {
      const { error } = await supabase
        .storage
        .from('images')
        .remove([oldImageName])
      if (error) {
        console.error("Erreur suppression ancienne image :", error)
        displayNotification("Erreur lors de la suppression de l'ancienne image " + oldImageName + " de la base de données", error.message, "danger")
      }
    }

    if (image != "") {
      await uploadImage(image, image.name)
      const url = URL.createObjectURL(image);
      setProductImages(prev => ({
        ...prev,
        [editingProductId]: url
      }));
    }

    const { error } = await supabase
      .from("products")
      .update(editedValues)
      .eq("id", editingProductId);
    if (error) {
      console.error("Erreur update :", error)
      displayNotification("Erreur lors de la mise à jour du produit", error.message, "danger")
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProductId ? editedValues : p))
      );
      setEditingProductId(null);
    }
    setImage("")
    setOldImageName("")
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e) {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      productStockIncertainThreshold: formData.productStockIncertainThreshold === "" ? null : formData.productStockIncertainThreshold
    };

    const { error } = await supabase
      .from('products')
      .insert(dataToSubmit)

    if (error) {
      console.error("Erreur lors de l'ajout du nouveau produit", error);
      displayNotification("Erreur lors de l'ajout du nouveau produit", error.message, "danger")
      return;
    }

    if (image && image.name) {
      await uploadImage(image, image.name)
    }
    setImage("")

    setFormData({
      name: '',
      price: '',
      salePrice: '',
      category: '',
      weight: '',
      max_order: settings.max_order,
      stock: '',
      productStockIncertainThreshold: settings.stockIncertainThreshold,
      description: '',
      image_name: '',
    })

    setExpanded(false);
    fetchProducts();
  }

  const BrowseImage = (newProduct, product) => {
    const handleFileUpload = e => {
      const { files } = e.target;
      if (files && files.length) {
        const normalizedName = normalizeFileName(files[0].name);
        {
          newProduct ? (
            setFormData(prevData => ({
              ...prevData,
              image_name: normalizedName
            }))
          ) : (
            () => handleEdit(product),
            setEditedValues(prevData => ({
              ...prevData,
              image_name: normalizedName
            })),
            () => handleChangeInProd(product)
          )
        }
        setImage(files[0]);
      }
    };

    const onButtonClick = () => {
      inputFile.current.click();
    };

    return (
      <div>
        <input
          style={{ display: "none" }}
          ref={inputFile}
          onChange={handleFileUpload}
          type="file"
          accept="image/*"
        />
        <div className="bg-rayonorange px-3 py-2 rounded button text-white text-center cursor-pointer hover:opacity-90 transition" onClick={onButtonClick}>
          📷 Parcourir
        </div>
      </div>
    );
  };

  const BrowseImageChange = (product) => {
    const handleFileUpload = async (e) => {
      async function fetchOldImageName() {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq('id', editingProductId)
          .maybeSingle();

        if (error && Object.keys(error.message).length > 0) {
          console.error("Erreur lors du téléchargement du nom de de l'image : ", error.message);
          displayNotification("Erreur lors du téléchargement du nom de de l'image", error.message, "danger")
          return;
        }

        setOldImageName(data.image_name);
      }
      await fetchOldImageName();

      const { files } = e.target;
      if (files && files.length) {
        const normalizedName = normalizeFileName(files[0].name);
        () => handleEdit(product),
          setEditedValues(prevData => ({
            ...prevData,
            image_name: normalizedName
          }))
      }
      setImage(files[0]);
    };

    const onButtonClick = () => {
      inputFile.current.click();
    };

    return (
      <div>
        <input
          style={{ display: "none" }}
          ref={inputFile}
          onChange={handleFileUpload}
          type="file"
          accept="image/*"
        />
        <div className="bg-rayonorange px-3 py-2 rounded button text-white cursor-pointer hover:opacity-90 transition text-sm" onClick={onButtonClick}>
          📷 Changer
        </div>
      </div>
    );
  };

  async function fetchCurrentSettings() {
    const { data: stockIncertainThresholdData, error: stockIncertainThresholdError } = await supabase
      .from('constants')
      .select('value')
      .eq("name", "stockIncertainThreshold")
      .maybeSingle();
    if (!stockIncertainThresholdError) {
      setSettings(prevData => ({
        ...prevData,
        stockIncertainThreshold: stockIncertainThresholdData.value
      }))
    } else {
      console.error("Erreur lors du téléchargement de l'ancienne valeur seuil", stockIncertainThresholdError)
      displayNotification("Erreur lors du téléchargement de l'ancienne valeur seuil", stockIncertainThresholdError.message, "danger")
    }

    const { data: max_orderData, error: max_orderError } = await supabase
      .from('constants')
      .select('value')
      .eq("name", "max_order")
      .maybeSingle();
    if (!max_orderError) {
      setSettings(prevData => ({
        ...prevData,
        max_order: max_orderData.value
      }))
    } else {
      console.error("Erreur lors du téléchargement de l'ancienne valeur de la quantité maximale par panier", max_orderError)
      displayNotification("Erreur lors du téléchargement de l'ancienne valeur de la quantité maximale par panier", max_orderError.message, "danger")
    }

    const { data: shippingCostData, error: shippingCostError } = await supabase
      .from('constants')
      .select('value')
      .eq("name", "shippingCost")
      .maybeSingle();
    if (!shippingCostError) {
      setSettings(prevData => ({
        ...prevData,
        shippingCost: shippingCostData.value
      }))
    } else {
      console.error("Erreur lors du téléchargement de l'ancienne valeur de la participation solidaire aux frais de livraison", shippingCostError)
      displayNotification("Erreur lors du téléchargement de l'ancienne valeur de la participation solidaire aux frais de livraison", shippingCostError.message, "danger")
    }
  }

  const handleChangeInSettings = (e) => {
    setSettings(prevData => ({
      ...prevData,
      [e.target.name]: e.target.value
    }))
  };

  async function handleSubmitSettings(e) {
    e.preventDefault();

    const updates = Object.entries(settings).map(([key, value]) => ({
      name: key,
      value: value,
    }));

    const { error } = await supabase
      .from("constants")
      .upsert(updates);

    if (error) {
      displayNotification("Erreur lors de la mise à jour des paramètres", error.message, "danger")
    } else {
      displayNotification("Les paramètres ont été mis à jour avec succès", "", "success")
    }

    setExpandedSettings(false);
  }

  function modifySettings() {
    fetchCurrentSettings();
    setExpandedSettings(true);
  }

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-rayonblue">Gestion des Produits</h1>
            <div className="flex">
              {/* Bouton Ajouter un produit */}
              <FunctionButton
                className="bg-rayonorange w-full md:w-[20vw] text-white px-8 py-3 rounded-lg mb-4 mr-6 hover:opacity-90 transition font-semibold"
                buttonText={expanded ? '✕ Annuler' : '➕ Ajouter un produit'}
                fun={expanded ? (() => setExpanded(false)) : (() => setExpanded(true))}
              />
              {/* Bouton Paramètres */}
              <FunctionButton
                className="bg-rayonorange w-full md:w-[20vw] text-white px-8 py-3 rounded-lg mb-4 hover:opacity-90 transition font-semibold"
                buttonText={expandedSettings ? '✕ Annuler' : '⚙️ Modifier les paramètres'}
                fun={expandedSettings ? (() => setExpandedSettings(false)) : (() => modifySettings())}
              />
            </div>
            <div>
              {/* Formulaire ajout produit */}
              {expanded && (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <p className='text-red-500 text-center text-lg mb-4 font-medium'>
                    Les informations avec une étoile rouge sont obligatoires
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormInput
                      name="name"
                      type="text"
                      value={formData.name ?? ""}
                      inputText="Nom"
                      className="w-full h-10 px-3 rounded-lg border-2 border-rayonblue focus:ring-2 focus:ring-rayonorange"
                      onChange={handleChangeInForm}
                      isStarred={true}
                    />
                    <FormInput
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price ?? ""}
                      inputText="Prix en magasin (€)"
                      className="w-full h-10 px-3 rounded-lg border-2 border-rayonblue focus:ring-2 focus:ring-rayonorange"
                      onChange={handleChangeInForm}
                      isStarred={true}
                    />
                    <FormInput
                      name="salePrice"
                      type="number"
                      step="0.01"
                      value={formData.salePrice ?? ""}
                      inputText="Prix rayon22 (€)"
                      className="w-full h-10 px-3 rounded-lg border-2 border-rayonblue focus:ring-2 focus:ring-rayonorange"
                      onChange={handleChangeInForm}
                      isStarred={true}
                    />
                    <div>
                      <p className="text-rayonblue mb-2 font-medium">Catégorie <span className="text-red-500">*</span></p>
                      <div className="grid grid-cols-2 gap-2">
                        {categoriesList.map((category) => (
                          <label key={category} className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              value={category}
                              onChange={handleChangeInForm}
                              required
                              className="mr-2 accent-rayonorange"
                            />
                            <span className="text-rayonblue">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <FormInput
                      name="stock"
                      type="number"
                      value={formData.stock ?? ""}
                      inputText="Stock"
                      className="w-full h-10 px-3 rounded-lg border-2 border-rayonblue focus:ring-2 focus:ring-rayonorange"
                      onChange={handleChangeInForm}
                      isStarred={true}
                    />
                    <FormInput
                      name="productStockIncertainThreshold"
                      type="number"
                      value={formData.productStockIncertainThreshold ?? ""}
                      inputText="Limite stock incertain"
                      className="w-full h-10 px-3 rounded-lg border-2 border-rayonblue focus:ring-2 focus:ring-rayonorange"
                      onChange={handleChangeInForm}
                      isStarred={false}
                    />
                    <FormInput
                      name="weight"
                      type="number"
                      value={formData.weight ?? ""}
                      inputText="Poids (g)"
                      className="w-full h-10 px-3 rounded-lg border-2 border-rayonblue focus:ring-2 focus:ring-rayonorange"
                      onChange={handleChangeInForm}
                      isStarred={true}
                    />
                    <FormInput
                      name="description"
                      type="text"
                      value={formData.description ?? ""}
                      inputText="Description (optionnel)"
                      className="w-full h-10 px-3 rounded-lg border-2 border-rayonblue focus:ring-2 focus:ring-rayonorange"
                      onChange={handleChangeInForm}
                      isStarred={false}
                    />
                    <div>
                      <p className="text-rayonblue mb-2 font-medium">Image du produit</p>
                      <BrowseImage newProduct={true} />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full md:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">
                    ✓ Valider
                  </button>
                </form>
              )}

              

              {/* Formulaire paramètres */}
              {expandedSettings && (
                <form onSubmit={handleSubmitSettings} className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormInput
                      name="stockIncertainThreshold"
                      type="number"
                      value={settings.stockIncertainThreshold ?? 3}
                      inputText="Seuil en deçà duquel le label 'Stock Incertain' apparaît"
                      className="w-full h-10 px-3 rounded-lg border-2 border-rayonblue focus:ring-2 focus:ring-rayonorange"
                      onChange={handleChangeInSettings}
                    />
                    <FormInput
                      name="shippingCost"
                      type="number"
                      step="0.01"
                      value={settings.shippingCost ?? 0}
                      inputText="Participation solidaire aux frais de livraison (€)"
                      className="w-full h-10 px-3 rounded-lg border-2 border-rayonblue focus:ring-2 focus:ring-rayonorange"
                      onChange={handleChangeInSettings}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full md:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">
                    ✓ Valider
                  </button>
                </form>
              )}
            </div>
            <input
              type="text"
              placeholder="🔍 Rechercher un produit..."
              className="mb-6 p-3 border-2 border-rayonblue rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rayonorange transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Liste des produits en cartes */}
            <div className="space-y-4 mb-6">
              {filteredProducts.map((p) => (
                <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  {/* En-tête de la carte */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-rayonblue">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <img
                          src={productImages[p.id] || roundLogo}
                          alt={p.name}
                          className="w-20 h-20 object-cover rounded-lg border-2 border-rayonblue"
                        />
                        <div className="flex-1">
                          {editingProductId === p.id ? (
                            <input
                              name="name"
                              value={editedValues.name}
                              onChange={handleChangeInProd}
                              className="text-lg font-semibold border-2 border-rayonblue rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <h3 className="text-lg font-semibold text-gray-800">{p.name}</h3>
                          )}
                          <span className="inline-block px-3 py-1 bg-rayonblue text-white text-xs rounded-full mt-1">
                            {p.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedRow(expandedRow === p.id ? null : p.id)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium text-rayonblue"
                          title="Voir détails"
                        >
                          {expandedRow === p.id ? "▲ Masquer" : "▼ Détails"}
                        </button>

                        {editingProductId === p.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleValidate}
                              className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center justify-center text-xl"
                              title="Valider"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="w-10 h-10 bg-red hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center text-xl"
                              title="Annuler"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(p)}
                              className="w-10 h-10 bg-rayonblue hover:opacity-90 text-white rounded-lg transition flex items-center justify-center text-lg"
                              title="Modifier"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => removeProd(p)}
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

                  {/* Informations principales */}
                  <div className="p-4 grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Prix magasin (€)</p>
                      {editingProductId === p.id ? (
                        <input
                          name="price"
                          value={editedValues.price}
                          onChange={handleChangeInProd}
                          type="number"
                          step="0.01"
                          className="w-full border-2 border-rayonblue rounded px-2 py-1 text-center"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-800">{p.price}€</p>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Prix rayon22 (€)</p>
                      {editingProductId === p.id ? (
                        <input
                          name="salePrice"
                          value={editedValues.salePrice}
                          onChange={handleChangeInProd}
                          type="number"
                          step="0.01"
                          className="w-full border-2 border-rayonblue rounded px-2 py-1 text-center"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-rayonorange">{p.salePrice}€</p>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Stock</p>
                      {editingProductId === p.id ? (
                        <input
                          name="stock"
                          value={editedValues.stock}
                          onChange={handleChangeInProd}
                          type="number"
                          className="w-full border-2 border-rayonblue rounded px-2 py-1 text-center"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-800">{p.stock}</p>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Poids (grammes)</p>
                      {editingProductId === p.id ? (
                        <input
                          name="weight"
                          value={editedValues.weight}
                          onChange={handleChangeInProd}
                          type="number"
                          className="w-full border-2 border-rayonblue rounded px-2 py-1 text-center"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-800">{p.weight}g</p>
                      )}
                    </div>
                  </div>

                  {/* Détails étendus */}
                  {expandedRow === p.id && (
                    <div className="p-4 bg-gray-50 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-rayonblue block mb-1">
                            Limite stock incertain
                          </label>
                          {editingProductId === p.id ? (
                            <input
                              name="productStockIncertainThreshold"
                              value={editedValues.productStockIncertainThreshold || ''}
                              onChange={handleChangeInProd}
                              type="number"
                              className="w-full border-2 border-rayonblue rounded px-3 py-2"
                            />
                          ) : (
                            <p className="text-gray-800">{p.productStockIncertainThreshold}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-medium text-rayonblue block mb-1">
                            Quantité maximale dans un panier
                          </label>
                          {editingProductId === p.id ? (
                            <input
                              name="max_order"
                              value={editedValues.max_order}
                              onChange={handleChangeInProd}
                              type="number"
                              className="w-full border-2 border-rayonblue rounded px-2 py-1 text-center"
                            />
                          ) : (
                            <p className="text-lg font-semibold text-gray-800">{p.max_order}g</p>
                          )}
                        </div>

                        {editingProductId === p.id && (
                          <div>
                            <label className="text-xs font-medium text-rayonblue block mb-1">
                              Catégorie
                            </label>
                            <select
                              name="category"
                              value={editedValues.category}
                              onChange={handleChangeInProd}
                              className="w-full border-2 border-rayonblue rounded px-3 py-2"
                            >
                              {categoriesList.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="col-span-2">
                          <label className="text-xs font-medium text-rayonblue block mb-1">
                            Description
                          </label>
                          {editingProductId === p.id ? (
                            <textarea
                              name="description"
                              value={editedValues.description || ""}
                              onChange={handleChangeInProd}
                              className="w-full border-2 border-rayonblue rounded px-3 py-2"
                              rows={3}
                            />
                          ) : (
                            <p className="text-gray-800">{p.description || "Aucune description"}</p>
                          )}
                        </div>

                        {editingProductId === p.id && (
                          <div className="col-span-2">
                            <label className="text-xs font-medium text-rayonblue block mb-2">
                              Image du produit
                            </label>
                            <BrowseImageChange product={p} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                  <p className="text-lg">Aucun produit trouvé</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductTable;