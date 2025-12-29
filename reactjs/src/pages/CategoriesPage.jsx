import DashboardLayout from '../components/dashboard-layout';
import CategoriesTable from '../components/categories-table';
import { useAuth } from '../contexts/AuthContext';

export default function CategoriesPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your products into categories</p>
        </div>
        <CategoriesTable />
      </div>
    </DashboardLayout>
  );
}

