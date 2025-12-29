import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import api from '../lib/api';

export function SalesDialog({ open, onOpenChange, onClose }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    customer_name: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleProductChange = (productId) => {
    const product = products.find((p) => (p._id || p.id).toString() === productId);
    setSelectedProduct(product || null);
    setFormData({ ...formData, product_id: productId });
  };

  const calculateTotal = () => {
    if (!selectedProduct || !formData.quantity) return '0.00';
    return (parseFloat(selectedProduct.price) * parseInt(formData.quantity)).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedProduct) {
        throw new Error('Please select a product');
      }

      const quantity = parseInt(formData.quantity);
      if (quantity > selectedProduct.quantity) {
        throw new Error(
          `Insufficient stock. Only ${selectedProduct.quantity} units available`
        );
      }

      await api.post('/sales', {
        product_id: formData.product_id,
        quantity,
        customer_name: formData.customer_name || null,
        notes: formData.notes || null,
      });

      toast({
        title: 'Success',
        description: 'Sale recorded successfully',
      });

      setFormData({ product_id: '', quantity: '', customer_name: '', notes: '' });
      setSelectedProduct(null);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Sale</DialogTitle>
          <DialogDescription>
            Create a new sales transaction and update inventory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select
                value={formData.product_id}
                onValueChange={handleProductChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem
                      key={product._id || product.id}
                      value={(product._id || product.id).toString()}
                      disabled={product.quantity === 0}
                    >
                      {product.name} - Stock: {product.quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per unit:</span>
                  <span className="font-medium">
                    ${parseFloat(selectedProduct.price).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available stock:</span>
                  <span className="font-medium">{selectedProduct.quantity} units</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.quantity || undefined}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            {selectedProduct && formData.quantity && (
              <div className="rounded-lg bg-primary/10 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-xl font-bold text-primary">${calculateTotal()}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customer">Customer Name</Label>
              <Input
                id="customer"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedProduct}>
              {loading ? 'Recording...' : 'Record Sale'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

