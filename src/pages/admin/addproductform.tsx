import { useState, useEffect } from 'react';
import { writeClient } from '../../lib/sanityadmin';
import { X, Upload } from 'lucide-react';

export default function AddProductForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('Good');
  const [featured, setFeatured] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [subcatId, setSubcatId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch subcategories for dropdown
  const [subcats, setSubcats] = useState<any[]>([]);
  useEffect(() => {
    // Fetch logic for subcats here
  }, []);

  const handleSave = async () => {
    if (!title || !subcatId) return alert('Title and Subcategory are required!');
    setSaving(true);

    try {
      let imageAsset = null;
      
      // 1. Image Upload to Sanity
      if (imageFile) {
        imageAsset = await writeClient.assets.upload('image', imageFile, {
          filename: imageFile.name,
        });
      }

      // 2. Create Product Document
      await writeClient.create({
        _type: 'product',
        title: title,
        slug: { _type: 'slug', current: title.toLowerCase().replace(/\s+/g, '-') },
        price: price,
        condition: condition,
        featured: featured,
        newArrival: newArrival,
        inStock: true,
        subcategory: { _type: 'reference', _ref: subcatId },
        images: imageAsset ? [{ _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id } }] : [],
      });

      alert('Product Added Successfully!');
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0A1929] border-l border-[#1E3A52] h-full overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Add New Product</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Product Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white focus:outline-none focus:border-[#F5A623]" />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Price (e.g Rs 25,000)</label>
            <input value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white focus:outline-none focus:border-[#F5A623]" />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Sub Category *</label>
            <select value={subcatId} onChange={e => setSubcatId(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-gray-400 focus:outline-none">
              <option value="">Select...</option>
              {/* {subcats.map(sub => <option key={sub._id} value={sub._id}>{sub.title}</option>)} */}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Image</label>
            <label className="flex items-center justify-center gap-2 w-full h-24 bg-[#13293D] border-2 border-dashed border-[#1E3A52] rounded-xl cursor-pointer hover:border-[#F5A623] text-gray-500 text-sm">
              <Upload size={16} /> {imageFile ? imageFile.name : 'Click to Upload'}
              <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="accent-[#F5A623]" />
              🔥 Featured
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={newArrival} onChange={e => setNewArrival(e.target.checked)} className="accent-[#F5A623]" />
              🆕 New Arrival
            </label>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 rounded-xl mt-4 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
  
}