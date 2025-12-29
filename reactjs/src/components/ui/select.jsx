import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const SelectContext = createContext(null);

export function Select({ value, onValueChange, children, ...props }) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef(null);

  // Helper function to extract text from React nodes
  const getTextContent = (node) => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) {
      return node.map(getTextContent).join('');
    }
    if (node?.props?.children) {
      return getTextContent(node.props.children);
    }
    return '';
  };

  // Update selectedLabel when value changes externally (e.g., when editing)
  useEffect(() => {
    if (value) {
      // Try to find the label from children when value is set externally
      const findLabelFromChildren = (childrenNodes) => {
        if (!childrenNodes) return '';
        const childrenArray = React.Children.toArray(childrenNodes);
        for (const child of childrenArray) {
          // Check if this is a SelectItem with matching value
          if (child?.props?.value !== undefined) {
            const childValue = child.props.value;
            if (childValue === value || childValue?.toString() === value?.toString()) {
              const childContent = child.props.children;
              return getTextContent(childContent);
            }
          }
          // Recursively search in nested children (like SelectContent)
          if (child?.props?.children) {
            const nested = findLabelFromChildren(child.props.children);
            if (nested) return nested;
          }
        }
        return '';
      };
      
      const label = findLabelFromChildren(children);
      if (label && label !== selectedLabel) {
        setSelectedLabel(label);
      }
    } else if (!value) {
      // Clear label when value is cleared
      setSelectedLabel('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleValueChange = (newValue, label) => {
    setSelectedLabel(label || '');
    onValueChange?.(newValue);
  };

  return (
    <SelectContext.Provider value={{ value, open, setOpen, onValueChange: handleValueChange, selectedLabel, setSelectedLabel }}>
      <div className="relative" ref={selectRef} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children, ...props }) {
  const context = useContext(SelectContext);
  if (!context) {
    console.error('SelectTrigger must be used inside Select component');
    return null;
  }
  const { open, setOpen } = context;
  return (
    <button
      type="button"
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectValue({ placeholder }) {
  const context = useContext(SelectContext);
  if (!context) {
    return <span>{placeholder}</span>;
  }
  const { value, selectedLabel } = context;
  
  // Show the selected label if available, otherwise show value or placeholder
  return <span>{selectedLabel || value || placeholder}</span>;
}

export function SelectContent({ className, children, ...props }) {
  const context = useContext(SelectContext);
  if (!context) {
    return null;
  }
  const { open } = context;
  if (!open) return null;
  return (
    <div
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, className, children, ...props }) {
  const context = useContext(SelectContext);
  if (!context) {
    return null;
  }
  const { onValueChange, setOpen, setSelectedLabel } = context;
  
  // Extract text content from children (handle React elements)
  const getTextContent = (children) => {
    if (typeof children === 'string') return children;
    if (typeof children === 'number') return String(children);
    if (Array.isArray(children)) {
      return children.map(getTextContent).join('');
    }
    if (children?.props?.children) {
      return getTextContent(children.props.children);
    }
    return '';
  };
  
  return (
    <div
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground',
        className
      )}
      onClick={() => {
        // Store the label text when item is selected
        const labelText = getTextContent(children);
        setSelectedLabel?.(labelText);
        onValueChange(value, labelText);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

