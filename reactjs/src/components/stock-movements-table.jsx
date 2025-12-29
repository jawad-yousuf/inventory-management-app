import { useEffect, useState } from 'react';
import { Plus, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { StockMovementDialog } from './stock-movement-dialog';
import { useToast } from '../hooks/use-toast';
import api from '../lib/api';

export default function StockMovementsTable() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const response = await api.get('/stock-movements?limit=50');
      setMovements(response.data);
    } catch (error) {
      console.error('Failed to fetch stock movements:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch stock movements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    fetchMovements();
  };

  const getMovementIcon = (type) => {
    switch (type) {
      case 'IN':
        return <ArrowUp className="h-4 w-4" />;
      case 'OUT':
        return <ArrowDown className="h-4 w-4" />;
      case 'ADJUSTMENT':
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getMovementVariant = (type) => {
    switch (type) {
      case 'IN':
        return 'default';
      case 'OUT':
        return 'secondary';
      case 'ADJUSTMENT':
        return 'outline';
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Recent Movements</h2>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Movement
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No stock movements yet
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => (
                    <TableRow key={movement._id || movement.id}>
                      <TableCell>
                        <Badge
                          variant={getMovementVariant(movement.movement_type)}
                          className="gap-1"
                        >
                          {getMovementIcon(movement.movement_type)}
                          {movement.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{movement.product_name}</TableCell>
                      <TableCell className="text-right">{movement.quantity}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {movement.reference_number || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {movement.notes || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(movement.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <StockMovementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onClose={closeDialog}
      />
    </>
  );
}

