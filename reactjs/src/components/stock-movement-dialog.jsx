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

export function StockMovementDialog({ open, onOpenChange, onClose }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: '',
    quantity: '',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      fetchProducts();
      setFormData({
        product_id: '',
        movement_type: '',
        quantity: '',
        reference_number: '',
        notes: '',
      });
      setSelectedProduct(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.product_id || !formData.movement_type || !formData.quantity) {
        throw new Error('Please fill in all required fields');
      }

      const quantity = parseInt(formData.quantity);
      if (isNaN(quantity) || quantity < 0) {
        throw new Error('Invalid quantity');
      }

      if (formData.movement_type === 'OUT' && selectedProduct && quantity > selectedProduct.quantity) {
        throw new Error(
          `Insufficient stock. Only ${selectedProduct.quantity} units available`
        );
      }

      // MongoDB expects ObjectId as string, not integer
      await api.post('/stock-movements', {
        product_id: formData.product_id, // Keep as string for MongoDB ObjectId
        movement_type: formData.movement_type,
        quantity: quantity, // Send as number
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
      });

      toast({
        title: 'Success',
        description: 'Stock movement recorded successfully',
      });

      onClose();
    } catch (error) {
      console.error('Stock movement error:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to create stock movement',
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
          <DialogTitle>Add Stock Movement</DialogTitle>
          <DialogDescription>Record stock in, out, or adjustment</DialogDescription>
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
                    >
                      {product.name} - Current: {product.quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement_type">Movement Type *</Label>
              <Select
                value={formData.movement_type}
                onValueChange={(value) => setFormData({ ...formData, movement_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Stock In (Add)</SelectItem>
                  <SelectItem value="OUT">Stock Out (Remove)</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment (Set)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity *{formData.movement_type === 'ADJUSTMENT' && ' (New Total)'}
              </Label>
              <Input
                id="quantity"
                type="number"
                min={formData.movement_type === 'ADJUSTMENT' ? '0' : '1'}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              {selectedProduct && formData.quantity && formData.movement_type && (
                <p className="text-sm text-muted-foreground">
                  {formData.movement_type === 'IN' && (
                    <>
                      New stock: {selectedProduct.quantity} + {formData.quantity} ={' '}
                      {selectedProduct.quantity + parseInt(formData.quantity)}
                    </>
                  )}
                  {formData.movement_type === 'OUT' && (
                    <>
                      New stock: {selectedProduct.quantity} - {formData.quantity} ={' '}
                      {selectedProduct.quantity - parseInt(formData.quantity)}
                    </>
                  )}
                  {formData.movement_type === 'ADJUSTMENT' && (
                    <>New stock will be set to: {formData.quantity}</>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={formData.reference_number}
                onChange={(e) =>
                  setFormData({ ...formData, reference_number: e.target.value })
                }
                placeholder="PO-123, SO-456, etc."
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Recording...' : 'Record Movement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

