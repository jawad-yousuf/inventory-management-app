import DashboardLayout from '../components/dashboard-layout';
import SalesTable from '../components/sales-table';
import { useAuth } from '../contexts/AuthContext';

export default function SalesPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Sales Transactions</h1>
          <p className="text-muted-foreground mt-1">Record and track all sales activities</p>
        </div>
        <SalesTable />
      </div>
    </DashboardLayout>
  );
}

