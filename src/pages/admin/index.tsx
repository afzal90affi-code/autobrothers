import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PlusCircle, LayoutGrid, Layers, Package, X, Upload, Loader2, Home, Trash2, Pencil } from 'lucide-react';
import { client } from '../../lib/sanityadmin'; 

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cats, setCats] = useState<any[]>([]);
  const [subcats, setSubcats] = useState<any[]>([]);
  const [prods, setProds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [catTitle, setCatTitle] = useState('');
  const [catTag, setCatTag] = useState('none');
  const [catImage, setCatImage] = useState<File | null>(null);

  const [subCatTitle, setSubCatTitle] = useState('');
  const [subCatParent, setSubCatParent] = useState('');
  const [subCatImage, setSubCatImage] = useState<File | null>(null);

  const [prodTitle, setProdTitle] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCondition, setProdCondition] = useState('Good');
  const [prodSubCat, setProdSubCat] = useState('');
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodNewArrival, setProdNewArrival] = useState(false);
  const [prodDescription, setProdDescription] = useState('');
   const [prodModel, setProdModel] = useState(''); 
  const [prodImage, setProdImage] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      const catData = await client.fetch(`*[_type == "category"] | order(_createdAt desc){_id, title, tag, "image": image.asset->url}`);
      const subCatData = await client.fetch(`*[_type == "subcategory"] | order(_createdAt desc){_id, title, "parentTitle": parentCategory->title, "parentId": parentCategory->_id, "image": image.asset->url}`);
      const prodData = await client.fetch(`*[_type == "product"] | order(_createdAt desc){_id, title, price, condition, featured, newArrival, description, "subCatTitle": subcategory->title, "subCatId": subcategory->_id, "image": images[0].asset->url}`);
      
      setCats(catData);
      setSubcats(subCatData);
      setProds(prodData);
    } catch (error) { 
      console.error("Fetch error:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForms = () => {
    setCatTitle(''); setCatTag('none'); setCatImage(null);
    setSubCatTitle(''); setSubCatParent(''); setSubCatImage(null);
    setProdTitle(''); setProdPrice(''); setProdCondition('Good'); setProdSubCat('');
    setProdFeatured(false); setProdNewArrival(false); setProdDescription('');setProdModel(''); setProdImage(null);
    setEditingId(null);
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Are you sure? All linked items will also be deleted.')) return;
    try {
      const res = await fetch('/api/admin/delete-data', { 
        method: 'POST', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ id, type }) 
      });
      const data = await res.json();
      if (data.success) { 
        fetchData(); 
      } else { 
        alert('Failed to delete: ' + (data.error || 'Unknown error')); 
      }
    } catch (error) { 
      alert('Error deleting'); 
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingId(cat._id); setCatTitle(cat.title); setCatTag(cat.tag || 'none'); setCatImage(null);
    setShowForm('category');
  };

  const handleEditSubCategory = (sub: any) => {
    setEditingId(sub._id); setSubCatTitle(sub.title); setSubCatParent(sub.parentId || ''); setSubCatImage(null);
    setShowForm('subcategory');
  };

  const handleEditProduct = (p: any) => {
    setEditingId(p._id); setProdTitle(p.title); setProdPrice(p.price); setProdCondition(p.condition || 'Good');
    setProdSubCat(p.subCatId || ''); setProdFeatured(p.featured); setProdNewArrival(p.newArrival);
    setProdDescription(p.description || ''); setProdModel(p.model || ''); setProdImage(null);
    setShowForm('product');
  };

  const handleSaveCategory = async () => {
    if (!catTitle) return alert('Title is required!');
    setSaving(true);
    try {
      let imageData = null; let fileName = null;
      if (catImage) { imageData = await convertToBase64(catImage); fileName = catImage.name; }

      const endpoint = editingId ? '/api/admin/update-data' : '/api/admin/add-data';
      const payload = editingId 
        ? { id: editingId, type: 'category', title: catTitle, tag: catTag, imageData, fileName }
        : { type: 'category', title: catTitle, slug: catTitle.toLowerCase().replace(/\s+/g, '-'), tag: catTag, imageData, fileName };

      const response = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed');

      alert(editingId ? 'Category Updated! ✅' : 'Category Added! 🎉');
      resetForms(); setShowForm(''); fetchData(); 
    } catch (error: any) { alert(`Error: ${error.message}`); } finally { setSaving(false); }
  };

  const handleSaveSubCategory = async () => {
    if (!subCatTitle || !subCatParent) return alert('Title and Parent are required!');
    setSaving(true);
    try {
      let imageData = null; let fileName = null;
      if (subCatImage) { imageData = await convertToBase64(subCatImage); fileName = subCatImage.name; }

      const endpoint = editingId ? '/api/admin/update-data' : '/api/admin/add-data';
      const payload = editingId 
        ? { id: editingId, type: 'subcategory', title: subCatTitle, imageData, fileName }
        : { type: 'subcategory', title: subCatTitle, slug: subCatTitle.toLowerCase().replace(/\s+/g, '-'), parentId: subCatParent, imageData, fileName };

      const response = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed');

      alert(editingId ? 'Sub Category Updated! ✅' : 'Sub Category Added! 🎉');
      resetForms(); setShowForm(''); fetchData(); 
    } catch (error: any) { alert(`Error: ${error.message}`); } finally { setSaving(false); }
  };

  const handleSaveProduct = async () => {
    if (!prodTitle || !prodSubCat) return alert('Title and Sub Category are required!');
    setSaving(true);
    try {
      let imageData = null; let fileName = null;
      if (prodImage) { imageData = await convertToBase64(prodImage); fileName = prodImage.name; }

      const endpoint = editingId ? '/api/admin/update-data' : '/api/admin/add-data';
      const payload = editingId 
        ? { id: editingId, type: 'product', title: prodTitle, price: prodPrice, condition: prodCondition, featured: prodFeatured, newArrival: prodNewArrival, description: prodDescription, imageData, fileName }
        : { type: 'product', title: prodTitle, slug: prodTitle.toLowerCase().replace(/\s+/g, '-'), parentId: prodSubCat, price: prodPrice, condition: prodCondition, featured: prodFeatured, newArrival: prodNewArrival, description: prodDescription, model: prodModel, imageData, fileName };

      const response = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed');

      alert(editingId ? 'Product Updated! ✅' : 'Product Added! 🎉');
      resetForms(); setShowForm(''); fetchData(); 
    } catch (error: any) { alert(`Error: ${error.message}`); } finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>AutoBrothers | Admin Panel</title></Head>
      <div className="min-h-screen bg-[#0A1929] text-white flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <div className="md:w-64 bg-[#13293D] border-r border-[#1E3A52] md:min-h-screen flex md:flex-col flex-row overflow-x-auto">
          <div className="hidden md:flex items-center gap-2 p-6 border-b border-[#1E3A52]"><span className="font-extrabold text-lg">Auto<span className="text-[#F5A623]">Admin</span></span></div>
          <nav className="flex md:flex-col flex-row w-full md:pt-4">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'dashboard' ? 'text-[#F5A623] bg-[#0A1929] border-r-4 border-[#F5A623]' : 'text-gray-400 hover:text-white'}`}><LayoutGrid size={18} /> Dashboard</button>
            <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-3 px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'categories' ? 'text-[#F5A623] bg-[#0A1929] border-r-4 border-[#F5A623]' : 'text-gray-400 hover:text-white'}`}><Layers size={18} /> Categories</button>
            <button onClick={() => setActiveTab('subcategories')} className={`flex items-center gap-3 px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'subcategories' ? 'text-[#F5A623] bg-[#0A1929] border-r-4 border-[#F5A623]' : 'text-gray-400 hover:text-white'}`}><Package size={18} /> Sub Categories</button>
            <button onClick={() => setActiveTab('products')} className={`flex items-center gap-3 px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'products' ? 'text-[#F5A623] bg-[#0A1929] border-r-4 border-[#F5A623]' : 'text-gray-400 hover:text-white'}`}><PlusCircle size={18} /> Products</button>
            <Link href="/" className="mt-auto flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-500 hover:text-white"><Home size={18} /> Back to Website</Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          
          {activeTab === 'dashboard' && ( <div><h1 className="text-2xl font-bold mb-6">Dashboard 🏎️</h1><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="bg-[#13293D] border border-[#1E3A52] p-5 rounded-xl"><p className="text-gray-400 text-xs">Categories</p><p className="text-2xl font-bold text-[#F5A623] mt-1">{cats.length}</p></div><div className="bg-[#13293D] border border-[#1E3A52] p-5 rounded-xl"><p className="text-gray-400 text-xs">Sub Categories</p><p className="text-2xl font-bold text-[#F5A623] mt-1">{subcats.length}</p></div><div className="bg-[#13293D] border border-[#1E3A52] p-5 rounded-xl"><p className="text-gray-400 text-xs">Products</p><p className="text-2xl font-bold text-[#F5A623] mt-1">{prods.length}</p></div></div></div> )}

          {activeTab === 'categories' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Main Categories</h1>
                <button onClick={() => { resetForms(); setShowForm('category'); }} className="bg-[#F5A623] text-[#0A1929] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-[#D4911E]"><PlusCircle size={16} /> Add Category</button>
              </div>
              {loading ? <p className="text-gray-500">Loading...</p> : (
                <div className="space-y-3">
                  {cats.length === 0 && <div className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-10 text-center text-gray-500">No categories.</div>}
                  {cats.map(cat => (
                    <div key={cat._id} className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-4 flex items-center gap-4">
                      {cat.image ? <img src={cat.image} alt="" className="w-14 h-14 rounded-lg object-cover" /> : <div className="w-14 h-14 bg-[#0D1F30] rounded-lg flex items-center justify-center text-xl">📦</div>}
                      <div className="flex-1"><h3 className="font-bold">{cat.title}</h3></div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditCategory(cat)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(cat._id, 'category')} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'subcategories' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Sub Categories</h1>
                <button onClick={() => { resetForms(); setShowForm('subcategory'); }} className="bg-[#F5A623] text-[#0A1929] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-[#D4911E]"><PlusCircle size={16} /> Add Sub Category</button>
              </div>
              {loading ? <p className="text-gray-500">Loading...</p> : (
                <div className="space-y-3">
                  {subcats.length === 0 && <div className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-10 text-center text-gray-500">No sub categories.</div>}
                  {subcats.map(sub => (
                    <div key={sub._id} className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-4 flex items-center gap-4">
                      {sub.image ? <img src={sub.image} alt="" className="w-14 h-14 rounded-lg object-cover" /> : <div className="w-14 h-14 bg-[#0D1F30] rounded-lg flex items-center justify-center text-xl">📦</div>}
                      <div className="flex-1"><h3 className="font-bold">{sub.title}</h3><p className="text-xs text-gray-500">Parent: {sub.parentTitle || 'None'}</p></div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditSubCategory(sub)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(sub._id, 'subcategory')} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Products</h1>
                <button onClick={() => { resetForms(); setShowForm('product'); }} className="bg-[#F5A623] text-[#0A1929] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-[#D4911E]"><PlusCircle size={16} /> Add Product</button>
              </div>
              {loading ? <p className="text-gray-500">Loading...</p> : (
                <div className="space-y-3">
                  {prods.length === 0 && <div className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-10 text-center text-gray-500">No products.</div>}
                  {prods.map(p => (
                    <div key={p._id} className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-4 flex items-center gap-4">
                      {p.image ? <img src={p.image} alt="" className="w-14 h-14 rounded-lg object-cover" /> : <div className="w-14 h-14 bg-[#0D1F30] rounded-lg flex items-center justify-center text-xl">🚗</div>}
                      <div className="flex-1"><h3 className="font-bold">{p.title}</h3><p className="text-xs text-gray-500">Rs {p.price}</p></div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditProduct(p)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(p._id, 'product')} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ MODALS ═══════ */}

      {showForm === 'category' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => { setShowForm(''); resetForms(); }}>
          <div className="w-full max-w-md bg-[#0A1929] border border-[#1E3A52] rounded-2xl p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setShowForm(''); resetForms(); }} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button>
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Category' : 'Add New Category'}</h2>
            <div className="space-y-4">
              <div><label className="text-xs text-gray-400 block mb-1">Category Name *</label><input value={catTitle} onChange={e => setCatTitle(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white focus:outline-none focus:border-[#F5A623]" /></div>
              <div><label className="text-xs text-gray-400 block mb-1">Tag</label><select value={catTag} onChange={e => setCatTag(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-gray-300 focus:outline-none focus:border-[#F5A623]"><option value="none">None</option><option value="featured">🔥 Featured</option><option value="new_arrival">🆕 New Arrival</option></select></div>
              <div><label className="text-xs text-gray-400 block mb-1">Image</label><label className="flex items-center justify-center gap-2 w-full h-24 bg-[#13293D] border-2 border-dashed border-[#1E3A52] rounded-xl cursor-pointer hover:border-[#F5A623] text-gray-500 text-sm"><Upload size={16} /> {catImage ? catImage.name : 'Upload'}<input type="file" accept="image/*" className="hidden" onChange={e => setCatImage(e.target.files?.[0] || null)} /></label></div>
              <button onClick={handleSaveCategory} disabled={saving} className="w-full bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-50">{saving ? 'Saving...' : (editingId ? 'Update Category' : 'Save Category')}</button>
            </div>
          </div>
        </div>
      )}

      {showForm === 'subcategory' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => { setShowForm(''); resetForms(); }}>
          <div className="w-full max-w-md bg-[#0A1929] border border-[#1E3A52] rounded-2xl p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setShowForm(''); resetForms(); }} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button>
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Sub Category' : 'Add New Sub Category'}</h2>
            <div className="space-y-4">
              <div><label className="text-xs text-gray-400 block mb-1">Sub Category Name *</label><input value={subCatTitle} onChange={e => setSubCatTitle(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white focus:outline-none focus:border-[#F5A623]" /></div>
              <div><label className="text-xs text-gray-400 block mb-1">Parent Category *</label>
                <select value={subCatParent} onChange={e => setSubCatParent(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-gray-300 focus:outline-none focus:border-[#F5A623]">
                  <option value="">Select Category...</option>
                  {cats.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-400 block mb-1">Image</label><label className="flex items-center justify-center gap-2 w-full h-24 bg-[#13293D] border-2 border-dashed border-[#1E3A52] rounded-xl cursor-pointer hover:border-[#F5A623] text-gray-500 text-sm"><Upload size={16} /> {subCatImage ? subCatImage.name : 'Upload'}<input type="file" accept="image/*" className="hidden" onChange={e => setSubCatImage(e.target.files?.[0] || null)} /></label></div>
              <button onClick={handleSaveSubCategory} disabled={saving} className="w-full bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-50">{saving ? 'Saving...' : (editingId ? 'Update Sub Category' : 'Save Sub Category')}</button>
            </div>
          </div>
        </div>
      )}

      {showForm === 'product' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => { setShowForm(''); resetForms(); }}>
          <div className="w-full max-w-md bg-[#0A1929] border border-[#1E3A52] rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setShowForm(''); resetForms(); }} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button>
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <div className="space-y-4">
              <div><label className="text-xs text-gray-400 block mb-1">Product Title *</label><input value={prodTitle} onChange={e => setProdTitle(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white focus:outline-none focus:border-[#F5A623]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-400 block mb-1">Price</label><input value={prodPrice} onChange={e => setProdPrice(e.target.value)} placeholder="Rs 25,000" className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white focus:outline-none focus:border-[#F5A623]" /></div>
                <div><label className="text-xs text-gray-400 block mb-1">Condition</label><select value={prodCondition} onChange={e => setProdCondition(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-gray-300 focus:outline-none focus:border-[#F5A623]"><option>Good</option><option>Average</option><option>Bad</option></select></div>
              </div>
              <div><label className="text-xs text-gray-400 block mb-1">Sub Category *</label>
                <select value={prodSubCat} onChange={e => setProdSubCat(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-gray-300 focus:outline-none focus:border-[#F5A623]">
                  <option value="">Select Sub Category...</option>
                  {subcats.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Car Model</label>
                <input 
                  value={prodModel} 
                  onChange={e => setProdModel(e.target.value)} 
                  placeholder="e.g. Corolla 2020, Civic Oriel" 
                  className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white focus:outline-none focus:border-[#F5A623]" 
                />
              </div>
              <div><label className="text-xs text-gray-400 block mb-1">Product Description</label><textarea value={prodDescription} onChange={e => setProdDescription(e.target.value)} rows={3} placeholder="Write details..." className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white focus:outline-none focus:border-[#F5A623] resize-none" /></div>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={prodFeatured} onChange={e => setProdFeatured(e.target.checked)} className="accent-[#F5A623]" /> 🔥 Featured</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={prodNewArrival} onChange={e => setProdNewArrival(e.target.checked)} className="accent-[#F5A623]" /> 🆕 New Arrival</label>
              </div>
              <div><label className="text-xs text-gray-400 block mb-1">Product Image</label><label className="flex items-center justify-center gap-2 w-full h-24 bg-[#13293D] border-2 border-dashed border-[#1E3A52] rounded-xl cursor-pointer hover:border-[#F5A623] text-gray-500 text-sm"><Upload size={16} /> {prodImage ? prodImage.name : 'Upload'}<input type="file" accept="image/*" className="hidden" onChange={e => setProdImage(e.target.files?.[0] || null)} /></label></div>
              <button onClick={handleSaveProduct} disabled={saving} className="w-full bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-50">{saving ? 'Saving...' : (editingId ? 'Update Product' : 'Save Product')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}