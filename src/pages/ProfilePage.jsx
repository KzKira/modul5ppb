// src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react';
import userService from '../services/userService';
import FavoriteButton from '../components/common/FavoriteButton';
import { ResepMakanan } from '../data/makanan';
import { ResepMinuman } from '../data/minuman';
import { useFavorites, useToggleFavorite } from '../hooks/useFavorites';

export default function ProfilePage({ onRecipeClick }) {
  const [profile, setProfile] = useState(userService.getUserProfile());
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile.username || 'Pengguna');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatar, setAvatar] = useState(profile.avatar || null);
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    setProfile(userService.getUserProfile());
  }, []);

  const handleSave = () => {
    const result = userService.saveUserProfile({ username, bio, avatar });
    if (result && result.success) {
      setProfile(result.data);
      setEditing(false);
      alert('Profil disimpan.');
    } else {
      alert('Gagal menyimpan profil.');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    if (!confirm('Hapus data profil dan favorit dari browser?')) return;
    localStorage.removeItem('user_profile');
    localStorage.removeItem('favorites');
    // regenerate identifier on next getUserIdentifier call
    localStorage.removeItem('user_identifier');
    setProfile(userService.getUserProfile());
    setUsername('Pengguna');
    setBio('');
    setAvatar(null);
    setFavoriteIds([]);
    alert('Data dihapus. Halaman akan diperbarui.');
  };

  // Merge semua resep dan filter yang favorit
  const allRecipes = [
    ...Object.values(ResepMakanan.resep || {}),
    ...Object.values(ResepMinuman.resep || {}),
  ];
  // Server-side favorites when available
  const { favorites: serverFavorites, refetch: refetchServerFavorites } = useFavorites();
  const { toggleFavorite } = useToggleFavorite();

  // Normalize favorites from server/localStorage into a Set of numeric ids
  const normalizeToId = (item) => {
    // item may be number/string or object
    if (item == null) return null;
    if (typeof item === 'number') return item;
    if (typeof item === 'string' && item.trim() !== '') {
      // numeric string? try parse
      const n = Number(item);
      if (!Number.isNaN(n)) return n;
      return item;
    }
    if (typeof item === 'object') {
      if (typeof item.id !== 'undefined') return item.id;
      if (typeof item.recipe_id !== 'undefined') return item.recipe_id;
      if (typeof item.recipeId !== 'undefined') return item.recipeId;
      if (item.recipe && typeof item.recipe.id !== 'undefined') return item.recipe.id;
    }
    return null;
  };

  const serverIds = (serverFavorites || []).map(normalizeToId).filter(x => x != null);
  const localIds = (favoriteIds || []).map(normalizeToId).filter(x => x != null);

  const favoriteIdSet = new Set([...serverIds, ...localIds]);

  const favoriteRecipes = allRecipes.filter((r) => favoriteIdSet.has(r.id));

  const handleFavoriteToggle = () => {
    // Refresh local fallback and server favorites
    try {
      setFavoriteIds(JSON.parse(localStorage.getItem('favorites') || '[]'));
    } catch (e) {
      setFavoriteIds([]);
    }

    // If server favorites are used, refetch them
    if (typeof refetchServerFavorites === 'function') {
      refetchServerFavorites();
    }
  };

  const initials = (name) => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map(s => s[0])
      .slice(0,2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Profile Pengguna</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-4">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-28 h-28 rounded-full object-cover border" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
                  {initials(username)}
                </div>
              )}
              <div className="flex flex-col">
                <div className="text-xl font-semibold text-slate-800">{profile.username}</div>
                <div className="text-sm text-slate-500">ID: {profile.userId}</div>
                <div className="mt-2 text-sm text-slate-600 max-w-md">{profile.bio || 'Belum ada bio. Klik edit untuk menambahkan.'}</div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md">Edit Profil</button>
              ) : (
                <>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" id="avatar-input" />
                  <label htmlFor="avatar-input" className="px-3 py-2 bg-white border rounded-md cursor-pointer">Unggah Avatar</label>
                  <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md">Simpan</button>
                  <button onClick={() => { setEditing(false); setUsername(profile.username); setBio(profile.bio); setAvatar(profile.avatar); }} className="px-4 py-2 bg-gray-200 rounded-md">Batal</button>
                </>
              )}

              <button onClick={handleLogout} className="px-3 py-2 bg-red-500 text-white rounded-md">Reset Data</button>
            </div>
          </div>

          {editing && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nama</label>
                <input value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Bio</label>
                <input value={bio} onChange={e => setBio(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Resep Favorit</h2>

          {favoriteRecipes.length === 0 ? (
            <div className="text-slate-500">Anda belum menandai resep sebagai favorit. Jelajahi resep dan klik ikon hati untuk menambah favorit.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {favoriteRecipes.map((r) => {
                const isMakanan = Object.values(ResepMakanan.resep || {}).some(x => x.id === r.id);
                return (
                  <div key={`${r.id}-${r.name}`} className="bg-white/5 rounded-2xl overflow-hidden border shadow-sm cursor-pointer" onClick={() => onRecipeClick && onRecipeClick(r.id, isMakanan ? 'makanan' : 'minuman')}>
                    <div className="relative h-36 overflow-hidden">
                      <img loading="lazy" src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 z-10">
                        <FavoriteButton recipeId={r.id} onServerToggle={toggleFavorite} isFavorited={favoriteIdsEffective.includes(r.id)} onToggle={handleFavoriteToggle} size="sm" />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-slate-800 line-clamp-2">{r.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{isMakanan ? 'Makanan' : 'Minuman'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
