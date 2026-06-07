import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const CAT_ICONS = { 'Food Distribution':'🍱','School Support':'📚','Community Cleanup':'🧹','Medical Support':'🏥','Flood Relief':'🌊','Emergency Response':'🚨','Other':'🌍' }

function Lightbox({ photos, index, onClose }) {
  const [current, setCurrent] = useState(index)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrent(p => Math.min(photos.length - 1, p + 1))
      if (e.key === 'ArrowLeft') setCurrent(p => Math.max(0, p - 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [photos.length, onClose])

  const photo = photos[current]

  return (
    <div className="fixed inset-0 z-[9000] bg-black/95 backdrop-blur-xl flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-all z-10">×</button>
        
        {/* Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium">
          {current + 1} / {photos.length}
        </div>

        {/* Nav prev */}
        {current > 0 && (
          <button onClick={() => setCurrent(p => p - 1)} className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl transition-all z-10">‹</button>
        )}

        {/* Image */}
        <div className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center">
          <img
            src={photo.url}
            alt={photo.caption || 'Mission photo'}
            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl animate-fade-in"
          />
        </div>

        {/* Nav next */}
        {current < photos.length - 1 && (
          <button onClick={() => setCurrent(p => p + 1)} className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl transition-all z-10">›</button>
        )}

        {/* Caption */}
        {photo.caption && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-md text-white text-sm text-center max-w-sm">
            {photo.caption}
          </div>
        )}

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-xs sm:max-w-lg pb-1">
            {photos.map((p, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === current ? 'border-brand-400 scale-110' : 'border-white/20 opacity-50 hover:opacity-80'}`}>
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function UploadModal({ missionId, missionTitle, onClose, onUploaded }) {
  const [preview, setPreview] = useState(null)
  const [base64, setBase64] = useState('')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => { setPreview(ev.target.result); setBase64(ev.target.result) }
    reader.readAsDataURL(file)
  }

  const upload = async () => {
    if (!base64) return
    setUploading(true)
    try {
      await api.post(`/gallery/${missionId}/upload`, { url: base64, caption })
      onUploaded()
      onClose()
    } catch (err) { alert(err.response?.data?.message || 'Upload failed') }
    setUploading(false)
  }

  return (
    <div className="fixed inset-0 z-[8000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card max-w-md w-full animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white">Upload Photo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <p className="text-sm text-slate-400 mb-4">Adding to: <span className="text-white font-semibold">{missionTitle}</span></p>
        
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-dark-500 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-brand-600/50 transition-colors mb-4 overflow-hidden relative"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-slate-400 text-sm">Click to select image</p>
              <p className="text-slate-600 text-xs">Max 5MB · JPG, PNG, WebP</p>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>

        <div className="mb-5">
          <label className="label">Caption (optional)</label>
          <input className="input" placeholder="Describe what's happening…" value={caption} onChange={e => setCaption(e.target.value)} />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={upload} disabled={!base64 || uploading} className="btn-primary flex-1 justify-center">
            {uploading ? 'Uploading…' : 'Upload Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GalleryPage() {
  const { user } = useAuth()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [lightbox, setLightbox] = useState(null) // { photos, index }
  const [showUpload, setShowUpload] = useState(false)
  const [uploadTarget, setUploadTarget] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const canUpload = ['admin', 'super_admin', 'volunteer'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/gallery')
      setAlbums(data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openUpload = (album) => { setUploadTarget(album); setShowUpload(true) }
  const deletePhoto = async (missionId, idx) => {
    if (!confirm('Delete this photo?')) return
    try { await api.delete(`/gallery/${missionId}/photo/${idx}`); load() } catch {}
  }

  const cats = ['all', ...new Set(albums.map(a => a.category).filter(Boolean))]
  const filtered = filterCat === 'all' ? albums : albums.filter(a => a.category === filterCat)
  const allPhotos = albums.flatMap(a => a.photos.map(p => ({ ...p, missionTitle: a.title })))
  const totalPhotos = allPhotos.length

  if (selectedAlbum) {
    const album = albums.find(a => a.missionId === selectedAlbum) || albums.find(a => String(a.missionId) === String(selectedAlbum))
    if (!album) { setSelectedAlbum(null); return null }
    return (
      <div className="page-container animate-fade-in">
        {lightbox && <Lightbox photos={lightbox.photos} index={lightbox.index} onClose={() => setLightbox(null)} />}
        {showUpload && uploadTarget && (
          <UploadModal missionId={uploadTarget.missionId} missionTitle={uploadTarget.title} onClose={() => setShowUpload(false)} onUploaded={load} />
        )}

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedAlbum(null)} className="btn-secondary text-sm py-2">← Albums</button>
            <div>
              <h1 className="font-black text-white text-xl">{album.title}</h1>
              <p className="text-xs text-slate-400">{CAT_ICONS[album.category]} {album.category} · {album.photos.length} photos</p>
            </div>
          </div>
          {canUpload && (
            <button onClick={() => openUpload(album)} className="btn-primary text-sm py-2">+ Add Photo</button>
          )}
        </div>

        {album.photos.length === 0 ? (
          <div className="card text-center py-20">
            <p className="text-5xl mb-4">📷</p>
            <p className="text-slate-400 mb-2">No photos yet</p>
            {canUpload && <button onClick={() => openUpload(album)} className="btn-primary mt-4">Upload First Photo</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {album.photos.map((photo, idx) => (
              <div key={idx} className="group relative rounded-2xl overflow-hidden aspect-square bg-dark-800 border border-dark-600 cursor-pointer hover:border-brand-600/50 transition-all hover:shadow-xl hover:shadow-brand-900/20"
                onClick={() => setLightbox({ photos: album.photos, index: idx })}>
                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  {photo.caption && <p className="text-white text-xs font-medium line-clamp-2">{photo.caption}</p>}
                </div>
                {/* Delete (admin) */}
                {['admin','super_admin'].includes(user?.role) && (
                  <button onClick={e => { e.stopPropagation(); deletePhoto(album.missionId, idx) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                    ×
                  </button>
                )}
                {/* Expand icon */}
                <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      {lightbox && <Lightbox photos={lightbox.photos} index={lightbox.index} onClose={() => setLightbox(null)} />}
      {showUpload && uploadTarget && (
        <UploadModal missionId={uploadTarget.missionId} missionTitle={uploadTarget.title} onClose={() => setShowUpload(false)} onUploaded={load} />
      )}

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="section-title mb-1">🖼 Media Gallery</h1>
          <p className="text-slate-400 text-sm">{albums.length} albums · {totalPhotos} photos from missions</p>
        </div>
      </div>

      {/* Quick photo wall – latest */}
      {allPhotos.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-slate-300 text-sm mb-3">Recent Photos</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allPhotos.slice(0, 12).map((photo, idx) => (
              <div key={idx} className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden cursor-pointer border border-dark-600 hover:border-brand-600/50 transition-all hover:scale-105"
                onClick={() => setLightbox({ photos: allPhotos, index: idx })}>
                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {cats.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`flex-shrink-0 text-sm px-4 py-2 rounded-xl border transition-all capitalize ${filterCat === cat ? 'bg-brand-600 border-brand-500 text-white' : 'bg-dark-800 border-dark-600 text-slate-400 hover:border-brand-600/40'}`}>
            {cat !== 'all' && (CAT_ICONS[cat] || '🌍')} {cat === 'all' ? 'All Albums' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-20">
          <p className="text-5xl mb-4">📷</p>
          <p className="text-slate-400 mb-2">No mission galleries yet</p>
          <p className="text-slate-500 text-sm">Photos will appear here once missions have media uploaded</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(album => (
            <div key={album.missionId} className="group card-hover overflow-hidden p-0">
              {/* Cover */}
              <div className="h-48 relative overflow-hidden bg-dark-700 cursor-pointer" onClick={() => setSelectedAlbum(album.missionId)}>
                {album.cover ? (
                  <img src={album.cover} alt={album.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    {CAT_ICONS[album.category] || '🌍'}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="font-black text-white text-sm line-clamp-1">{album.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-300">{album.photoCount} photos</span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-400">{CAT_ICONS[album.category]} {album.category}</span>
                  </div>
                </div>
                <div className={`absolute top-3 right-3 badge border text-xs ${album.status === 'active' ? 'badge-volunteer' : 'bg-slate-700/60 text-slate-400 border-slate-600/30'}`}>{album.status}</div>
              </div>

              {/* Actions */}
              <div className="p-4 flex items-center justify-between">
                <button onClick={() => setSelectedAlbum(album.missionId)} className="text-sm text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                  View Gallery →
                </button>
                {canUpload && (
                  <button onClick={() => openUpload(album)} className="text-xs px-3 py-1.5 rounded-xl bg-dark-700 border border-dark-600 text-slate-400 hover:border-brand-600/50 hover:text-brand-300 transition-all">
                    + Photo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
