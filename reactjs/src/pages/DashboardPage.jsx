import DashboardLayout from '../components/dashboard-layout';
import DashboardOverview from '../components/dashboard-overview';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user}>
      <DashboardOverview />
    </DashboardLayout>
  );
}

