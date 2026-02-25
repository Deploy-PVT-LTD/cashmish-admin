import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, X, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Link, Image as ImageIcon, Heading1, Heading2, Heading3, Type, Palette, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../lib/api';

// ── Rich Text Editor ────────────────────────────────────────────────
const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64'];
const COLORS = ['#000000', '#374151', '#6b7280', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];

function RichEditor({ value, onChange }) {
    const editorRef = useRef(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showFontSize, setShowFontSize] = useState(false);
    const [activeFormats, setActiveFormats] = useState({});

    // sync initial value
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, []); // eslint-disable-line

    const exec = useCallback((command, val = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, val);
        // sync back content
        onChange(editorRef.current?.innerHTML || '');
        updateActiveFormats();
    }, [onChange]);

    const updateActiveFormats = () => {
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough'),
            justifyLeft: document.queryCommandState('justifyLeft'),
            justifyCenter: document.queryCommandState('justifyCenter'),
            justifyRight: document.queryCommandState('justifyRight'),
            justifyFull: document.queryCommandState('justifyFull'),
            insertUnorderedList: document.queryCommandState('insertUnorderedList'),
            insertOrderedList: document.queryCommandState('insertOrderedList'),
        });
    };

    const handleInput = () => {
        onChange(editorRef.current?.innerHTML || '');
        updateActiveFormats();
    };

    const insertLink = () => {
        const url = prompt('Enter URL:', 'https://');
        if (url) exec('createLink', url);
    };

    const setFontSize = (size) => {
        // execCommand fontSize only accepts 1-7; use a workaround with span
        editorRef.current?.focus();
        document.execCommand('fontSize', false, '7');
        const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
        fontElements?.forEach(el => {
            el.removeAttribute('size');
            el.style.fontSize = size + 'px';
        });
        onChange(editorRef.current?.innerHTML || '');
        setShowFontSize(false);
    };

    const setColor = (color) => {
        exec('foreColor', color);
        setShowColorPicker(false);
    };

    const btnCls = (active) =>
        `p-1.5 rounded transition-all cursor-pointer text-sm ${active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`;

    const divider = <div className="w-px h-6 bg-gray-200 mx-0.5 self-center" />;

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap items-center gap-0.5">

                {/* Headings */}
                <button type="button" title="Heading 1" className={btnCls(false)} onClick={() => exec('formatBlock', 'h1')}><Heading1 size={15} /></button>
                <button type="button" title="Heading 2" className={btnCls(false)} onClick={() => exec('formatBlock', 'h2')}><Heading2 size={15} /></button>
                <button type="button" title="Heading 3" className={btnCls(false)} onClick={() => exec('formatBlock', 'h3')}><Heading3 size={15} /></button>
                <button type="button" title="Paragraph" className={btnCls(false)} onClick={() => exec('formatBlock', 'p')}><Type size={15} /></button>
                {divider}

                {/* Text Style */}
                <button type="button" title="Bold" className={btnCls(activeFormats.bold)} onClick={() => exec('bold')}><Bold size={15} /></button>
                <button type="button" title="Italic" className={btnCls(activeFormats.italic)} onClick={() => exec('italic')}><Italic size={15} /></button>
                <button type="button" title="Underline" className={btnCls(activeFormats.underline)} onClick={() => exec('underline')}><Underline size={15} /></button>
                <button type="button" title="Strikethrough" className={btnCls(activeFormats.strikeThrough)} onClick={() => exec('strikeThrough')}><Strikethrough size={15} /></button>
                {divider}

                {/* Font Size */}
                <div className="relative">
                    <button
                        type="button"
                        title="Font Size"
                        className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                        onClick={() => { setShowFontSize(!showFontSize); setShowColorPicker(false); }}
                    >
                        Size <ChevronDown size={12} />
                    </button>
                    {showFontSize && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-1 grid grid-cols-3 gap-0.5 w-32">
                            {FONT_SIZES.map(s => (
                                <button key={s} type="button" className="px-2 py-1 text-xs hover:bg-blue-50 hover:text-blue-600 rounded cursor-pointer transition-colors"
                                    onClick={() => setFontSize(s)}>{s}px</button>
                            ))}
                        </div>
                    )}
                </div>
                {divider}

                {/* Alignment */}
                <button type="button" title="Align Left" className={btnCls(activeFormats.justifyLeft)} onClick={() => exec('justifyLeft')}><AlignLeft size={15} /></button>
                <button type="button" title="Align Center" className={btnCls(activeFormats.justifyCenter)} onClick={() => exec('justifyCenter')}><AlignCenter size={15} /></button>
                <button type="button" title="Align Right" className={btnCls(activeFormats.justifyRight)} onClick={() => exec('justifyRight')}><AlignRight size={15} /></button>
                <button type="button" title="Justify" className={btnCls(activeFormats.justifyFull)} onClick={() => exec('justifyFull')}><AlignJustify size={15} /></button>
                {divider}

                {/* Lists */}
                <button type="button" title="Bullet List" className={btnCls(activeFormats.insertUnorderedList)} onClick={() => exec('insertUnorderedList')}><List size={15} /></button>
                <button type="button" title="Numbered List" className={btnCls(activeFormats.insertOrderedList)} onClick={() => exec('insertOrderedList')}><ListOrdered size={15} /></button>
                {divider}

                {/* Color */}
                <div className="relative">
                    <button
                        type="button"
                        title="Text Color"
                        className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                        onClick={() => { setShowColorPicker(!showColorPicker); setShowFontSize(false); }}
                    >
                        <Palette size={15} /> <ChevronDown size={12} />
                    </button>
                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 flex flex-wrap gap-1.5 w-36">
                            {COLORS.map(c => (
                                <button key={c} type="button" title={c}
                                    className="w-6 h-6 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform cursor-pointer shadow-sm"
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    )}
                </div>
                {divider}

                {/* Extras */}
                <button type="button" title="Insert Link" className={btnCls(false)} onClick={insertLink}><Link size={15} /></button>
                {divider}

                {/* Clear */}
                <button
                    type="button"
                    title="Remove Formatting"
                    className="px-2 py-1.5 rounded text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                    onClick={() => exec('removeFormat')}
                >
                    Clear
                </button>
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyUp={updateActiveFormats}
                onMouseUp={updateActiveFormats}
                onClick={() => { setShowColorPicker(false); setShowFontSize(false); }}
                className="min-h-[220px] max-h-[400px] overflow-y-auto p-4 text-sm text-gray-800 outline-none focus:bg-blue-50/20 transition-colors
                    [&_h1]:text-3xl [&_h1]:font-black [&_h1]:mb-3 [&_h1]:text-gray-900
                    [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-gray-800
                    [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-gray-700
                    [&_p]:mb-2 [&_p]:leading-relaxed
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2
                    [&_li]:mb-1
                    [&_a]:text-blue-600 [&_a]:underline
                    [&_strong]:font-bold [&_em]:italic"
                style={{ lineHeight: '1.7' }}
            />

            {/* Footer hint */}
            <div className="bg-gray-50 border-t border-gray-100 px-3 py-1.5 text-[10px] text-gray-400 flex items-center gap-2">
                <span>Ctrl+B Bold</span> · <span>Ctrl+I Italic</span> · <span>Ctrl+U Underline</span> · <span>Ctrl+Z Undo</span>
            </div>
        </div>
    );
}

// ── Main Blogs Page ────────────────────────────────────────────────
const Blogs = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        author: '',
        image: '',
        status: 'draft',
    });

    const fetchBlogs = async () => {
        try {
            const response = await api.get('/blogs/all');
            setBlogs(response.data);
        } catch (error) {
            console.error("Error fetching blogs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBlogs(); }, []);

    const resetForm = () => {
        setFormData({ title: '', excerpt: '', content: '', author: '', image: '', status: 'draft' });
        setEditingBlog(null);
    };

    const openCreateModal = () => { resetForm(); setIsModalOpen(true); };

    const openEditModal = (blog) => {
        setEditingBlog(blog);
        setFormData({
            title: blog.title,
            excerpt: blog.excerpt,
            content: blog.content || '',
            author: blog.author,
            image: blog.image || '',
            status: blog.status,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBlog) {
                await api.put(`/blogs/${editingBlog._id}`, formData);
                Swal.fire({ icon: 'success', title: 'Blog Updated', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            } else {
                await api.post('/blogs', formData);
                Swal.fire({ icon: 'success', title: 'Blog Created', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            }
            setIsModalOpen(false);
            resetForm();
            fetchBlogs();
        } catch (error) {
            console.error("Error saving blog:", error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong.' });
        }
    };

    const handleToggleStatus = async (blog) => {
        const newStatus = blog.status === 'published' ? 'draft' : 'published';
        try {
            await api.put(`/blogs/${blog._id}`, { status: newStatus });
            Swal.fire({ icon: 'success', title: newStatus === 'published' ? 'Blog Published!' : 'Moved to Draft', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            fetchBlogs();
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This blog will be permanently deleted!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, delete it!'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/blogs/${id}`);
                Swal.fire('Deleted!', 'Blog has been deleted.', 'success');
                fetchBlogs();
            } catch (error) {
                console.error("Error deleting blog:", error);
            }
        }
    };

    const filteredBlogs = blogs.filter(blog => {
        const matchesFilter = filter === 'all' || blog.status === filter;
        const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            blog.author.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
                        <p className="text-gray-500 text-sm mt-1">Create, edit, and publish blog posts.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 text-sm font-medium"
                    >
                        <Plus size={16} /> New Blog Post
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        {['all', 'draft', 'published'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search title or author..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Blog List */}
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="text-center py-20 text-gray-400">Loading blogs...</div>
                    ) : filteredBlogs.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                            No blogs found. Create your first post!
                        </div>
                    ) : (
                        filteredBlogs.map((blog) => (
                            <div key={blog._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        {blog.image && (
                                            <img src={blog.image} alt={blog.title} className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 truncate">{blog.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${blog.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {blog.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-1 mb-1">{blog.excerpt}</p>
                                            <p className="text-xs text-gray-400 font-medium">
                                                By {blog.author} • {new Date(blog.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-start md:self-center flex-shrink-0">
                                        <button
                                            onClick={() => handleToggleStatus(blog)}
                                            className={`p-2 rounded-lg transition-colors ${blog.status === 'published'
                                                ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                                                : 'text-green-600 bg-green-50 hover:bg-green-100'
                                                }`}
                                            title={blog.status === 'published' ? 'Move to Draft' : 'Publish'}
                                        >
                                            {blog.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(blog)}
                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(blog._id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Use the toolbar to format your content</p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Blog post title"
                                />
                            </div>

                            {/* Excerpt */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Excerpt *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Short description shown on blog listing"
                                />
                            </div>

                            {/* Rich Content Editor */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content</label>
                                <RichEditor
                                    key={editingBlog?._id || 'new'}
                                    value={formData.content}
                                    onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                                />
                            </div>

                            {/* Author + Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Author *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Author name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image URL</label>
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="https://example.com/image.jpg"
                                />
                                {formData.image && (
                                    <img src={formData.image} alt="preview" className="mt-2 h-20 rounded-lg object-cover border border-gray-100" onError={(e) => e.target.style.display = 'none'} />
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                                >
                                    {editingBlog ? 'Update Blog' : 'Publish Blog'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default Blogs;
