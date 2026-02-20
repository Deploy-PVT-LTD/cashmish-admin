import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Star, CheckCircle, XCircle, Trash2, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../lib/api';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchReviews = async () => {
        try {
            const response = await api.get('/reviews/all');
            setReviews(response.data);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/reviews/${id}/status`, { status });

            Swal.fire({
                icon: 'success',
                title: status === 'approved' ? 'Review Approved' : 'Review Rejected',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });

            fetchReviews();
        } catch (error) {
            console.error("Error updating review:", error);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/reviews/${id}`);
                Swal.fire('Deleted!', 'Review has been deleted.', 'success');
                fetchReviews();
            } catch (error) {
                console.error("Error deleting review:", error);
            }
        }
    };

    const filteredReviews = reviews.filter(review => {
        const matchesFilter = filter === 'all' || review.status === filter;
        const matchesSearch = review.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.mobileName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reviews & Feedback</h1>
                        <p className="text-gray-500 text-sm mt-1">Moderate customer reviews before they go live.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm font-medium text-gray-600">
                        Total Reviews: <span className="text-gray-900 font-bold ml-1">{reviews.length}</span>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        {['all', 'pending', 'approved', 'rejected'].map((f) => (
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
                            placeholder="Search reviewer or device..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="text-center py-20 text-gray-400">Loading reviews...</div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                            No reviews found matching criteria.
                        </div>
                    ) : (
                        filteredReviews.map((review) => (
                            <div key={review._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg uppercase flex-shrink-0">
                                            {review.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900">{review.name}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${review.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {review.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium mb-2">{review.mobileName}</p>

                                            <div className="flex gap-1 mb-3">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                                                ))}
                                            </div>

                                            <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                                "{review.description}"
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2 font-medium">
                                                Submitted on {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-start md:self-center">
                                        {review.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(review._id, 'approved')}
                                                    className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(review._id, 'rejected')}
                                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Reject"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </>
                                        )}
                                        {review.status === 'approved' && (
                                            <button
                                                onClick={() => handleStatusUpdate(review._id, 'rejected')}
                                                className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                Reject
                                            </button>
                                        )}
                                        {review.status === 'rejected' && (
                                            <button
                                                onClick={() => handleStatusUpdate(review._id, 'approved')}
                                                className="px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                            >
                                                Approve
                                            </button>
                                        )}

                                        <div className="w-px h-8 bg-gray-200 mx-2 hidden md:block"></div>

                                        <button
                                            onClick={() => handleDelete(review._id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Reviews;
