import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function RecentSubmissions({ submissions = [] }) {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge-pending">Pending</span>;
      case 'accepted':
        return <span className="badge-accepted">Accepted</span>;
      case 'rejected':
        return <span className="badge-rejected">Rejected</span>;
      default:
        return <span className="badge-pending">{status}</span>;
    }
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Submissions</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary"
          onClick={() => navigate('/submissions')}
        >
          View All
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Customer</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Phone</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Storage</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Price</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Status</th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-center text-sm text-muted-foreground">
                  No recent submissions found.
                </td>
              </tr>
            ) : (
              submissions.map((submission) => (
                <tr key={submission._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-4 text-sm font-medium text-foreground truncate max-w-[120px]">
                    {submission.pickUpDetails?.fullName || 'N/A'}
                  </td>
                  <td className="py-4 text-sm text-foreground truncate max-w-[120px]">
                    {submission.mobileId?.phoneModel || submission.mobileId?.brand}
                  </td>
                  <td className="py-4 text-sm text-muted-foreground">{submission.storage}</td>
                  <td className="py-4 text-sm font-medium text-foreground">
                    {submission.bidPrice > 0 ? `$${submission.bidPrice.toLocaleString()}` : (submission.estimatedPrice ? `~$${submission.estimatedPrice.toLocaleString()}` : 'N/A')}
                  </td>
                  <td className="py-4">{getStatusBadge(submission.status)}</td>
                  <td className="py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/submissions')}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
