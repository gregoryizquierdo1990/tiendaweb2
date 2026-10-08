import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Trash2, Edit3, Plus, Save, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export const AdminCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!newCategory.name || !newCategory.slug) return;
    
    setLoading(true);
    if (editingCategory) {
      await supabase.from('categories').update(newCategory).eq('id', editingCategory.id);
    } else {
      await supabase.from('categories').insert(newCategory);
    }
    setNewCategory({ name: '', slug: '' });
    setEditingCategory(null);
    fetchCategories();
  }

  async function handleDelete(id: number) {
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  }

  return (
    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-white">
      <h2 className="text-lg font-bold mb-4">Gestión de Categorías</h2>
      
      <div className="flex gap-2 mb-6">
        <input 
          placeholder="Nombre" 
          className="bg-slate-950 p-2 rounded border border-slate-700"
          value={newCategory.name} 
          onChange={e => setNewCategory({...newCategory, name: e.target.value})}
        />
        <input 
          placeholder="Slug (ej. series_peliculas)" 
          className="bg-slate-950 p-2 rounded border border-slate-700"
          value={newCategory.slug} 
          onChange={e => setNewCategory({...newCategory, slug: e.target.value})}
        />
        <button onClick={handleSave} className="bg-indigo-600 px-4 py-2 rounded flex items-center gap-2 cursor-pointer">
          <Save className="w-4 h-4" /> {editingCategory ? 'Actualizar' : 'Agregar'}
        </button>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="text-slate-400 text-xs uppercase">
            <th className="p-2">Nombre</th>
            <th className="p-2">Slug</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id} className="border-t border-slate-800">
              <td className="p-2">{cat.name}</td>
              <td className="p-2">{cat.slug}</td>
              <td className="p-2 flex gap-2">
                <button onClick={() => { setEditingCategory(cat); setNewCategory(cat); }} className="text-indigo-400 cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(cat.id)} className="text-rose-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
