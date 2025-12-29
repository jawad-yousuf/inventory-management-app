import DashboardLayout from '../components/dashboard-layout';
import ProductsTable from '../components/products-table';
import { useAuth } from '../contexts/AuthContext';

export default function ProductsPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product inventory</p>
        </div>
        <ProductsTable />
      </div>
    </DashboardLayout>
  );
}

