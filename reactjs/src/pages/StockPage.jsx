import DashboardLayout from '../components/dashboard-layout';
import StockMovementsTable from '../components/stock-movements-table';
import { useAuth } from '../contexts/AuthContext';

export default function StockPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Stock Movements</h1>
          <p className="text-muted-foreground mt-1">Track all inventory stock changes</p>
        </div>
        <StockMovementsTable />
      </div>
    </DashboardLayout>
  );
}

