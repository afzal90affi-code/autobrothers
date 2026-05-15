import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../lib/firebase'
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export default function Admin() {
  const [logged, setLogged] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<'products' | 'categories'>('products')
  const [prods, setProds] = useState<any[]>([])
  const [cats, setCats] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [pForm, setPForm] = useState({ title: '', price: '', description: '', category: '', condition: 'Good', image: '', image2: '', videoUrl: '', featured: false, inStock: true })
  const [cForm, setCForm] = useState({ name: '', icon: '⚙️', image: '', active: true })

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'products'), s => setProds(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const unsub2 = onSnapshot(collection(db, 'categories'), s => setCats(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { unsub1(); unsub2() }
  }, [])

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return alert('Email aur Password dono zaroori hain')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setLogged(true)
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') alert('Ye email nahi mila')
      else if (err.code === 'auth/wrong-password') alert('Galat password')
      else if (err.code === 'auth/invalid-email') alert('Invalid email format')
      else if (err.code === 'auth/invalid-credential') alert('Email ya password galat hai')
      else alert('Login failed: ' + err.message)
    }
  }

  const handleImageUpload = async (e: any, field: 'image' | 'image2') => {
    const file = e.target.files[0]; if (!file) return; setUploading(true)
    try {
      const formData = new FormData(); formData.append('image', file)
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) setPForm(p => ({ ...p, [field]: data.data.url }))
      else alert('Upload failed')
    } catch { alert('Upload error') }
    setUploading(false)
  }

  const handleCatImageUpload = async (e: any) => {
    const file = e.target.files[0]; if (!file) return; setUploading(true)
    try {
      const formData = new FormData(); formData.append('image', file)
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) setCForm(c => ({ ...c, image: data.data.url }))
      else alert('Upload failed')
    } catch { alert('Upload error') }
    setUploading(false)
  }

  const resetPForm = () => { setPForm({ title: '', price: '', description: '', category: '', condition: 'Good', image: '', image2: '', videoUrl: '', featured: false, inStock: true }); setEditId(null) }
  const resetCForm = () => { setCForm({ name: '', icon: '⚙️', image: '', active: true }); setEditId(null) }

  const saveProduct = async () => {
    if (!pForm.title.trim()) return alert('Title zaroori hai')
    try {
      if (editId) { await updateDoc(doc(db, 'products', editId), pForm); alert('Product updated! ✅') }
      else { await addDoc(collection(db, 'products'), { ...pForm, createdAt: serverTimestamp() }); alert('Product added! ✅') }
      resetPForm()
    } catch { alert('Error') }
  }

  const saveCategory = async () => {
    if (!cForm.name.trim()) return alert('Name zaroori hai')
    try {
      if (editId) { await updateDoc(doc(db, 'categories', editId), cForm); alert('Category updated! ✅') }
      else { await addDoc(collection(db, 'categories'), cForm); alert('Category added! ✅') }
      resetCForm()
    } catch { alert('Error') }
  }

  const editProduct = (p: any) => {
    setEditId(p.id)
    setPForm({
      title: p.title || '', price: p.price || '', description: p.description || '',
      category: p.category || '', condition: p.condition || 'Good', image: p.image || '',
      image2: p.image2 || '', videoUrl: p.videoUrl || '', featured: p.featured || false,
      inStock: p.inStock !== false
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const editCategory = (c: any) => {
    setEditId(c.id)
    setCForm({ name: c.name || '', icon: c.icon || '⚙️', image: c.image || '', active: c.active !== false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteItem = async (col: string, id: string) => {
    if (!confirm('Delete karein?')) return
    try { await deleteDoc(doc(db, col, id)) } catch { alert('Error') }
  }

  // ═══════ LOGIN SCREEN ═══════
  if (!logged) return (
    <>
      <Head><title>Admin Login | AutoBrothers</title></Head>
      <div className="min-h-screen bg-[#0A1929] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[#13293D] border border-[#1E3A52] rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-xl font-bold mb-1">Admin Login</h1>
          <p className="text-xs text-gray-500 mb-6">AutoBrothers Panel</p>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            placeholder="Admin Email"
            className="w-full px-4 py-3 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50 mb-4"
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            placeholder="Enter Password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50 mb-4"
            autoFocus
          />
          <button onClick={handleLogin} className="w-full bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 rounded-xl text-sm transition-all">Login →</button>
          <Link href="/" className="inline-block mt-4 text-xs text-gray-500 hover:text-[#F5A623]">← Back to Site</Link>
        </div>
      </div>
    </>
  )

  // ═══════ ADMIN DASHBOARD ═══════
  return (
    <>
      <Head><title> Panel login | AutoBrothers</title></Head>
      <div className="min-h-screen bg-[#0A1929] p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#F5A623] mb-2">← Back to Site</Link>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => { setTab('products'); resetPForm() }} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'products' ? 'bg-[#F5A623] text-[#0A1929]' : 'bg-[#13293D] border border-[#1E3A52] text-gray-400 hover:text-[#F5A623]'}`}>📦 Products ({prods.length})</button>
            <button onClick={() => { setTab('categories'); resetCForm() }} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'categories' ? 'bg-[#F5A623] text-[#0A1929]' : 'bg-[#13293D] border border-[#1E3A52] text-gray-400 hover:text-[#F5A623]'}`}>🏷️ Categories ({cats.length})</button>
            <button onClick={() => setLogged(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">🚪 Logout</button>
          </div>
        </div>

        {/* ═══════ PRODUCTS TAB ═══════ */}
        {tab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-[#13293D] border border-[#1E3A52] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{editId ? '✏️ Edit Product' : '➕ Add Product'}</h2>
                {editId && <button onClick={resetPForm} className="text-xs text-gray-400 hover:text-red-400">Cancel ✕</button>}
              </div>
              <div className="space-y-3">
                <input value={pForm.title} onChange={e => setPForm({ ...pForm, title: e.target.value })} placeholder="Product Title *" className="w-full px-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" />
                <input value={pForm.price} onChange={e => setPForm({ ...pForm, price: e.target.value })} placeholder="Price (e.g. Rs 45,000)" className="w-full px-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" />
                <textarea value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })} placeholder="Description" rows={3} className="w-full px-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50 resize-none" />
                <select value={pForm.category} onChange={e => setPForm({ ...pForm, category: e.target.value })} className="w-full px-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-gray-400 focus:outline-none focus:border-[#F5A623]/50">
                  <option value="">Select Category</option>
                  {cats.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
                <select value={pForm.condition} onChange={e => setPForm({ ...pForm, condition: e.target.value })} className="w-full px-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-gray-400 focus:outline-none focus:border-[#F5A623]/50">
                  <option value="Good">Good Condition</option>
                  <option value="Average">Average Condition</option>
                </select>

                {/* Stock Toggle */}
                <div className="flex items-center justify-between bg-[#0D1F30] border border-[#1E3A52] rounded-xl px-4 py-2.5">
                  <span className="text-sm text-gray-400">Stock Status</span>
                  <button onClick={() => setPForm({ ...pForm, inStock: !pForm.inStock })} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${pForm.inStock ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {pForm.inStock ? '✅ In Stock' : '🔴 Out of Stock'}
                  </button>
                </div>

                {/* Image 1 */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Image 1 (Main)</label>
                  <input value={pForm.image} onChange={e => setPForm({ ...pForm, image: e.target.value })} placeholder="Image URL or Upload below" className="w-full px-4 py-2 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" />
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'image')} className="w-full text-xs text-gray-400 mt-1 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F5A623]/20 file:text-[#F5A623]" />
                </div>

                {/* Image 2 */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Image 2 (Optional)</label>
                  <input value={pForm.image2} onChange={e => setPForm({ ...pForm, image2: e.target.value })} placeholder="Image 2 URL or Upload below" className="w-full px-4 py-2 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" />
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'image2')} className="w-full text-xs text-gray-400 mt-1 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F5A623]/20 file:text-[#F5A623]" />
                </div>

                {uploading && <p className="text-xs text-[#F5A623]">⏳ Uploading...</p>}

                {/* Previews */}
                <div className="flex gap-2">
                  {pForm.image && <img src={pForm.image} alt="Img1" className="w-1/2 h-20 object-cover rounded-lg border border-[#1E3A52]" />}
                  {pForm.image2 && <img src={pForm.image2} alt="Img2" className="w-1/2 h-20 object-cover rounded-lg border border-[#1E3A52]" />}
                </div>

                <input value={pForm.videoUrl} onChange={e => setPForm({ ...pForm, videoUrl: e.target.value })} placeholder="Video URL (YouTube/Drive)" className="w-full px-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" />

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={pForm.featured} onChange={e => setPForm({ ...pForm, featured: e.target.checked })} className="accent-[#F5A623]" /> ⭐ Featured
                  </label>
                </div>

                <button onClick={saveProduct} className="w-full bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 rounded-xl text-sm transition-all">
                  {editId ? '💾 Update Product' : '➕ Add Product'}
                </button>
              </div>
            </div>

            {/* Products List */}
            <div className="lg:col-span-2 bg-[#13293D] border border-[#1E3A52] rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">All Products ({prods.length})</h2>
              {prods.length === 0 ? <p className="text-sm text-gray-500">Koi product nahi hai.</p> : (
                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                  {prods.map(p => (
                    <div key={p.id} className="flex items-center gap-3 bg-[#0D1F30] border border-[#1E3A52] rounded-xl p-3 hover:border-[#F5A623]/20 transition-all">
                      <div className="flex gap-1 flex-none">
                        <img src={p.image || 'https://picsum.photos/seed/d/80/80'} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        {p.image2 && <img src={p.image2} alt="" className="w-12 h-12 rounded-lg object-cover hidden sm:block" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">{p.title}</h4>
                        <p className="text-xs text-gray-500">{p.category} • {p.price || 'No price'} {p.featured && '⭐'}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${p.inStock !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {p.inStock !== false ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-none">
                        <button onClick={() => editProduct(p)} className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-all text-xs">✏️</button>
                        <button onClick={() => deleteItem('products', p.id)} className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ CATEGORIES TAB ═══════ */}
        {tab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-[#13293D] border border-[#1E3A52] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{editId ? '✏️ Edit Category' : '➕ Add Category'}</h2>
                {editId && <button onClick={resetCForm} className="text-xs text-gray-400 hover:text-red-400">Cancel ✕</button>}
              </div>
              <div className="space-y-3">
                <input value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} placeholder="Category Name (e.g. Engine) *" className="w-full px-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" />
                <input value={cForm.icon} onChange={e => setCForm({ ...cForm, icon: e.target.value })} placeholder="Icon Emoji (e.g. ⚙️)" className="w-full px-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" />

                {/* Image URL */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Category Image</label>
                  <input value={cForm.image} onChange={e => setCForm({ ...cForm, image: e.target.value })} placeholder="Image URL or Upload below" className="w-full px-4 py-2 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" />
                  <input type="file" accept="image/*" onChange={handleCatImageUpload} className="w-full text-xs text-gray-400 mt-1 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F5A623]/20 file:text-[#F5A623]" />
                </div>

                {uploading && <p className="text-xs text-[#F5A623]">⏳ Uploading...</p>}
                {cForm.image && <img src={cForm.image} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-[#1E3A52]" />}

                <button onClick={saveCategory} className="w-full bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 rounded-xl text-sm transition-all">
                  {editId ? '💾 Update Category' : '➕ Add Category'}
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="lg:col-span-2 bg-[#13293D] border border-[#1E3A52] rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">All Categories ({cats.length})</h2>
              {cats.length === 0 ? <p className="text-sm text-gray-500">Koi category nahi hai.</p> : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {cats.map(c => (
                    <div key={c.id} className="bg-[#0D1F30] border border-[#1E3A52] rounded-xl overflow-hidden group hover:border-[#F5A623]/20 transition-all relative">
                      <div className="flex gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => editCategory(c)} className="w-7 h-7 rounded-full bg-blue-500/80 flex items-center justify-center text-white text-xs hover:bg-blue-500">✏️</button>
                        <button onClick={() => deleteItem('categories', c.id)} className="w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center text-white text-xs hover:bg-red-500">🗑️</button>
                      </div>
                      {c.image && <img src={c.image} alt={c.name} className="w-full h-20 object-cover opacity-60" />}
                      <div className="p-3 text-center">
                        <div className="text-2xl mb-1">{c.icon}</div>
                        <h4 className="text-xs font-semibold">{c.name}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}