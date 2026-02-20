import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../lib/api';

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

    useEffect(() => {
        fetchBlogs();
    }, []);

    const resetForm = () => {
        setFormData({ title: '', excerpt: '', content: '', author: '', image: '', status: 'draft' });
        setEditingBlog(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

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
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${blog.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                            </h2>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Blog post title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Short description shown on blog listing"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                    rows={6}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                    placeholder="Full blog content..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="Author name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                                >
                                    {editingBlog ? 'Update Blog' : 'Create Blog'}
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
