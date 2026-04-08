// Importing dependencies
import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient.js';
import { displayNotification } from '@lib/displayNotification.jsx';
import { useAuthor } from '@context/AuthorContext.jsx'
import { useNavigate } from 'react-router-dom';

import Loading from '@common/Loading.jsx'
import ProductCarousel from '@common/ProductCarouselCatalog.jsx'
/*
 * The Catalog page.
 * @returns {React.ReactElement} Catalog component.
 */

const SearchBar = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [update, setUpdate] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user, loading: authorLoading, checkHasRights } = useAuthor()
  const navigate = useNavigate()


  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*');
      if (error) {
        displayNotification("Erreur lors du téléchargement des produits", error.message, "danger")
      } else {
        const productsWithImages = await Promise.all(
          data.map(async product => {
            const { data: imgData, error: imgError } = await supabase
              .storage
              .from("images")
              .download(product.image_name);

            if (imgError) {
              displayNotification("Erreur lors du téléchargement de l'image " + product.image_name, imgError.message, "warning")
            } else {
              product.imageUrl = URL.createObjectURL(imgData);
            }
            return product;
          })
        );

        setProducts(productsWithImages);
      }
      setLoading(false);
    };

    fetchProducts()
  }, [update]);

  // check if user have an account 
  useEffect(() => {
    if (authorLoading) return;
    if (!user) {
      navigate('/login')
      displayNotification("Vous devez être connectés et avoir les droits pour consulter le catalogue")
    } else {
      checkHasRights(user.id)
        .then((rights) => {
          if (!rights) {
            displayNotification("Vous n'avez pas (encore ?) les droits. Pour passer une commande, veuillez déposer un fichier dans votre espace compte")
            navigate('/account')
          }
        })
    }
  }, [authorLoading])

  const filteredProducts = products.filter(product =>
    `${product.name} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <input
        type="text"
        placeholder="Rechercher par nom ou catégorie"
        className="mb-6 px-4 py-2 border border-gray-300 rounded w-full border-[#2E2EFF]"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? <Loading /> : (search == '') ? <></> : <ProductCarousel data={filteredProducts}></ProductCarousel>}
    </div>
  );
}

function Catalog() {
  const categoriesList = ["légumes", "fruits", "féculents", "conserves", "hygiène", "autre"]
  const [productsByCategory, setProductsByCategory] = useState({})
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsFromCategory = async (category) => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq('category', category);
      if (error) {
        displayNotification("Erreur lors du téléchargement des produits", error.message, "danger")
      } else {
        const productsWithImages = await Promise.all(
          data.map(async product => {
            const { data: imgData, error: imgError } = await supabase
              .storage
              .from("images")
              .download(product.image_name);

            if (imgError) {
              displayNotification("Erreur lors du téléchargement de l'image " + product.image_name, imgError.message, "warning")
            } else {
              product.imageUrl = URL.createObjectURL(imgData);
            }
            return product;
          })
        );

        setProductsByCategory(prevData => ({
          ...prevData,
          [category]: productsWithImages
        }));
      }
    };

    const fetchProductsByCategories = async () => {
      setLoading(true);
      await Promise.all(categoriesList.map((category) => fetchProductsFromCategory(category)));
      setLoading(false);
    }
    fetchProductsByCategories()
  }, []);

  return (
    <>
      <h1 className="text-[#2E2EFF] text-5xl lg:text-7xl font-extrabold leading-tight ml-5 mt-5">Nos produits</h1>

      <SearchBar></SearchBar>

      <div className="my-4 items-center justify-center text-sm font-bold lg:text-2xl text-center">
        <p className="m-auto text-center w-[75%] text-rayonorange mb-2">
          À noter que les images des produits sont non contractuelles et peuvent ne pas refléter fidèlement les marques ou références effectivement proposées.
        </p>
      </div>

      {loading ? <Loading /> : (
        <div>
          {categoriesList.map((category) => {
            const products = productsByCategory[category] || [];
            if (products.length > 0) {
              return <div key={category}>
                <div className="flex items-start ...">
                  <p className="ml-5 text-[#3435FF] text-3xl lg:text-4xl mb-2 mt-10 font-extrabold text-left">{category.slice(0, 1).toUpperCase() + category.slice(1, category.length)}</p>
                </div>
                <ProductCarousel data={products} />
              </div>
            }
            else {
              return null
            }
          })}
        </div>
      )}
    </>
  )
}

export default Catalog